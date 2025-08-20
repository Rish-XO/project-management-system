import graphene
from graphene_django import DjangoObjectType
from django.utils import timezone
from .models import Task, TaskComment
from projects.models import Project


class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author_email", "timestamp", "task")


class TaskType(DjangoObjectType):
    is_overdue = graphene.Boolean()
    comments = graphene.List(TaskCommentType)

    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "assignee_email", "due_date", "created_at", "updated_at", "project")

    def resolve_is_overdue(self, info):
        return self.is_overdue

    def resolve_comments(self, info):
        return self.comments.all()


class Query(graphene.ObjectType):
    tasks_by_project = graphene.List(
        TaskType,
        project_id=graphene.ID(required=True)
    )
    task_detail = graphene.Field(
        TaskType,
        id=graphene.ID(required=True)
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
    class Arguments:
        project_id = graphene.ID(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    class Arguments:
        id = graphene.ID(required=True)
        title = graphene.String()
        description = graphene.String()
        assignee_email = graphene.String()
        due_date = graphene.DateTime()

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    class Arguments:
        id = graphene.ID(required=True)
        status = graphene.String(required=True)

    task = graphene.Field(TaskType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    class Arguments:
        task_id = graphene.ID(required=True)
        content = graphene.String(required=True)
        author_email = graphene.String(required=True)

    comment = graphene.Field(TaskCommentType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    update_task_status = UpdateTaskStatus.Field()
    add_task_comment = AddTaskComment.Field()