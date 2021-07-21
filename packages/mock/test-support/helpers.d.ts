import { IResolvers } from '@graphql-tools/utils';
import { DocumentNode } from 'graphql';

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

  query(options: any, cacheOptions?: any, client?: any): Promise<any>;
  mutate(options: any, cacheOptions?: any, client?: any): Promise<any>;
}
