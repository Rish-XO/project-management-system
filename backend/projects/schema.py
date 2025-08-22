import graphene
from graphene_django import DjangoObjectType
from django.db.models import Count, Q
from .models import Project
from organizations.models import Organization


class ProjectType(DjangoObjectType):
    """
    Represents a project within an organization. Projects contain tasks and have status tracking.
    Projects can be in ACTIVE, COMPLETED, or ON_HOLD status.
    """
    task_count = graphene.Int(description="Total number of tasks in this project")
    completed_tasks = graphene.Int(description="Number of completed tasks in this project")
    completion_percentage = graphene.Float(description="Percentage of completed tasks (0-100)")

    class Meta:
        model = Project
        fields = ("id", "name", "description", "status", "due_date", "created_at", "updated_at", "organization")
        description = "A project within an organization that contains tasks and tracks progress"

    def resolve_task_count(self, info):
        """Get total number of tasks in this project"""
        return self.task_count

    def resolve_completed_tasks(self, info):
        """Get number of completed tasks in this project"""
        return self.completed_tasks

    def resolve_completion_percentage(self, info):
        """Calculate completion percentage based on completed vs total tasks"""
        return self.completion_percentage


class ProjectStatisticsType(graphene.ObjectType):
    """
    Detailed statistics for a project including task breakdown by status.
    Useful for dashboards and project progress visualization.
    """
    project_id = graphene.ID(description="ID of the project these statistics belong to")
    total_tasks = graphene.Int(description="Total number of tasks in the project")
    completed_tasks = graphene.Int(description="Number of tasks with DONE status")
    in_progress_tasks = graphene.Int(description="Number of tasks with IN_PROGRESS status")
    todo_tasks = graphene.Int(description="Number of tasks with TODO status")
    completion_percentage = graphene.Float(description="Percentage of completion (0-100)")


class Query(graphene.ObjectType):
    projects_by_organization = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True, description="Slug of the organization to retrieve projects from"),
        description="Retrieve all projects for a specific organization"
    )
    project_detail = graphene.Field(
        ProjectType,
        id=graphene.ID(required=True, description="ID of the project to retrieve"),
        description="Retrieve detailed information about a specific project including tasks"
    )
    project_statistics = graphene.Field(
        ProjectStatisticsType,
        project_id=graphene.ID(required=True, description="ID of the project to get statistics for"),
        description="Get detailed task statistics for a project (total, completed, in progress, etc.)"
    )

    def resolve_projects_by_organization(self, info, organization_slug):
        try:
            organization = Organization.objects.get(slug=organization_slug)
            return Project.objects.filter(organization=organization)
        except Organization.DoesNotExist:
            return []

    def resolve_project_detail(self, info, id):
        try:
            return Project.objects.select_related('organization').prefetch_related('tasks').get(pk=id)
        except Project.DoesNotExist:
            return None

    def resolve_project_statistics(self, info, project_id):
        try:
            project = Project.objects.get(pk=project_id)
            tasks = project.tasks.all()
            
            total_tasks = tasks.count()
            completed_tasks = tasks.filter(status='DONE').count()
            in_progress_tasks = tasks.filter(status='IN_PROGRESS').count()
            todo_tasks = tasks.filter(status='TODO').count()
            
            completion_percentage = 0
            if total_tasks > 0:
                completion_percentage = round((completed_tasks / total_tasks) * 100, 1)
            
            return ProjectStatisticsType(
                project_id=project_id,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                in_progress_tasks=in_progress_tasks,
                todo_tasks=todo_tasks,
                completion_percentage=completion_percentage
            )
        except Project.DoesNotExist:
            return None


class CreateProject(graphene.Mutation):
    """
    Creates a new project within an organization. Projects are created with ACTIVE status by default.
    Valid status values are: ACTIVE, COMPLETED, ON_HOLD.
    """
    class Arguments:
        organization_id = graphene.ID(required=True, description="ID of the organization to create the project in")
        name = graphene.String(required=True, description="Name of the project")
        description = graphene.String(description="Detailed description of the project")
        status = graphene.String(description="Project status: ACTIVE, COMPLETED, or ON_HOLD (default: ACTIVE)")
        due_date = graphene.Date(description="Due date for project completion")

    project = graphene.Field(ProjectType, description="The created project object")
    success = graphene.Boolean(description="Whether the project was created successfully")
    errors = graphene.List(graphene.String, description="List of error messages if creation failed")

    def mutate(self, info, organization_id, name, description="", status="ACTIVE", due_date=None):
        try:
            organization = Organization.objects.get(pk=organization_id)
            
            # Validate status
            valid_statuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD']
            if status not in valid_statuses:
                return CreateProject(
                    project=None,
                    success=False,
                    errors=[f"Invalid status. Must be one of: {', '.join(valid_statuses)}"]
                )
            
            project = Project.objects.create(
                organization=organization,
                name=name,
                description=description,
                status=status,
                due_date=due_date
            )
            
            return CreateProject(
                project=project,
                success=True,
                errors=[]
            )
        except Organization.DoesNotExist:
            return CreateProject(
                project=None,
                success=False,
                errors=["Organization not found"]
            )
        except Exception as e:
            return CreateProject(
                project=None,
                success=False,
                errors=[str(e)]
            )


class UpdateProject(graphene.Mutation):
    """
    Updates an existing project. Only provided fields will be updated; omitted fields remain unchanged.
    Status validation is enforced - only ACTIVE, COMPLETED, ON_HOLD values are accepted.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID of the project to update")
        name = graphene.String(description="New name for the project")
        description = graphene.String(description="New description for the project")
        status = graphene.String(description="New status: ACTIVE, COMPLETED, or ON_HOLD")
        due_date = graphene.Date(description="New due date for the project")

    project = graphene.Field(ProjectType, description="The updated project object")
    success = graphene.Boolean(description="Whether the project was updated successfully")
    errors = graphene.List(graphene.String, description="List of error messages if update failed")

    def mutate(self, info, id, name=None, description=None, status=None, due_date=None):
        try:
            project = Project.objects.get(pk=id)
            
            if name is not None:
                project.name = name
            if description is not None:
                project.description = description
            if status is not None:
                valid_statuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD']
                if status not in valid_statuses:
                    return UpdateProject(
                        project=None,
                        success=False,
                        errors=[f"Invalid status. Must be one of: {', '.join(valid_statuses)}"]
                    )
                project.status = status
            if due_date is not None:
                project.due_date = due_date
                
            project.save()
            
            return UpdateProject(
                project=project,
                success=True,
                errors=[]
            )
        except Project.DoesNotExist:
            return UpdateProject(
                project=None,
                success=False,
                errors=["Project not found"]
            )
        except Exception as e:
            return UpdateProject(
                project=None,
                success=False,
                errors=[str(e)]
            )


class Mutation(graphene.ObjectType):
    """
    Project-related mutations for creating and updating projects within organizations.
    All mutations follow the same pattern with success/errors fields for consistent error handling.
    """
    create_project = CreateProject.Field(description="Create a new project in an organization")
    update_project = UpdateProject.Field(description="Update project details (name, description, status, due date)")