import { ClientError } from 'graphql-request';
import type {
  GraphQLRequestContext,
  GraphQLResponse,
} from 'graphql-request/dist/types';

export interface GraphQLClientErrorRecord {
  message: string;
  extensions?: any;
  locations?: { line: number; column: number }[];
}

export default class GraphQLClientError extends Error {
  response: GraphQLResponse;
  request: GraphQLRequestContext;
  errors: GraphQLClientErrorRecord[];
  httpStatus: number;

  constructor(error: ClientError) {
    let { request, response, message, stack } = error;

    super(message);

    let { errors } = response;

    this.errors = errors || [];
    this.response = response;
    this.request = request;
    this.httpStatus = response.status;
    this.stack = stack;
  }

  toJSON(): GraphQLClientErrorRecord[] {
    return this.errors;
  }
}
