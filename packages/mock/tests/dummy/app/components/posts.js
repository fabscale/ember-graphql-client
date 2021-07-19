import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import query from 'dummy/gql/queries/posts.graphql';

export default class PostComponent extends Component {
  @service graphql;

  @tracked posts;
  @tracked page = 1;

  constructor(owner, args) {
    super(owner, args);

    this._loadPosts();
  }

  async _loadPosts() {
    let postsData = await this.graphql.query({
      query,
      variables: { pageSize: 10, page: this.page },
      namespace: 'posts',
    });

    this.posts = postsData.data;
  }
}
