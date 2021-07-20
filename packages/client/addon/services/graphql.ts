import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import Service from '@ember/service';
import GraphQLCache from '@ember-graphql-client/client/utils/graphql-cache';
import GraphQLRequestClient, {
  GraphQLRequestClientInterface,
  MutationOptions,
  QueryOptions,
} from '@ember-graphql-client/client/utils/graphql-request-client';
import { ClientError, GraphQLClient } from 'graphql-request';
import fetch from 'fetch';
import GraphQLNetworkError from '@ember-graphql-client/client/errors/network-error';
import { isNetworkError } from '@ember-graphql-client/client/utils/is-network-error';
import GraphQLClientError from '@ember-graphql-client/client/errors/graphql-client-error';

type QueryCacheOptions = {
  cacheEntity?: string;
  cacheSeconds?: number;
  cacheId?: string;
};

type MutationCacheOptions = {
  invalidateCache?: {
    cacheEntity: string;
    cacheId?: string;
  }[];
};

type GraphqlResponse = any;

export default class GraphQLService extends Service {
  cache: GraphQLCache = new GraphQLCache();

  _apiURL?: string;
  _options: Record<string, any> = {};
  _headers: Record<string, string> = {};

  errorHandler?: (
    error: any,
    options: { source: 'query' | 'mutate' }
  ) => false | Error;

  get apiURL(): string | undefined {
    return this._apiURL;
  }

  set apiURL(apiURL: string | undefined) {
    this._apiURL = apiURL;
  }

  get headers(): Record<string, string> {
    return this._headers;
  }

  set headers(headers: Record<string, string>) {
    this._headers = headers;
  }

  get options(): any {
    return this._options;
  }

  set options(options: Record<string, any>) {
    this._options = options;
  }

  _client?: GraphQLRequestClientInterface;
  get client(): GraphQLRequestClientInterface {
    if (this._client) {
      return this._client;
    }

    let graphQLClient = this._setupUnderlyingClient();
    let client = new GraphQLRequestClient(graphQLClient);

    // eslint-disable-next-line ember/no-side-effects
    this._client = client;

    return client;
  }

  set client(client: GraphQLRequestClientInterface | undefined) {
    this._client = client;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(owner: any) {
    super(owner);

    let config =
      getOwner(this).resolveRegistration('config:environment').graphql || {};

    this._options = config.options;
    this._apiURL = config.apiURL;
  }

  async query(
    options: QueryOptions,
    cacheOptions?: QueryCacheOptions,
    client: GraphQLRequestClientInterface = this.client
  ): Promise<GraphqlResponse> {
    let cachedResponse = options
      ? this._maybeUseCachedResponse(options, cacheOptions)
      : undefined;

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      let response = await client.query(options);
      this._maybeStoreCachedResponse(options, cacheOptions, response);
      return response;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async mutate(
    options: MutationOptions,
    cacheOptions?: MutationCacheOptions,
    client: GraphQLRequestClientInterface = this.client
  ): Promise<GraphqlResponse> {
    let response;

    try {
      response = await client.mutate(options);
    } catch (error) {
      throw this._handleError(error);
    }

    if (cacheOptions?.invalidateCache) {
      this.invalidateCache(cacheOptions.invalidateCache);
    }

    return response;
  }

  invalidateCache(
    invalidateCache: { cacheEntity: string; cacheId?: string }[]
  ): void {
    invalidateCache.forEach(({ cacheEntity, cacheId }) => {
      this.invalidateSingleCache({ cacheEntity, cacheId });
    });
  }

  invalidateSingleCache({
    cacheEntity,
    cacheId,
  }: {
    cacheEntity: string;
    cacheId?: string;
  }): void {
    let cache = this.cache.getCache(cacheEntity, cacheId);
    cache.clear();
  }

  _maybeUseCachedResponse(
    options: QueryOptions,
    cacheOptions: QueryCacheOptions | undefined
  ): undefined | GraphqlResponse {
    if (!cacheOptions) {
      return;
    }

    let { cacheEntity, cacheSeconds, cacheId } = cacheOptions;

    if (!cacheEntity) {
      return;
    }

    let cache = this.cache.getCache(cacheEntity, cacheId);
    let cachedResponse = cache.get(options);

    if (typeof cachedResponse === 'undefined') {
      return undefined;
    }

    if (typeof cacheSeconds === 'undefined') {
      return cachedResponse.response;
    }

    let now = Math.round(+new Date() / 1000);

    if (now - cacheSeconds <= cachedResponse.timestamp) {
      return cachedResponse.response;
    }

    return undefined;
  }

  _maybeStoreCachedResponse(
    options: QueryOptions,
    cacheOptions: QueryCacheOptions | undefined,
    response: GraphqlResponse
  ): void {
    if (!cacheOptions) {
      return;
    }

    let { cacheEntity, cacheId } = cacheOptions;

    if (!cacheEntity) {
      return;
    }

    let cache = this.cache.getCache(cacheEntity, cacheId);
    cache.set(options, response);
  }

  _handleError(error: Error): Error {
    if (this.errorHandler) {
      let handledError = this.errorHandler(error, { source: 'mutate' });
      if (handledError !== false) {
        return handledError;
      }
    }

    // Network error
    if (isNetworkError(error)) {
      return new GraphQLNetworkError();
    }

    if (error instanceof ClientError) {
      return new GraphQLClientError(error);
    }

    return error;
  }

  _setupUnderlyingClient(): GraphQLClient {
    let { apiURL, options, headers } = this;

    assert('graphql: You have to define an apiURL', typeof apiURL === 'string');

    return new GraphQLClient(
      apiURL,
      Object.assign({ headers, fetch }, options)
    );
  }
}

export { GraphQLClient } from 'graphql-request';

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    graphql: GraphQLService;
  }
}
