declare module '@ember-graphql-client/mock/mock-graphql-error' {
  import type { GraphQLError, Source } from 'graphql';

  interface GraphQLErrorInterface {
    message: string;
    source?: Source;
    positions?: ReadonlyArray<number>;
    path?: ReadonlyArray<string | number>;
    originalError?: Error;
    extensions?: { [key: string]: any };
  }

  export function mockGraphQLError({
    message,
    source,
    positions,
    path,
    originalError,
    extensions,
  }: GraphQLErrorInterface): GraphQLError;
}

declare module '@ember-graphql-client/mock/mock-graphql-request-client' {
  import type { IResolvers } from '@graphql-tools/utils';
  import type { DocumentNode } from 'graphql';

  export function getMockGraphQLRequestClient(
    schema: DocumentNode,
    resolvers: IResolvers | IResolvers[]
  ): MockGraphQLRequestClient;

  class MockGraphQLRequestClient {
    constructor(typeDefs: DocumentNode, resolvers: IResolvers | IResolvers[]);

    query(options: any): Promise<any>;
    mutate(options: any): Promise<any>;
  }
}

declare module '@ember-graphql-client/mock/test-support/helpers' {
  import type { IResolvers } from '@graphql-tools/utils';
  import type { DocumentNode } from 'graphql';

  export function mockGraphQLForTests(
    hooks: NestedHooks,
    schema: DocumentNode,
    resolvers: IResolvers | IResolvers[]
  ): void;

  export function setupMockGraphQLRequestClient(
    graphql: any,
    schema: DocumentNode,
    resolvers: IResolvers | IResolvers[]
  ): MockGraphQLRequestClient;

  class MockGraphQLRequestClient {
    constructor(typeDefs: DocumentNode, resolvers: IResolvers | IResolvers[]);

    query(options: any): Promise<any>;
    mutate(options: any): Promise<any>;
  }
}
