import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import Service from '@ember/service';
import GraphQLCache, {
  GraphQLEntityCache,
} from '@ember-graphql-client/client/utils/graphql-cache';
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
import { buildWaiter } from '@ember/test-waiters';
import { cached, tracked } from '@glimmer/tracking';

export type QueryCacheOptions = {
  cacheEntity?: string;
  cacheSeconds?: number;
  cacheId?: string;
};

export type MutationCacheOptions = {
  invalidateCache?: {
    cacheEntity: string;
    cacheId?: string;
  }[];
};

type GraphqlResponse = any;

const waiter = buildWaiter('@ember-graphql-client/client:request-waiter');

export default class GraphQLService extends Service {
  cache: GraphQLCache = new GraphQLCache();

  @tracked _apiURL?: string;
  @tracked _options: Record<string, any> = {};
  @tracked _headers: Record<string, string> = {};
  @tracked _client?: GraphQLRequestClientInterface;

  errorHandler?: (
    error: any,
    options: { source: 'query' | 'mutate'; originalError: Error }
  ) => false | Error;

  get apiURL(): string | undefined {
    return this._apiURL;
  }

  set apiURL(apiURL: string | undefined) {
    this._apiURL = apiURL;
    assert(
      'Trying to set apiURL on graphql will not do anything when the client has been overwritten',
      !this._client
    );
  }

  get headers(): Record<string, string> {
    return this._headers;
  }

  set headers(headers: Record<string, string>) {
    this._headers = headers;
    assert(
      'Trying to set headers on graphql will not do anything when the client has been overwritten',
      !this._client
    );
  }

  get options(): any {
    return this._options;
  }

  set options(options: Record<string, any>) {
    this._options = options;
    assert(
      'Trying to set options on graphql will not do anything when the client has been overwritten',
      !this._client
    );
  }

  @cached
  get client(): GraphQLRequestClientInterface {
    // This is mostly for testing purposes
    if (this._client) {
      return this._client;
    }

    let { apiURL, options, headers } = this;

    assert('graphql: You have to define an apiURL', typeof apiURL === 'string');

    return this._createClient({ apiURL, options, headers });
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

    let promise = cachedResponse || client.query(options);

    // We cache the promise to avoid parallel network requests
    if (!cachedResponse) {
      this._maybeStoreCachedResponse(options, cacheOptions, promise);
    }

    let token = waiter.beginAsync();
    try {
      let response = await promise;

      // If the response is not just the cachedResponse, we try to cache it
      if (response !== cachedResponse) {
        this._maybeStoreCachedResponse(options, cacheOptions, response);
      }
      waiter.endAsync(token);
      return response;
    } catch (error) {
      waiter.endAsync(token);

      // Make sure to clear the cached response, to avoid having a rejected promise cached
      this._maybeClearCachedResponse(options, cacheOptions);

      throw this._handleError(error, { source: 'query' });
    }
  }

  async mutate(
    options: MutationOptions,
    cacheOptions?: MutationCacheOptions,
    client: GraphQLRequestClientInterface = this.client
  ): Promise<GraphqlResponse> {
    let response;

    let token = waiter.beginAsync();
    try {
      response = await client.mutate(options);
    } catch (error) {
      waiter.endAsync(token);
      throw this._handleError(error, { source: 'mutate' });
    }

    if (cacheOptions?.invalidateCache) {
      this.invalidateCache(cacheOptions.invalidateCache);
    }

    waiter.endAsync(token);

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
    let cache = this._getCache(cacheOptions);

    if (!cache) {
      return;
    }

    let { cacheSeconds } = cacheOptions!;

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
    response: GraphqlResponse | Promise<GraphqlResponse>
  ): void {
    let cache = this._getCache(cacheOptions);

    if (!cache) {
      return;
    }

    cache.set(options, response);
  }

  _maybeClearCachedResponse(
    options: QueryOptions,
    cacheOptions: QueryCacheOptions | undefined
  ): void {
    let cache = this._getCache(cacheOptions);

    if (!cache) {
      return;
    }

    cache.remove(options);
  }

  _getCache(
    cacheOptions: QueryCacheOptions | undefined
  ): GraphQLEntityCache | undefined {
    if (!cacheOptions) {
      return;
    }

    let { cacheEntity, cacheId } = cacheOptions;

    if (!cacheEntity) {
      return;
    }

    return this.cache.getCache(cacheEntity, cacheId);
  }

  _handleError(
    error: Error,
    { source }: { source: 'mutate' | 'query' }
  ): Error {
    let parsedError = error;

    // Network error, e.g. offline
    if (isNetworkError(error)) {
      parsedError = new GraphQLNetworkError();
    }

    if (error instanceof ClientError) {
      parsedError = new GraphQLClientError(error);
    }

    if (this.errorHandler) {
      let handledError = this.errorHandler(parsedError, {
        source,
        originalError: error,
      });

      if (handledError !== false) {
        return handledError;
      }
    }

    return parsedError;
  }

  _createClient({
    apiURL,
    headers,
    options,
  }: {
    apiURL: string;
    headers: Record<string, string>;
    options: Record<string, any>;
  }): GraphQLRequestClient {
    let graphQLClient = new GraphQLClient(
      apiURL,
      Object.assign({ headers, fetch }, options)
    );

    return new GraphQLRequestClient(graphQLClient);
  }
}

export { GraphQLClient } from 'graphql-request';

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    graphql: GraphQLService;
  }
}
