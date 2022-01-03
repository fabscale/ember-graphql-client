# @ember-graphql-client/mock

An addon to mock a GraphQL API for tests, demos or local development.

## Compatibility

- Ember.js v3.24 or above
- Ember CLI v3.24 or above
- Node.js v12 or above

## Installation

```
ember install ember-graphql-client
```

## Conditional usage

In most cases, you will only want to enable mocked GraphQL under certain situations, e.g. when running tests.
In other cases, you'll want to avoid to include this addon, to not include the graphql tools necessary to make mocking work.

The easiest way to achieve this is by manually disabling this addon in your `ember-cli-build.js` for those cases. For example:

```js
// ember-cli-build.js
let env = process.env.EMBER_ENV || 'development';
let isProduction = env === 'production';

let app = new EmberApp(defaults, {
  addons: {
    blacklist: isProduction ? ['@ember-graphql-client/mock'] : [],
  },
});
```

## Usage

### Usage in tests

```js
import { mockGraphQLForTests } from '@ember-graphql-client/mock/test-support/helpers';
import schema from 'dummy/gql/schema.graphql';

module('Unit | mock-graphql-request-client', function (hooks) {
  setupTest(hooks);

  module('basic', function (hooks) {
    mockGraphQLForTests(hooks, schema, {
      Query: {
        post() {
          return {
            id: '99',
            title: 'test title',
            body: 'test body',
          };
        },
      },

      Mutation: {
        createPost() {
          return {
            id: '99',
            title: 'test title',
            body: 'test body',
          };
        },
      },
    });
  });
});
```

The third argument to `mockGraphQLForTests` is a resolver object.

The `schema` should be a full GraphQL schema.

Alternatively, you can also use the following code, if you want to setup the mock inside of a function:

```js
import { setupMockGraphQLRequestClient } from '@ember-graphql-client/mock/test-support/helpers';

let graphql = this.owner.lookup('service:graphql');
setupMockGraphQLRequestClient(graphql, schema, resolvers);
```

## Usage in application code

You can also setup a mocked GraphQL client for e.g. local development or demoing.
This works similar as mocking for tests:

```js
import { getMockGraphQLRequestClient } from '@ember-graphql-client/mock/mock-graphql-request-client';
import resolvers from 'my-app/mocked-graphql-resolvers';
import schema from 'my-app/gql/schema.graphql';

// e.g. in an instance initializer
export function initialize(appInstance) {
  let graphql = appInstance.lookup('service:graphql');
  let client = getMockGraphQLRequestClient(schema, resolvers);
  graphql.client = client;
}

export default {
  initialize,
};
```

## GraphQL Resolvers

This addon uses standard GraphQL execution resolvers.

The simplest form of a resolver takes a `Query` and `Mutation` key that contains an object with a function for each query/mutation.

The function has the following signature:

```js
fieldName: (parent, args, context, info) => data;
```

Often, you might not have/need the `parent`. The `args` are the inputs passed in.

An example for a mutation using the inputs would be:

```js
let resolvers = {
  Mutation: {
    createPost: (_, args) => {
      let { id, title } = args;

      return {
        id,
        title,
        creationDate: new Date(),
      };
    },
  },
};
```

You can find details on how a resolver object works in the
[Apollo docs](https://www.apollographql.com/docs/tutorial/resolvers/).

### Mocking errors

You can also trigger errors from GraphQL.
Note that schema validation will happen automatically and throw appropriate errors.

You can either just throw an error from a resolver:

```js
let resolvers = {
  Query: {
    post() {
      throw new Error('could not fetch post');
    },
  },
};
```

Which will result in the following errors payload:

```json
[
  {
    "locations": [],
    "message": "could not fetch post",
    "name": "GraphQLError",
    "path": ["post"]
  }
]
```

If you need more control, you can also generate a more detailed error:

```js
import { mockGraphQLError } from '@ember-graphql-client/mock/mock-graphql-error';

let resolvers = {
  Query: {
    post() {
      throw mockGraphQLError({
        message: 'test extended error',
        extensions: { code: 'RESOURCE_NOT_FOUND' },
      });
    },
  },
};
```

Which will result in the following errors payload:

```json
[
  {
    "locations": [],
    "message": "test extended error",
    "name": "GraphQLError",
    "path": ["post"],
    "extensions": {
      "code": "RESOURCE_NOT_FOUND"
    }
  }
]
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
