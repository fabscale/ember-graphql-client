# @ember-graphql-client/client

An addon to work with a GraphQL API with a minimal API and easy to use caching.

## Compatibility

- Ember.js v3.24 or above
- Ember CLI v3.24 or above
- Node.js v12 or above

## Installation

```
ember install @ember-graphql-client/client
```

## Configuration

You can configure this addon either in the `config/environment.js` file:

```js
let ENV = {
  // ...

  graphql: {
    apiURL: 'https://my-api.com/graphql',
    options: {}, // other options to pass to graphql-request
  },
};
```

Alternatively, you can also set configuration on the `graphql` service:

```js
export default class ApplicationRoute extends Route {
  @service graphql;

  beforeModel() {
    this.graphql.headers = {
      'My-Custom-Header': 'value',
    };

    this.graphql.apiURL = 'https://my-api.com/graphql';
    this.graphql.options = {}; // custom graphql-request options
  }
}
```

Or you can extend the graphql service and overwrite the getters:

```js
import GraphQLService from '@ember-graphql-client/client/services/graphql';

export default class CustomGraphQLService extends GraphQLService {
  get apiURL() {
    return 'https://my-api.com/graphql';
  }

  get headers() {
    return this.isAuthenticated ? { Authorization: this.authToken } : {};
  }

  get options() {
    return {};
  }
}
```

### Working with TypeScript

By default, TypeScript will complain about the imports of `.graphl` files.
To make this work, you can add the following to your `global.d.ts` file:

```js
declare module '*.graphql' {
  import { DocumentNode } from 'graphql';
  let content: DocumentNode;
  export default content;
}
```

## Usage

The graphql service provides two main methods: `.query()` and `.mutate()`.

Under the hood, this uses broccoli-graphql-filter to parse `.graphql` files.
Put your queries and mutations into dedicated files, e.g. under `my-app/app/gql/my-query.graphql`,
and import them from there to use them.

### `.query()`

This method will run a query and return the response.

```js
import query from 'my-app/gql/my-query.graphql';

/* query is:
query singlePost($id: ID!) {
  post(id: $id) {
    id
    title
    body
  }
}
*/

let response = await graphql.query({
  query,
  variables: { id: '1' },
});

/* response is a POJO:
{
  post: {
    id: '1',
    title: 'my title',
    body: 'my body'
  }
}
*/
```

Optionally, you can also provide a namespace, to get this field of the response:

```js
import query from 'my-app/gql/my-query.graphql';

let response = await graphql.query({
  query,
  variables: { id: '1' },
  namespace: 'post',
});

/* response is a POJO:
{
  id: '1',
  title: 'my title',
  body: 'my body'
}
*/
```

You can also decide to cache a query:

```js
// Cache a single record
await graphql.query(
  {
    query,
    variables: { id: '1' },
  },
  {
    cacheEntity: 'User',
    cacheId: '1',
  }
);

// Cache a list
await graphql.query(
  {
    query,
  },
  {
    cacheEntity: 'User',
  }
);
```

With this setup, a query will hit the network the first time it is made.
If the exact same query with the exact same set of variables is made again at any point later,
it will immediately return the same response as the last time, and _not_ hit the network again.

The `cacheEntity` and `cacheId` are required to be able to clear the cache. You can find more information on that later.

Note that when using the cache, it will also avoid making parallel API requests.
This means that if a query is currently pending, it will _not_ make an additional network request if the same query is made, but re-use the same promise.

Finally, you can also decide to only use a cached record unless it is stale:

```js
await graphgl.query(
  {
    query,
  },
  {
    cacheEntity: 'User',
    cacheSeconds: 300,
  }
);
```

This means that when the query is made, and exactly this query has been made less than 300 seconds ago, it will re-use the same response.
If the query was made more than 300 seconds ago, it will hit the network again.

### `.mutate()`

Mutate works similar to query:

```js
import mutation from 'my-app/gql/my-mutation.graphql';

/* mutation is:
mutation createPost($title: String!, $body: String!) {
  createPost(input: { title: $title, body: $body }) {
    id
    title
  }
}
*/

let response = await graphql.mutation({
  mutation,
  variables: { title: 'test title', body: 'test body' },
});

/* response is a POJO:
{
  createPost: {
    id: '1',
    title: 'my title',
    body: 'my body'
  }
}
*/
```

You can also provide a `namespace`, which works the same as for `.query`:

```js
let response = await graphql.mutation({
  mutation,
  variables,
  namespace: 'createPost',
});
```

When running a mutation, you can also define to invalidate caches when the mutation was successful:

```js
await graphql.mutation(
  {
    mutation,
    variables,
  },
  {
    invalidateCache: [
      { cacheEntity: 'User' },
      { cacheEntity: 'User', cacheId: '1' },
    ],
  }
);
```

Any query made for a given set of `cacheEntity` and `cacheId` will have their cache invalidated.
This means that the next time this query is made, it will _always_ hit the network.

You can provide as many caches to invalidate for a given mutation as you want.

### Manually invalidating cache with `invalidateCache()`

You can also manually invalidate caches:

```js
graphql.invalidateCache([
  { cacheEntity: 'User' },
  { cacheEntity: 'User', cacheId: '1' },
]);
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
