import graphene
from graphene_django import DjangoObjectType
from django.utils import timezone
from .models import Task, TaskComment
from projects.models import Project


class TaskCommentType(DjangoObjectType):
    """
    Represents a comment on a task, enabling threaded discussions and collaboration.
    Comments are ordered by timestamp in descending order (newest first).
    """
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author_email", "timestamp", "task")
        description = "A comment on a task, enabling team collaboration and communication"


class TaskType(DjangoObjectType):
    """
    Represents a task within a project. Tasks have three states: TODO, IN_PROGRESS, and DONE.
    Tasks can be assigned to team members, have due dates, and support collaborative comments.
    """
    is_overdue = graphene.Boolean(description="Whether the task is overdue (past due date and not completed)")
    comments = graphene.List(TaskCommentType, description="All comments on this task, ordered by newest first")

    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "assignee_email", "due_date", "created_at", "updated_at", "project")
        description = "A task within a project that can be tracked through different status states"

    def resolve_is_overdue(self, info):
        """Calculate if task is overdue based on due date and completion status"""
        return self.is_overdue

    def resolve_comments(self, info):
        """Retrieve all comments for this task with optimized database query"""
        return self.comments.all()


class Query(graphene.ObjectType):
    tasks_by_project = graphene.List(
        TaskType,
        project_id=graphene.ID(required=True, description="ID of the project to retrieve tasks from"),
        description="Retrieve all tasks for a specific project, including comments and task details"
    )
    task_detail = graphene.Field(
        TaskType,
        id=graphene.ID(required=True, description="ID of the task to retrieve"),
        description="Retrieve detailed information about a specific task, including all comments and project context"
    )

    def resolve_tasks_by_project(self, info, project_id):
        try:
            project = Project.objects.get(pk=project_id)
            return Task.objects.filter(project=project).prefetch_related('comments')
        except Project.DoesNotExist:
            return []

    def resolve_task_detail(self, info, id):
        try:
            return Task.objects.select_related('project__organization').prefetch_related('comments').get(pk=id)
        except Task.DoesNotExist:
            return None


class CreateTask(graphene.Mutation):
    """
    Creates a new task within a project. The task will be created with TODO status by default.
    All fields except project_id and title are optional.
    """
    class Arguments:
        project_id = graphene.ID(required=True, description="ID of the project to create the task in")
        title = graphene.String(required=True, description="Title of the task")
        description = graphene.String(description="Detailed description of the task")
        assignee_email = graphene.String(description="Email of the person assigned to this task")
        due_date = graphene.DateTime(description="Due date for task completion")

    task = graphene.Field(TaskType, description="The created task object")
    success = graphene.Boolean(description="Whether the task was created successfully")
    errors = graphene.List(graphene.String, description="List of error messages if creation failed")

    def mutate(self, info, project_id, title, description="", assignee_email="", due_date=None):
        try:
            project = Project.objects.get(pk=project_id)
            
            task = Task.objects.create(
                project=project,
                title=title,
                description=description,
                assignee_email=assignee_email,
                due_date=due_date,
                status='TODO'  # Default status
            )
            
            return CreateTask(
                task=task,
                success=True,
                errors=[]
            )
        except Project.DoesNotExist:
            return CreateTask(
                task=None,
                success=False,
                errors=["Project not found"]
            )
        except Exception as e:
            return CreateTask(
                task=None,
                success=False,
                errors=[str(e)]
            )


class UpdateTask(graphene.Mutation):
    """
    Updates an existing task. Only provided fields will be updated; omitted fields remain unchanged.
    The task status is not updated through this mutation - use UpdateTaskStatus for status changes.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID of the task to update")
        title = graphene.String(description="New title for the task")
        description = graphene.String(description="New description for the task")
        assignee_email = graphene.String(description="New assignee email for the task")
        due_date = graphene.DateTime(description="New due date for the task")

    task = graphene.Field(TaskType, description="The updated task object")
    success = graphene.Boolean(description="Whether the task was updated successfully")
    errors = graphene.List(graphene.String, description="List of error messages if update failed")

    def mutate(self, info, id, title=None, description=None, assignee_email=None, due_date=None):
        try:
            task = Task.objects.get(pk=id)
            
            if title is not None:
                task.title = title
            if description is not None:
                task.description = description
            if assignee_email is not None:
                task.assignee_email = assignee_email
            if due_date is not None:
                task.due_date = due_date
                
            task.save()
            
            return UpdateTask(
                task=task,
                success=True,
                errors=[]
            )
        except Task.DoesNotExist:
            return UpdateTask(
                task=None,
                success=False,
                errors=["Task not found"]
            )
        except Exception as e:
            return UpdateTask(
                task=None,
                success=False,
                errors=[str(e)]
            )


class UpdateTaskStatus(graphene.Mutation):
    """
    Updates the status of a task. This mutation is specifically designed for drag-and-drop operations
    in the task board interface. Valid statuses are: TODO, IN_PROGRESS, DONE.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID of the task to update")
        status = graphene.String(required=True, description="New status: TODO, IN_PROGRESS, or DONE")

    task = graphene.Field(TaskType, description="The updated task object")
    success = graphene.Boolean(description="Whether the status was updated successfully")
    errors = graphene.List(graphene.String, description="List of error messages if update failed")

    def mutate(self, info, id, status):
        try:
            task = Task.objects.get(pk=id)
            
            # Validate status
            valid_statuses = ['TODO', 'IN_PROGRESS', 'DONE']
            if status not in valid_statuses:
                return UpdateTaskStatus(
                    task=None,
                    success=False,
                    errors=[f"Invalid status. Must be one of: {', '.join(valid_statuses)}"]
                )
            
            task.status = status
            task.save()
            
            return UpdateTaskStatus(
                task=task,
                success=True,
                errors=[]
            )
        except Task.DoesNotExist:
            return UpdateTaskStatus(
                task=None,
                success=False,
                errors=["Task not found"]
            )
        except Exception as e:
            return UpdateTaskStatus(
                task=None,
                success=False,
                errors=[str(e)]
            )


class AddTaskComment(graphene.Mutation):
    """
    Adds a comment to a task. Comments enable team collaboration and communication on specific tasks.
    Comments are automatically timestamped and cannot be edited or deleted once created.
    """
    class Arguments:
        task_id = graphene.ID(required=True, description="ID of the task to comment on")
        content = graphene.String(required=True, description="Content of the comment")
        author_email = graphene.String(required=True, description="Email of the comment author")

    comment = graphene.Field(TaskCommentType, description="The created comment object")
    success = graphene.Boolean(description="Whether the comment was added successfully")
    errors = graphene.List(graphene.String, description="List of error messages if creation failed")

    def mutate(self, info, task_id, content, author_email):
        try:
            task = Task.objects.get(pk=task_id)
            
            comment = TaskComment.objects.create(
                task=task,
                content=content,
                author_email=author_email
            )
            
            return AddTaskComment(
                comment=comment,
                success=True,
                errors=[]
            )
        except Task.DoesNotExist:
            return AddTaskComment(
                comment=None,
                success=False,
                errors=["Task not found"]
            )
        except Exception as e:
            return AddTaskComment(
                comment=None,
                success=False,
                errors=[str(e)]
            )


class Mutation(graphene.ObjectType):
    """
    Task-related mutations for creating, updating, and managing tasks and comments.
    All mutations follow the same pattern with success/errors fields for consistent error handling.
    """
    create_task = CreateTask.Field(description="Create a new task in a project")
    update_task = UpdateTask.Field(description="Update task details (title, description, assignee, due date)")
    update_task_status = UpdateTaskStatus.Field(description="Update task status for drag-and-drop operations")
    add_task_comment = AddTaskComment.Field(description="Add a comment to a task for team collaboration")