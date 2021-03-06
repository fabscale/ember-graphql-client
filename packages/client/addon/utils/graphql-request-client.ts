import type { DocumentNode } from 'graphql';
import { GraphQLClient } from 'graphql-request';

export interface QueryOptions {
  query: DocumentNode;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
  namespace?: string;
}

export interface MutationOptions {
  mutation: DocumentNode;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
  namespace?: string;
}

export interface GraphQLRequestClientInterface {
  query(options: QueryOptions): Promise<any>;
  mutate(options: MutationOptions): Promise<any>;
}

export class GraphQLRequestClient implements GraphQLRequestClientInterface {
  client: GraphQLClient;

  constructor(client: GraphQLClient) {
    this.client = client;
  }

  async query({
    query,
    variables,
    headers,
    namespace,
  }: QueryOptions): Promise<any> {
    let response = await this.client.request(query, variables, headers);

    return namespace && response ? response[namespace] : response;
  }

  async mutate({
    mutation,
    variables,
    headers,
    namespace,
  }: MutationOptions): Promise<any> {
    let response = await this.client.request(mutation, variables, headers);

    return namespace && response ? response[namespace] : response;
  }
}

export default GraphQLRequestClient;
