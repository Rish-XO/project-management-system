import graphene

class Query(graphene.ObjectType):
    hello = graphene.String(default_value="GraphQL is working!")

# Remove empty Mutation class for now
schema = graphene.Schema(query=Query)