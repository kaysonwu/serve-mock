/* eslint-disable guard-for-in, no-restricted-syntax */
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { ParseOptions, TokensToRegexpOptions, pathToRegexp } from 'path-to-regexp';
import { Mock, MockValue } from '../types';

export default function find(
  req: IncomingMessage,
  mocks: Record<string, Mock>,
  options?: TokensToRegexpOptions & ParseOptions,
): MockValue | undefined {
  const { method, url } = req;
  const { pathname } = parse(url!);

  const keys = [`${method} ${pathname}`, `${method!.toLowerCase()} ${pathname}`];
  const methodRegexp = new RegExp(`(^|/)${method}(/|$)`, 'i');

  for (const filename in mocks) {
    const name = keys.find(key => Object.prototype.hasOwnProperty.call(mocks[filename], key));

    if (name) {
      return mocks[filename][name];
    }

    for (const key in mocks[filename]) {
      const [prefix, path] = key.split(/\s+/g, 2);

      if (methodRegexp.test(prefix) && pathToRegexp(path, undefined, options).test(pathname!)) {
        return mocks[filename][key];
      }
    }
  }

  return undefined;
}
