import { GraphQLError } from 'graphql';

export function mockGraphQLError({
  message,
  source,
  positions,
  path,
  originalError,
  extensions,
}) {
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
