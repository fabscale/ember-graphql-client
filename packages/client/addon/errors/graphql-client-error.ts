import { ClientError } from 'graphql-request';
import {
  GraphQLError,
  GraphQLRequestContext,
  GraphQLResponse,
} from 'graphql-request/dist/types';

export type GraphQLClientErrorRecord = GraphQLError;

export class GraphQLClientError extends Error {
  response: GraphQLResponse;
  request: GraphQLRequestContext;
  errors: GraphQLClientErrorRecord[];
  httpStatus: number;

  constructor(error: ClientError) {
    let { request, response, message, stack } = error;

    super(message);

    // E.g. when a 404 or 50x error happens, the HTML body of the response will be in `error` of `response`.
    let { errors, error: errorMessage, status } = response;

    if (!errors && errorMessage) {
      errors = [
        {
          message: errorMessage,
          locations: [],
          path: [],
          extensions: {
            IS_PLAIN_ERROR: true,
          },
        },
      ] as unknown as GraphQLClientErrorRecord[];
    }

    this.errors = errors || [];
    this.response = response;
    this.request = request;
    this.httpStatus = status;
    this.stack = stack;
  }

  toJSON(): GraphQLClientErrorRecord[] {
    return this.errors;
  }
}

export default GraphQLClientError;
