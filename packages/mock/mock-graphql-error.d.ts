import { GraphQLError, Source } from 'graphql';

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
