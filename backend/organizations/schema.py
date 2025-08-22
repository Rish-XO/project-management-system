import graphene
from graphene_django import DjangoObjectType
from .models import Organization


class OrganizationType(DjangoObjectType):
    """
    Represents an organization that serves as a multi-tenant container for projects and tasks.
    Organizations provide data isolation and manage teams and projects within their scope.
    """
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at")
        description = "An organization that contains projects and provides multi-tenant data isolation"


class Query(graphene.ObjectType):
    organization_list = graphene.List(
        OrganizationType,
        description="Retrieve all organizations in the system"
    )
    organization_detail = graphene.Field(
        OrganizationType, 
        slug=graphene.String(required=True, description="Unique slug identifier for the organization"),
        description="Retrieve detailed information about a specific organization by slug"
    )

    def resolve_organization_list(self, info):
        return Organization.objects.all()

    def resolve_organization_detail(self, info, slug):
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return None


class CreateOrganization(graphene.Mutation):
    """
    Creates a new organization with auto-generated slug based on the organization name.
    Organizations must have unique names and valid contact email addresses.
    """
    class Arguments:
        name = graphene.String(required=True, description="Name of the organization (must be unique)")
        contact_email = graphene.String(required=True, description="Contact email for the organization")

    organization = graphene.Field(OrganizationType, description="The created organization object")
    success = graphene.Boolean(description="Whether the organization was created successfully")
    errors = graphene.List(graphene.String, description="List of error messages if creation failed")

    def mutate(self, info, name, contact_email):
        try:
            organization = Organization.objects.create(
                name=name,
                contact_email=contact_email
            )
            return CreateOrganization(
                organization=organization,
                success=True,
                errors=[]
            )
        except Exception as e:
            return CreateOrganization(
                organization=None,
                success=False,
                errors=[str(e)]
            )


class UpdateOrganization(graphene.Mutation):
    """
    Updates an existing organization. Only provided fields will be updated; omitted fields remain unchanged.
    Note: The organization slug is auto-generated from the name and cannot be updated directly.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID of the organization to update")
        name = graphene.String(description="New name for the organization")
        contact_email = graphene.String(description="New contact email for the organization")

    organization = graphene.Field(OrganizationType, description="The updated organization object")
    success = graphene.Boolean(description="Whether the organization was updated successfully")
    errors = graphene.List(graphene.String, description="List of error messages if update failed")

    def mutate(self, info, id, name=None, contact_email=None):
        try:
            organization = Organization.objects.get(pk=id)
            
            if name is not None:
                organization.name = name
            if contact_email is not None:
                organization.contact_email = contact_email
                
            organization.save()
            
            return UpdateOrganization(
                organization=organization,
                success=True,
                errors=[]
            )
        except Organization.DoesNotExist:
            return UpdateOrganization(
                organization=None,
                success=False,
                errors=["Organization not found"]
            )
        except Exception as e:
            return UpdateOrganization(
                organization=None,
                success=False,
                errors=[str(e)]
            )


class Mutation(graphene.ObjectType):
    """
    Organization-related mutations for managing multi-tenant organizations.
    Organizations serve as containers for projects and provide data isolation.
    """
    create_organization = CreateOrganization.Field(description="Create a new organization with auto-generated slug")
    update_organization = UpdateOrganization.Field(description="Update organization details (name, contact email)")