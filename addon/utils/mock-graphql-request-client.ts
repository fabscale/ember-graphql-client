import { getOwnConfig, importSync, macroCondition } from '@embroider/macros';
import type { IResolvers } from '@graphql-tools/utils';
import type {
  DocumentNode,
  ExecutionResult,
  GraphQLError,
  GraphQLSchema,
} from 'graphql';
import { execute, print } from 'graphql';
import {
  ClientError,
  GraphQLError as GraphQLRequestError,
  GraphQLRequestContext,
  GraphQLResponse,
} from 'graphql-request/dist/types';
import {
  GraphQLRequestClientInterface,
  MutationOptions,
  QueryOptions,
} from './graphql-request-client';

export function getMockGraphQLRequestClient(
  schema: DocumentNode,
  resolvers: IResolvers | IResolvers[]
): GraphQLRequestClientInterface | undefined {
  return macroCondition(getOwnConfig<any>().enableMocks)
    ? new MockGraphQLRequestClient(schema, resolvers)
    : undefined;
}

class MockGraphQLRequestClient implements GraphQLRequestClientInterface {
  _schema?: GraphQLSchema;
  typeDefs: DocumentNode;
  resolvers: IResolvers | IResolvers[];

  constructor(typeDefs: DocumentNode, resolvers: IResolvers | IResolvers[]) {
    this.typeDefs = typeDefs;
    this.resolvers = resolvers;
  }

  getSchema() {
    if (this._schema) {
      return this._schema;
    }

    let { typeDefs, resolvers } = this;
    let { makeExecutableSchema } = importSync('@graphql-tools/schema') as any;

    let schema = makeExecutableSchema({ typeDefs, resolvers });
    this._schema = schema;

    return schema;
  }

  async query(options: QueryOptions): Promise<any> {
    let schema = this.getSchema();
    let { query, variables } = options;

    let result = await execute({
      schema,
      document: query,
      variableValues: variables,
    });

    let executionContext = {
      query: print(query),
      variables,
    };

    this._throwIfHasErrors(result, executionContext);

    return result.data;
  }

  async mutate(options: MutationOptions): Promise<any> {
    let schema = this.getSchema();
    let { mutation, variables } = options;

    let result = await execute({
      schema,
      document: mutation,
      variableValues: variables,
    });

    let executionContext = {
      query: print(mutation),
      variables,
    };

    this._throwIfHasErrors(result, executionContext);

    return result.data;
  }

  _throwIfHasErrors(
    result: ExecutionResult,
    executionContext: GraphQLRequestContext
  ): void {
    if (result.errors) {
      let errors = result.errors.map((error) => {
        let json = JSON.parse(JSON.stringify(error));

        return Object.assign({ name: 'GraphQLError' }, json);
      }) as GraphQLRequestError[];

      let response: GraphQLResponse = {
        errors,
        status: 400,
      };

      throw new ClientError(response, executionContext);
    }
  }

  _handleValidationErrors(
    validationErrors: GraphQLError[],
    requestContext: GraphQLRequestContext
  ) {
    if (validationErrors.length > 0) {
      let errors = validationErrors.map((error) => {
        let json = JSON.parse(JSON.stringify(error));

        return Object.assign({ name: 'GraphQLError' }, json);
      });

      let response: GraphQLResponse = {
        errors,
        status: 400,
      };

      throw new ClientError(response, requestContext);
    }
  }
}
