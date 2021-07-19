import { QueryOptions } from '@ember-graphql-client/client/utils/graphql-request-client';

export default class GraphQLCache {
  _entityCacheMap = new Map();

  getCache(entityName: string, entityId?: string): GraphQLEntityCache {
    let mapKey = entityId ? `${entityName}-${entityId}` : entityName;

    let cache = this._entityCacheMap.get(mapKey);

    if (cache) {
      return cache;
    }

    cache = new GraphQLEntityCache();
    this._entityCacheMap.set(mapKey, cache);
    return cache;
  }
}

interface CacheItem {
  timestamp: number;
  response: any;
}

export class GraphQLEntityCache {
  _queryCacheMap = new Map<number, CacheItem>();

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  set(options: QueryOptions, response: any): void {
    let hash = hashOptions(options);

    this._queryCacheMap.set(hash, {
      response,
      timestamp: Math.round(+new Date() / 1000),
    });
  }

  get(options: QueryOptions): CacheItem | undefined {
    let hash = hashOptions(options);

    return this._queryCacheMap.get(hash);
  }

  clear(): void {
    this._queryCacheMap.clear();
  }

  remove(options: QueryOptions): void {
    let hash = hashOptions(options);

    this._queryCacheMap.delete(hash);
  }
}

// Based on: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hashOptions(options: QueryOptions): number {
  let str = JSON.stringify(options);

  let hash = 0;

  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}
