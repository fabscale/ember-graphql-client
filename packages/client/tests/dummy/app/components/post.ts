import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import GraphQLService from '@ember-graphql-client/client/services/graphql';
import query from 'dummy/gql/queries/post.graphql';

type Args = {
  id: number;
};

export default class PostComponent extends Component<Args> {
  @service declare graphql: GraphQLService;

  @tracked post?: any;

  constructor(owner: unknown, args: Args) {
    super(owner, args);

    this._loadPost();
  }

  async _loadPost(): Promise<void> {
    this.post = await this.graphql.query({
      query,
      variables: { id: this.args.id },
      namespace: 'post',
    });
  }
}
