import { getMockGraphQLRequestClient } from '@ember-graphql-client/mock/mock-graphql-request-client';

export function mockGraphQLForTests(hooks, schema, resolvers) {
  hooks.beforeEach(function () {
    let graphql = this.owner.lookup('service:graphql');
    setupMockGraphQLRequestClient(graphql, schema, resolvers);
  });
}

export function setupMockGraphQLRequestClient(graphql, schema, resolvers) {
  let client = getMockGraphQLRequestClient(schema, resolvers);
  graphql.client = client;

  return client;
}
