import { getOwnConfig, macroCondition } from '@embroider/macros';
import { GraphQLError } from 'graphql';
import type { Source } from 'graphql';

interface GraphQLErrorInterface {
  message: string;
  source?: Source;
  positions?: ReadonlyArray<number>;
  path?: ReadonlyArray<string | number>;
  originalError?: Error;
  extensions?: { [key: string]: any };
}

export function mockGraphQLError(
  error: GraphQLErrorInterface
): GraphQLError | undefined {
  return macroCondition(getOwnConfig<any>().enableMocks)
    ? generateMockGraphQLError(error)
    : undefined;
}

function generateMockGraphQLError({
  message,
  source,
  positions,
  path,
  originalError,
  extensions,
}: GraphQLErrorInterface): GraphQLError {
  return new GraphQLError(
    message,
    undefined,
    source,
    positions,
    path,
    originalError,
    extensions
  );
}
