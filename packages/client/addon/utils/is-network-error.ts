/*
  github/fetch: TypeError: Network request failed
  Chrome: TypeError: Failed to fetch
  Firefox: TypeError: NetworkError when attempting to fetch resource.
  Safari: TypeError: The Internet connection appears to be offline.
 */
export function isNetworkError(error: Error): boolean {
  let regex =
    /The Internet connection appears to be offline|Failed to fetch|Network request failed|NetworkError when attempting to fetch resource/;
  return regex.test(error.message);
}
