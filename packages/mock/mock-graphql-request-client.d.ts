import { IResolvers } from '@graphql-tools/utils';
import { DocumentNode } from 'graphql';

export function getMockGraphQLRequestClient(
  schema: DocumentNode,
  resolvers: IResolvers | IResolvers[]
): MockGraphQLRequestClient;

declare class MockGraphQLRequestClient {
  constructor(typeDefs: DocumentNode, resolvers: IResolvers | IResolvers[]);

  query(options: any, cacheOptions?: any, client?: any): Promise<any>;
  mutate(options: any, cacheOptions?: any, client?: any): Promise<any>;
}
