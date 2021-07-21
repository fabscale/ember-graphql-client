import GraphQLClientError from '@ember-graphql-client/client/errors/graphql-client-error';
import { mockGraphQLError } from '@ember-graphql-client/mock/mock-graphql-error';
import { getMockGraphQLRequestClient } from '@ember-graphql-client/mock/mock-graphql-request-client';
import { mockGraphQLForTests } from '@ember-graphql-client/mock/test-support/helpers';
import schema from 'dummy/gql/schema.graphql';
import mutationCreateStaticPost from 'dummy/gql/tests/create-static-post.graphql';
import mutationInvalidMutation from 'dummy/gql/tests/invalid-mutation.graphql';
import queryInvalidQuery from 'dummy/gql/tests/invalid-query.graphql';
import queryStaticPost from 'dummy/gql/tests/static-post.graphql';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

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

    module('query', function () {
      test('it handles validation errors', async function (assert) {
        let graphql = this.owner.lookup('service:graphql');

        try {
          await graphql.query({ query: queryInvalidQuery });
        } catch (error) {
          assert.step('error is thrown');
          assert.true(
            error instanceof GraphQLClientError,
            'correct error is thrown'
          );

          assert.equal(
            error.message,
            'Argument "id" of required type "ID!" was not provided.: {"response":{"errors":[{"name":"GraphQLError","message":"Argument \\"id\\" of required type \\"ID!\\" was not provided.","locations":[],"path":["post"]}],"status":200},"request":{"query":"query invalidQuery {\\n  post(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}\\n"}}',
            'correct error is thrown'
          );
          assert.deepEqual(
            error.errors,
            [
              {
                locations: [],
                message:
                  'Argument "id" of required type "ID!" was not provided.',
                name: 'GraphQLError',
                path: ['post'],
              },
            ],
            'errors object is correct'
          );
        }

        assert.verifySteps(['error is thrown']);
      });

      test('it works with minimal options', async function (assert) {
        let graphql = this.owner.lookup('service:graphql');

        let response = await graphql.query({ query: queryStaticPost });

        assert.deepEqual(response, {
          post: {
            id: '99',
            title: 'test title',
          },
        });
      });
    });

    module('mutation', function () {
      test('it handles validation errors', async function (assert) {
        let graphql = this.owner.lookup('service:graphql');

        try {
          await graphql.mutate({ mutation: mutationInvalidMutation });
        } catch (error) {
          assert.step('error is thrown');
          assert.true(
            error instanceof GraphQLClientError,
            'correct error is thrown'
          );

          assert.equal(
            error.message,
            'Argument "input" of required type "CreatePostInput!" was not provided.: {"response":{"errors":[{"name":"GraphQLError","message":"Argument \\"input\\" of required type \\"CreatePostInput!\\" was not provided.","locations":[],"path":["createPost"]}],"status":200},"request":{"query":"mutation createPost {\\n  createPost(invalid: \\"yes\\") {\\n    id\\n    title\\n  }\\n}\\n"}}',
            'correct error is thrown'
          );
          assert.deepEqual(
            error.errors,
            [
              {
                locations: [],
                message:
                  'Argument "input" of required type "CreatePostInput!" was not provided.',
                name: 'GraphQLError',
                path: ['createPost'],
              },
            ],
            'errors object is correct'
          );
        }

        assert.verifySteps(['error is thrown']);
      });

      test('it works with minimal options', async function (assert) {
        let graphql = this.owner.lookup('service:graphql');

        let response = await graphql.mutate({
          mutation: mutationCreateStaticPost,
        });

        assert.deepEqual(response, {
          createPost: {
            id: '99',
            title: 'test title',
          },
        });
      });
    });
  });

  module('api errors', function (hooks) {
    hooks.beforeEach(function () {
      let resolvers = {
        Query: {
          post: () => {
            throw this.error || new Error('test query api error');
          },
        },

        Mutation: {
          createPost: () => {
            throw this.error || new Error('test mutation api error');
          },
        },
      };

      let client = getMockGraphQLRequestClient(schema, resolvers);

      let graphql = this.owner.lookup('service:graphql');
      graphql.client = client;
    });

    test('thrown errors work for query', async function (assert) {
      let graphql = this.owner.lookup('service:graphql');

      try {
        await graphql.query({ query: queryStaticPost });
      } catch (error) {
        assert.step('error is thrown');
        assert.true(
          error instanceof GraphQLClientError,
          'correct error is thrown'
        );

        assert.equal(
          error.message,
          'test query api error: {"response":{"errors":[{"name":"GraphQLError","message":"test query api error","locations":[],"path":["post"]}],"status":200},"request":{"query":"query singlePost {\\n  post(id: 1) {\\n    id\\n    title\\n  }\\n}\\n"}}',
          'correct error is thrown'
        );
        assert.deepEqual(
          error.errors,
          [
            {
              locations: [],
              message: 'test query api error',
              name: 'GraphQLError',
              path: ['post'],
            },
          ],
          'errors object is correct'
        );
      }

      assert.verifySteps(['error is thrown']);
    });

    test('thrown errors work for mutate', async function (assert) {
      let graphql = this.owner.lookup('service:graphql');

      try {
        await graphql.mutate({ mutation: mutationCreateStaticPost });
      } catch (error) {
        assert.step('error is thrown');
        assert.true(
          error instanceof GraphQLClientError,
          'correct error is thrown'
        );

        assert.equal(
          error.message,
          'test mutation api error: {"response":{"errors":[{"name":"GraphQLError","message":"test mutation api error","locations":[],"path":["createPost"]}],"status":200},"request":{"query":"mutation createPost {\\n  createPost(input: {title: \\"test title\\", body: \\"test body\\"}) {\\n    id\\n    title\\n  }\\n}\\n"}}',
          'correct error is thrown'
        );
        assert.deepEqual(
          error.errors,
          [
            {
              locations: [],
              message: 'test mutation api error',
              name: 'GraphQLError',
              path: ['createPost'],
            },
          ],
          'errors object is correct'
        );
      }

      assert.verifySteps(['error is thrown']);
    });

    test('thrown error with details work for query', async function (assert) {
      let graphql = this.owner.lookup('service:graphql');

      this.error = mockGraphQLError({
        message: 'test extended error',
        extensions: { code: 'RESOURCE_NOT_FOUND' },
      });

      try {
        await graphql.query({ query: queryStaticPost });
      } catch (error) {
        assert.step('error is thrown');
        assert.true(
          error instanceof GraphQLClientError,
          'correct error is thrown'
        );

        assert.equal(
          error.message,
          'test extended error: {"response":{"errors":[{"name":"GraphQLError","message":"test extended error","locations":[],"path":["post"],"extensions":{"code":"RESOURCE_NOT_FOUND"}}],"status":200},"request":{"query":"query singlePost {\\n  post(id: 1) {\\n    id\\n    title\\n  }\\n}\\n"}}',
          'correct error is thrown'
        );
        assert.deepEqual(
          error.errors,
          [
            {
              extensions: {
                code: 'RESOURCE_NOT_FOUND',
              },
              locations: [],
              message: 'test extended error',
              name: 'GraphQLError',
              path: ['post'],
            },
          ],
          'errors object is correct'
        );
      }

      assert.verifySteps(['error is thrown']);
    });
  });
});
