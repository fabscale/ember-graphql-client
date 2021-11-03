import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import click from '@ember/test-helpers/dom/click';

module('Acceptance | graphql', function (hooks) {
  setupApplicationTest(hooks);

  test('it works', async function (assert) {
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
});
