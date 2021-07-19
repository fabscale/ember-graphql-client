import Route from '@ember/routing/route';

export default class PostRoute extends Route {
  model(params: { id: string }): string | number {
    return params.id;
  }
}
