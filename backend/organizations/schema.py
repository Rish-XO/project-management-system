import graphene
from graphene_django import DjangoObjectType
from .models import Organization


class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "created_at")


class Query(graphene.ObjectType):
    organization_list = graphene.List(OrganizationType)
    organization_detail = graphene.Field(
        OrganizationType, 
        slug=graphene.String(required=True)
    )

    def resolve_organization_list(self, info):
        return Organization.objects.all()

    def resolve_organization_detail(self, info, slug):
        try:
            return Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return None


class CreateOrganization(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        contact_email = graphene.String(required=True)

    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        contact_email = graphene.String()

    organization = graphene.Field(OrganizationType)
    success = graphene.Boolean()
    errors = graphene.List(graphene.String)

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
    create_organization = CreateOrganization.Field()
    update_organization = UpdateOrganization.Field()