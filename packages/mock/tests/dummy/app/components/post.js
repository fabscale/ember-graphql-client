import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import query from 'dummy/gql/queries/post.graphql';

export default class PostComponent extends Component {
  @service graphql;

  @tracked post;

  constructor(owner, args) {
    super(owner, args);

    this._loadPost();
  }

  async _loadPost() {
    this.post = await this.graphql.query({
      query,
      variables: { id: this.args.id },
      namespace: 'post',
    });
  }
}
