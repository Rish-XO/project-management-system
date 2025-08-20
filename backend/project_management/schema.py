import graphene
import organizations.schema
import projects.schema
import tasks.schema


class Query(
    organizations.schema.Query,
    projects.schema.Query,
    tasks.schema.Query,
    graphene.ObjectType
):
    # Test query for initial setup verification
    hello = graphene.String(default_value="GraphQL is working!")


class Mutation(
    organizations.schema.Mutation,
    projects.schema.Mutation,
    tasks.schema.Mutation,
    graphene.ObjectType
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)