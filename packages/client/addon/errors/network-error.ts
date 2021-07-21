export class GraphQLNetworkError extends Error {
  constructor() {
    super('A network error occurred');
  }
}

export default GraphQLNetworkError;
