import GraphQLService from '@ember-graphql-client/client/services/graphql';
import { GraphQLRequestClientInterface } from '@ember-graphql-client/client/utils/graphql-request-client';
import { getMockGraphQLRequestClient } from '@ember-graphql-client/mock/mock-graphql-request-client';
import { IResolvers } from '@graphql-tools/utils';
import { DocumentNode } from 'graphql';

export function mockGraphQLForTests(
  hooks: NestedHooks,
  schema: DocumentNode,
  resolvers: IResolvers | IResolvers[]
): void {
  hooks.beforeEach(function () {
    let graphql = this.owner.lookup('service:graphql') as GraphQLService;
    setupMockGraphQLRequestClient(graphql, schema, resolvers);
  });
}

export function setupMockGraphQLRequestClient(
  graphql: GraphQLService,
  schema: DocumentNode,
  resolvers: IResolvers | IResolvers[]
): GraphQLRequestClientInterface {
  let client = getMockGraphQLRequestClient(schema, resolvers);
  graphql.client = client;

  return client;
}
