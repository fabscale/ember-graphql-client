import { makeExecutableSchema } from '@graphql-tools/schema';
import { execute, print } from 'graphql';
import { ClientError } from 'graphql-request/dist/types';

export function getMockGraphQLRequestClient(schema, resolvers) {
  return new MockGraphQLRequestClient(schema, resolvers);
}

class MockGraphQLRequestClient {
  _schema;
  typeDefs;
  resolvers;

  constructor(typeDefs, resolvers) {
    this.typeDefs = typeDefs;
    this.resolvers = resolvers;
  }

  getSchema() {
    if (this._schema) {
      return this._schema;
    }

    let { typeDefs, resolvers } = this;

    let schema = makeExecutableSchema({ typeDefs, resolvers });
    this._schema = schema;

    return schema;
  }

  async query(options) {
    let schema = this.getSchema();
    let { query, variables, namespace } = options;

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

    let { data } = result;
    return namespace && data ? data[namespace] : data;
  }

  async mutate(options) {
    let schema = this.getSchema();
    let { mutation, variables, namespace } = options;

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

    let { data } = result;
    return namespace && data ? data[namespace] : data;
  }

  _throwIfHasErrors(result, executionContext) {
    if (result.errors) {
      let errors = result.errors.map((error) => {
        let json = JSON.parse(JSON.stringify(error));

        return Object.assign({ name: 'GraphQLError' }, json);
      });

      let response = {
        errors,
        status: 200,
      };

      throw new ClientError(response, executionContext);
    }
  }
}
