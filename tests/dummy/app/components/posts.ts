import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import GraphQLService from 'ember-graphql-client/services/graphql';
import query from 'dummy/gql/queries/posts.graphql';

type Args = any;

export default class PostComponent extends Component<Args> {
  @service declare graphql: GraphQLService;

  @tracked posts?: any;
  @tracked page = 1;

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this._loadPosts();
  }

  async _loadPosts(): Promise<void> {
    let postsData = await this.graphql.query({
      query,
      variables: { pageSize: 10, page: this.page },
      namespace: 'posts',
    });

    this.posts = postsData.data;
  }
}
