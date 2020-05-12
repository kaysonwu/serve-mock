import { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { existsSync } from 'fs';
import { parse } from 'url';
import { pathToRegexp } from 'path-to-regexp';
import dispatch from './dispatch';

export type MockFunctionValue = (req: IncomingMessage, res: ServerResponse) => void;
export type MockValue = string | Array<any> | Object | MockFunctionValue;

export interface IMock {
  [key: string]: MockValue;
}

interface ServeMockOptions {
  extensions: string[];
  cache?: boolean;
}

function resolveMockFile(pathname: string, root: string, extensions: string[]) {
  const paths = pathname.split('/');

  for (let i = paths.length; i-- > 0;) {
    for (let extension of extensions) {
      let filename = join(root, paths[i] + extension);

      if (existsSync(filename)) {
        return filename;
      }
    }
  }

  return false;
}

function requireMockFile(pathname: string, root: string, options: ServeMockOptions) {
  const filename = resolveMockFile(pathname, root, options.extensions);

  if (!filename) return false;

  const mock = require(filename);

  if (!options.cache) {
    delete require.cache[require.resolve(filename)];
  }

  if (mock && mock.__esModule) {
    return mock.default as IMock;
  }

  return mock as IMock;
}

function findMockValueFromKey(mock: IMock, key: string) {
  const keys = [key, key.toLocaleLowerCase()];

  for (let k of keys) {
    if (mock[k] !== undefined) {
      return mock[k];
    }
  }

  return false;
}

function findMockValue(mock: IMock, method: string, pathname: string) {
  const space = /\s+/g;
  const pattern = new RegExp(`(^|/)${method}(/|$)`, 'i');

  for (let key in mock) {
    let [m, path] = key.split(space, 2);
    if (pattern.test(m)
      && pathToRegexp(path).test(pathname)
    ) {
      return mock[key];
    }
  }

  return false;
}

export function createServe(root: string, options?: ServeMockOptions) {
  const opts = Object.assign({ extensions: ['.js', '.ts'], cache: true }, options);

  return function(req: IncomingMessage, res: ServerResponse, next: Function) {
    const { pathname } = parse(req.url as string);
    const mock = requireMockFile(pathname as string, root, opts);

    if (!mock) {
      return next();
    }

    const { method } = req;
    const value = findMockValueFromKey(mock, (method + ' ' + pathname)) || findMockValue(mock, method, pathname);

    if (value) {
      return dispatch(value, req, res);
    }

    next();
  }
}
