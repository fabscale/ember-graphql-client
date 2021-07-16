import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';
import Service from '@ember/service';
import GraphQLCache from 'ember-graphql-client/utils/graphql-cache';
import GraphQLRequestClient, {
  GraphQLRequestClientInterface,
  MutationOptions,
  QueryOptions,
} from 'ember-graphql-client/utils/graphql-request-client';
import { ClientError, GraphQLClient } from 'graphql-request';
import fetch from 'fetch';
import GraphQLNetworkError from 'ember-graphql-client/errors/network-error';
import { isNetworkError } from 'ember-graphql-client/utils/is-network-error';
import GraphQLError from 'ember-graphql-client/errors/graphql-error';

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

  #apiURL?: string;
  #options: Record<string, any> = {};
  #headers: Record<string, string> = {};

  errorHandler?: (
    error: any,
    options: { source: 'query' | 'mutate' }
  ) => false | Error;

  get apiURL(): string | undefined {
    return this.#apiURL;
  }

  set apiURL(apiURL: string | undefined) {
    this.#apiURL = apiURL;
  }

  get headers(): Record<string, string> {
    return this.#headers;
  }

  set headers(headers: Record<string, string>) {
    this.#headers = headers;
  }

  get options(): any {
    return this.#options;
  }

  set options(options: Record<string, any>) {
    this.#options = options;
  }

  #client?: GraphQLRequestClientInterface;
  get client(): GraphQLRequestClientInterface {
    if (this.#client) {
      return this.#client;
    }

    let graphQLClient = this._setupUnderlyingClient();
    let client = new GraphQLRequestClient(graphQLClient);

    // eslint-disable-next-line ember/no-side-effects
    this.#client = client;

    return client;
  }

  set client(client: GraphQLRequestClientInterface | undefined) {
    this.#client = client;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(owner: any) {
    super(owner);

    let config =
      getOwner(this).resolveRegistration('config:environment').graphql || {};

    this.#options = config.options;
    this.#apiURL = config.apiURL;
  }

  async query(
    options: QueryOptions,
    cacheOptions?: QueryCacheOptions
  ): Promise<GraphqlResponse> {
    let cachedResponse = options
      ? this.#maybeUseCachedResponse(options, cacheOptions)
      : undefined;

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      let response = await this.client.query(options);
      this.#maybeStoreCachedResponse(options, cacheOptions, response);
      return response;
    } catch (error) {
      throw this.#handleError(error);
    }
  }

  async mutate(
    options: MutationOptions,
    cacheOptions?: MutationCacheOptions
  ): Promise<GraphqlResponse> {
    let response;

    try {
      response = await this.client.mutate(options);
    } catch (error) {
      throw this.#handleError(error);
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

  #maybeUseCachedResponse(
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

  #maybeStoreCachedResponse(
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

  #handleError(error: Error): Error {
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
      return new GraphQLError(error);
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

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    graphql: GraphQLService;
  }
}
