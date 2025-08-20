import graphene
from graphene_django import DjangoObjectType
from django.db.models import Count, Q
from .models import Project
from organizations.models import Organization


class ProjectType(DjangoObjectType):
    task_count = graphene.Int()
    completed_tasks = graphene.Int()
    completion_percentage = graphene.Float()

    class Meta:
        model = Project
        fields = ("id", "name", "description", "status", "due_date", "created_at", "updated_at", "organization")

    def resolve_task_count(self, info):
        return self.task_count

    def resolve_completed_tasks(self, info):
        return self.completed_tasks

    def resolve_completion_percentage(self, info):
        return self.completion_percentage


class ProjectStatisticsType(graphene.ObjectType):
    project_id = graphene.ID()
    total_tasks = graphene.Int()
    completed_tasks = graphene.Int()
    in_progress_tasks = graphene.Int()
    todo_tasks = graphene.Int()
    completion_percentage = graphene.Float()


class Query(graphene.ObjectType):
    projects_by_organization = graphene.List(
        ProjectType,
        organization_slug=graphene.String(required=True)
    )
    project_detail = graphene.Field(
        ProjectType,
        id=graphene.ID(required=True)
    )
    project_statistics = graphene.Field(
        ProjectStatisticsType,
        project_id=graphene.ID(required=True)
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
    class Arguments:
        organization_id = graphene.ID(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        status = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()