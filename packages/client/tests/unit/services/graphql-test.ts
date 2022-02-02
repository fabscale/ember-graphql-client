import GraphQLClientError from '@ember-graphql-client/client/errors/graphql-client-error';
import GraphQLNetworkError from '@ember-graphql-client/client/errors/network-error';
import GraphQLService, {
  GraphQLClient,
} from '@ember-graphql-client/client/services/graphql';
import GraphQLRequestClient, {
  GraphQLRequestClientInterface,
  QueryOptions,
} from '@ember-graphql-client/client/utils/graphql-request-client';
import mutationCreatePost from 'dummy/gql/tests/create-post.graphql';
import mutationCreateStaticPost from 'dummy/gql/tests/create-static-post.graphql';
import queryInvalidQuery from 'dummy/gql/tests/invalid-query.graphql';
import queryPostPerId from 'dummy/gql/tests/post-per-id.graphql';
import queryStaticPost from 'dummy/gql/tests/static-post.graphql';
import { setupTest } from 'ember-qunit';
import { TestContext } from '@ember/test-helpers';
import { module, test } from 'qunit';

module('Unit | Service | graphql', function (hooks) {
  setupTest(hooks);

  module('options', function () {
    test('it allows to set & change headers and options', async function (assert) {
      let expectedHeaders = { 'test-header': 'yes', 'other-header': 'no' };
      let expectedCache = 'no-cache';

      class ExtendedGraphQLService extends GraphQLService {
        // eslint-disable-next-line unused-imports/no-unused-vars
        async query(_: any): Promise<any> {
          // @ts-ignore
          let { client } = this.client;

          assert.deepEqual(
            client.options.headers,
            expectedHeaders,
            'headers are correct'
          );
          assert.strictEqual(
            client.options.cache,
            expectedCache,
            'cache options is correct'
          );
          assert.step('query is called');

          return {};
        }
      }

      this.owner.register('service:graphql', ExtendedGraphQLService);
      let graphql = this.owner.lookup(
        'service:graphql'
      ) as ExtendedGraphQLService;

      graphql.headers = { 'test-header': 'yes', 'other-header': 'no' };
      graphql.options = { cache: 'no-cache' };

      await graphql.query({ query: queryStaticPost });

      graphql.options = { cache: '' };
      expectedCache = '';

      await graphql.query({ query: queryStaticPost });

      graphql.headers = { 'test-header': 'no', 'other-header': 'yes' };
      expectedHeaders = { 'test-header': 'no', 'other-header': 'yes' };

      await graphql.query({ query: queryStaticPost });

      assert.verifySteps([
        'query is called',
        'query is called',
        'query is called',
      ]);
    });
  });

  module('query', function () {
    test('it works with minimal options', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.query({ query: queryStaticPost });

      assert.deepEqual(response, {
        post: {
          id: '1',
          title:
            'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
        },
      });
    });

    test('it works with a variable', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.query({
        query: queryPostPerId,
        variables: { id: 1 },
      });

      assert.deepEqual(response, {
        post: {
          id: '1',
          title:
            'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
        },
      });
    });

    test('it works with a namespace', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.query({
        query: queryStaticPost,
        namespace: 'post',
      });

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });
    });

    test('it allows to provide a one-off client', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let client: GraphQLRequestClientInterface = {
        query: async () => {
          return {
            post: {
              id: '99',
              title: 'mocked title',
            },
          };
        },

        mutate: async () => {
          return {};
        },
      };

      let response = await graphql.query(
        { query: queryStaticPost },
        {},
        client
      );

      assert.deepEqual(response, {
        post: {
          id: '99',
          title: 'mocked title',
        },
      });
    });
  });

  module('mutate', function () {
    test('it works with minimal options', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.mutate({
        mutation: mutationCreateStaticPost,
      });

      assert.deepEqual(response, {
        createPost: {
          id: '101',
          title: 'test title',
        },
      });
    });

    test('it works with variables', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.mutate({
        mutation: mutationCreatePost,
        variables: {
          title: 'my title',
          body: 'my body',
        },
      });

      assert.deepEqual(response, {
        createPost: {
          id: '101',
          title: 'my title',
        },
      });
    });

    test('it works with a namespace', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let response = await graphql.mutate({
        mutation: mutationCreateStaticPost,
        namespace: 'createPost',
      });

      assert.deepEqual(response, {
        id: '101',
        title: 'test title',
      });
    });

    test('it allows to provide a one-off client', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let client: GraphQLRequestClientInterface = {
        query: async () => {
          return {};
        },

        mutate: async () => {
          return {
            createPost: {
              id: '99',
              title: 'mocked title',
            },
          };
        },
      };

      let response = await graphql.mutate(
        {
          mutation: mutationCreateStaticPost,
        },
        {},
        client
      );

      assert.deepEqual(response, {
        createPost: {
          id: '99',
          title: 'mocked title',
        },
      });
    });
  });

  module('errors', function () {
    test('it works with a schema error', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      try {
        await graphql.query({
          query: queryInvalidQuery,
        });
      } catch (error) {
        assert.step('error is thrown');
        assert.true(
          error instanceof GraphQLClientError,
          'correct error is thrown'
        );
        assert.strictEqual(
          error.message,
          'Unknown argument "invalid" on field "post" of type "Query".: {"response":{"errors":[{"message":"Unknown argument \\"invalid\\" on field \\"post\\" of type \\"Query\\".","locations":[{"line":2,"column":8}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}},{"message":"Field \\"post\\" argument \\"id\\" of type \\"ID!\\" is required, but it was not provided.","locations":[{"line":2,"column":3}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}],"status":400,"headers":{}},"request":{"query":"query invalidQuery {\\n  post(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}"}}',
          'correct error is thrown'
        );

        assert.deepEqual(
          error.errors,
          [
            {
              extensions: {
                code: 'GRAPHQL_VALIDATION_FAILED',
              },
              locations: [
                {
                  column: 8,
                  line: 2,
                },
              ],
              message:
                'Unknown argument "invalid" on field "post" of type "Query".',
            },
            {
              extensions: {
                code: 'GRAPHQL_VALIDATION_FAILED',
              },
              locations: [
                {
                  column: 3,
                  line: 2,
                },
              ],
              message:
                'Field "post" argument "id" of type "ID!" is required, but it was not provided.',
            },
          ],
          'errors object is correct'
        );
      }

      assert.verifySteps(['error is thrown']);
    });

    test('it works with a network error', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;
      graphql.apiURL = 'https://invalid-url-here';

      try {
        await graphql.query({
          query: queryStaticPost,
        });
      } catch (error) {
        assert.step('error is thrown');
        assert.true(
          error instanceof GraphQLNetworkError,
          'correct error is thrown'
        );
      }

      assert.verifySteps(['error is thrown']);
    });
  });

  module('errorHandler', function () {
    test('it works with an error handler that returns false', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;
      graphql.errorHandler = (error: any) => {
        assert.step('errorHandler is called');
        assert.strictEqual(
          error.message,
          'Unknown argument "invalid" on field "post" of type "Query".: {"response":{"errors":[{"message":"Unknown argument \\"invalid\\" on field \\"post\\" of type \\"Query\\".","locations":[{"line":2,"column":8}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}},{"message":"Field \\"post\\" argument \\"id\\" of type \\"ID!\\" is required, but it was not provided.","locations":[{"line":2,"column":3}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}],"status":400,"headers":{}},"request":{"query":"query invalidQuery {\\n  post(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}"}}',
          'correct error is passed to errorHandler'
        );

        return false;
      };

      try {
        await graphql.query({
          query: queryInvalidQuery,
        });
      } catch (error) {
        assert.step('error is thrown');
        assert.strictEqual(
          error.message,
          'Unknown argument "invalid" on field "post" of type "Query".: {"response":{"errors":[{"message":"Unknown argument \\"invalid\\" on field \\"post\\" of type \\"Query\\".","locations":[{"line":2,"column":8}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}},{"message":"Field \\"post\\" argument \\"id\\" of type \\"ID!\\" is required, but it was not provided.","locations":[{"line":2,"column":3}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}],"status":400,"headers":{}},"request":{"query":"query invalidQuery {\\n  post(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}"}}',
          'correct error is thrown'
        );
      }

      assert.verifySteps(['errorHandler is called', 'error is thrown']);
    });

    test('it works with an error handler that returns a new error', async function (assert) {
      let graphql = this.owner.lookup('service:graphql') as GraphQLService;
      graphql.errorHandler = (error: any) => {
        assert.step('errorHandler is called');
        assert.strictEqual(
          error.message,
          'Unknown argument "invalid" on field "post" of type "Query".: {"response":{"errors":[{"message":"Unknown argument \\"invalid\\" on field \\"post\\" of type \\"Query\\".","locations":[{"line":2,"column":8}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}},{"message":"Field \\"post\\" argument \\"id\\" of type \\"ID!\\" is required, but it was not provided.","locations":[{"line":2,"column":3}],"extensions":{"code":"GRAPHQL_VALIDATION_FAILED"}}],"status":400,"headers":{}},"request":{"query":"query invalidQuery {\\n  post(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}"}}',
          'correct error is passed to errorHandler'
        );

        return new Error('custom error');
      };

      try {
        await graphql.query({
          query: queryInvalidQuery,
        });
      } catch (error) {
        assert.step('error is thrown');
        assert.strictEqual(
          error.message,
          'custom error',
          'correct error is thrown'
        );
      }

      assert.verifySteps(['errorHandler is called', 'error is thrown']);
    });
  });

  module('cache', function (hooks) {
    type Context = TestContext & {
      graphql: GraphQLService;
    };

    hooks.beforeEach(function (this: Context, assert) {
      class TestGraphQLRequestClient extends GraphQLRequestClient {
        query(options: QueryOptions) {
          assert.step(
            `query is called for namespace=${
              options.namespace
            } & variables=${JSON.stringify(options.variables || {})}`
          );
          return super.query(options);
        }
      }

      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let graphQLClient = new GraphQLClient(graphql.apiURL!, {});
      let client = new TestGraphQLRequestClient(graphQLClient);

      graphql.client = client;

      this.graphql = graphql;
    });

    test('it works without cache', async function (this: Context, assert) {
      let { graphql } = this;

      let response = await graphql.query({
        query: queryStaticPost,
        namespace: 'post',
      });

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response2 = await graphql.query({
        query: queryStaticPost,
        namespace: 'post',
      });

      assert.deepEqual(response2, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps([
        'query is called for namespace=post & variables={}',
        'query is called for namespace=post & variables={}',
      ]);
    });

    test('it works with cache', async function (this: Context, assert) {
      let { graphql } = this;

      let response = await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response2 = await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        { cacheEntity: 'Post' }
      );

      assert.deepEqual(response2, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps(['query is called for namespace=post & variables={}']);
    });

    test('it works with cache & pending queries', async function (this: Context, assert) {
      let { graphql } = this;

      let promise1 = graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      let promise2 = graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      let response1 = await promise1;
      let response2 = await promise2;

      assert.strictEqual(response1, response2, 'responses are the same');

      assert.deepEqual(response1, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps(['query is called for namespace=post & variables={}']);
    });

    test('it caches per variable set', async function (this: Context, assert) {
      let { graphql } = this;

      let response = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        {
          cacheEntity: 'Post',
        }
      );

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response2 = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        { cacheEntity: 'Post' }
      );

      assert.deepEqual(response2, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response3 = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '2' },
        },
        { cacheEntity: 'Post' }
      );

      assert.deepEqual(response3, {
        id: '2',
        title: 'qui est esse',
      });

      assert.verifySteps([
        'query is called for namespace=post & variables={"id":"1"}',
        'query is called for namespace=post & variables={"id":"2"}',
      ]);
    });

    test('it caches per entity', async function (this: Context, assert) {
      let { graphql } = this;

      let response = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        {
          cacheEntity: 'Post',
        }
      );

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response2 = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        { cacheEntity: 'Other' }
      );

      assert.deepEqual(response2, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps([
        'query is called for namespace=post & variables={"id":"1"}',
        'query is called for namespace=post & variables={"id":"1"}',
      ]);
    });

    test('it caches per entity & ID', async function (this: Context, assert) {
      let { graphql } = this;

      let response = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        {
          cacheEntity: 'Post',
          cacheId: '1',
        }
      );

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response2 = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        {
          cacheEntity: 'Post',
          cacheId: '1',
        }
      );

      assert.deepEqual(response2, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      let response3 = await graphql.query(
        {
          query: queryPostPerId,
          namespace: 'post',
          variables: { id: '1' },
        },
        {
          cacheEntity: 'Post',
          cacheId: '2',
        }
      );

      assert.deepEqual(response3, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps([
        'query is called for namespace=post & variables={"id":"1"}',
        'query is called for namespace=post & variables={"id":"1"}',
      ]);
    });

    test('it does not cache errors', async function (this: Context, assert) {
      let shouldError = true;

      class TestGraphQLRequestClient extends GraphQLRequestClient {
        async query(options: QueryOptions): Promise<any> {
          assert.step(
            `query is called for namespace=${
              options.namespace
            } & variables=${JSON.stringify(options.variables || {})}`
          );

          await new Promise((resolve) => setTimeout(resolve, 100));

          if (shouldError) {
            throw new GraphQLNetworkError();
          }

          return super.query(options);
        }
      }

      let graphql = this.owner.lookup('service:graphql') as GraphQLService;

      let graphQLClient = new GraphQLClient(graphql.apiURL!, {});
      let client = new TestGraphQLRequestClient(graphQLClient);

      graphql.client = client;

      let promise1 = graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      let promise2 = graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      try {
        await promise1;
      } catch (error) {
        assert.true(
          error instanceof GraphQLNetworkError,
          'error is network error'
        );
        assert.step('promise1 error');
      }

      try {
        await promise2;
      } catch (error) {
        assert.true(
          error instanceof GraphQLNetworkError,
          'error is network error'
        );
        assert.step('promise2 error');
      }

      try {
        await graphql.query(
          {
            query: queryStaticPost,
            namespace: 'post',
          },
          {
            cacheEntity: 'Post',
          }
        );
      } catch (error) {
        assert.true(
          error instanceof GraphQLNetworkError,
          'error is network error'
        );
        assert.step('promise3 error');
      }

      shouldError = false;

      let response = await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      assert.deepEqual(response, {
        id: '1',
        title:
          'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
      });

      assert.verifySteps([
        'query is called for namespace=post & variables={}',
        'promise1 error',
        'promise2 error',
        'query is called for namespace=post & variables={}',
        'promise3 error',
        'query is called for namespace=post & variables={}',
      ]);
    });

    test('it allows to invalidate caches with a mutation', async function (this: Context, assert) {
      let { graphql } = this;

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      await graphql.mutate({
        mutation: mutationCreatePost,
        variables: { title: 'title', body: 'body' },
      });

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        { cacheEntity: 'Post' }
      );

      await graphql.mutate(
        {
          mutation: mutationCreatePost,
          variables: { title: 'title', body: 'body' },
        },
        { invalidateCache: [{ cacheEntity: 'Post' }] }
      );

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        { cacheEntity: 'Post' }
      );

      assert.verifySteps([
        'query is called for namespace=post & variables={}',
        'query is called for namespace=post & variables={}',
      ]);
    });

    test('it allows to invalidate caches with ID with a mutation', async function (this: Context, assert) {
      let { graphql } = this;

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 1 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '1',
        }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 2 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '2',
        }
      );

      await graphql.mutate({
        mutation: mutationCreatePost,
        variables: { title: 'title', body: 'body' },
      });

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 1 },
          namespace: 'post',
        },
        { cacheEntity: 'Post', cacheId: '1' }
      );

      await graphql.mutate(
        {
          mutation: mutationCreatePost,
          variables: { title: 'title', body: 'body' },
        },
        { invalidateCache: [{ cacheEntity: 'Post', cacheId: '1' }] }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 1 },
          namespace: 'post',
        },
        { cacheEntity: 'Post', cacheId: '1' }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 2 },
          namespace: 'post',
        },
        { cacheEntity: 'Post', cacheId: '2' }
      );

      assert.verifySteps([
        'query is called for namespace=post & variables={"id":1}',
        'query is called for namespace=post & variables={"id":2}',
        'query is called for namespace=post & variables={"id":1}',
      ]);
    });

    test('it allows to invalidate caches manually', async function (this: Context, assert) {
      let { graphql } = this;

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 1 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '1',
        }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 2 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '2',
        }
      );

      graphql.invalidateCache([
        { cacheEntity: 'Post' },
        { cacheEntity: 'Post', cacheId: '1' },
      ]);

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 1 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '1',
        }
      );

      await graphql.query(
        {
          query: queryPostPerId,
          variables: { id: 2 },
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheId: '2',
        }
      );

      assert.verifySteps([
        'query is called for namespace=post & variables={}',
        'query is called for namespace=post & variables={"id":1}',
        'query is called for namespace=post & variables={"id":2}',
        'query is called for namespace=post & variables={}',
        'query is called for namespace=post & variables={"id":1}',
      ]);
    });

    test('it expires caches based on the given cacheSeconds', async function (this: Context, assert) {
      let { graphql } = this;

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
        }
      );

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheSeconds: 1,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await graphql.query(
        {
          query: queryStaticPost,
          namespace: 'post',
        },
        {
          cacheEntity: 'Post',
          cacheSeconds: 1,
        }
      );

      assert.verifySteps([
        'query is called for namespace=post & variables={}',
        'query is called for namespace=post & variables={}',
      ]);
    });
  });
});
