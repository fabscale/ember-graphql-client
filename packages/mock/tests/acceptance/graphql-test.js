import { setupMockGraphQLRequestClient } from '@ember-graphql-client/mock/test-support/helpers';
import { currentURL, visit } from '@ember/test-helpers';
import click from '@ember/test-helpers/dom/click';
import schema from 'dummy/gql/schema.graphql';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Acceptance | graphql', function (hooks) {
  setupApplicationTest(hooks);

  test('it works without mocked GraphQL', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');

    assert.dom('[data-test-post]').exists({ count: 10 });

    await click('[data-test-post="1"]');

    assert.strictEqual(currentURL(), '/posts/1');

    assert
      .dom('[data-test-title]')
      .hasText(
        'sunt aut facere repellat provident occaecati excepturi optio reprehenderit'
      );
    assert
      .dom('[data-test-body]')
      .hasText(
        'quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto'
      );
  });

  test('it works with mocked GraphQL', async function (assert) {
    let resolvers = {
      Query: {
        post() {
          return {
            id: '99',
            title: 'test title 2',
            body: 'test body 2',
          };
        },

        posts() {
          return {
            data: [
              {
                id: '98',
                title: 'test title 1',
                body: 'test body 1',
              },
              {
                id: '99',
                title: 'test title 2',
                body: 'test body 2',
              },
            ],
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
    };

    let graphql = this.owner.lookup('service:graphql');

    setupMockGraphQLRequestClient(graphql, schema, resolvers);

    await visit('/');

    assert.strictEqual(currentURL(), '/');

    assert.dom('[data-test-post]').exists({ count: 2 });

    await click('[data-test-post="99"]');

    assert.strictEqual(currentURL(), '/posts/99');

    assert.dom('[data-test-title]').hasText('test title 2');
    assert.dom('[data-test-body]').hasText('test body 2');
  });
});
