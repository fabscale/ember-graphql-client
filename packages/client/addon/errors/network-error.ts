export default class GraphQLNetworkError extends Error {
  constructor() {
    super('A network error occurred');
  }
}
