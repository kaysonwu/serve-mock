import { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { existsSync } from 'fs';
import { parse } from 'url';
import dispatch from './dispatch';

export type MockValue = string | Array<any> | Object | ((req: IncomingMessage, res: ServerResponse) => void);

export interface IMock {
  [key: string]: MockValue;
}

interface ServeMockOptions {
  extensions: string[];
  cache?: boolean;
}

function resolveMockFile(pathname: string, root: string, extensions: string[]) {
  const paths = pathname.split('/');

  for (let path of paths) {
    for (let extension of extensions) {
      let filename = join(root, path + extension);

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

  const mock = require(filename) as IMock;

  if (!options.cache) {
    // TODO
    console.log('requireFile', require.resolve(filename))
   //  delete require.cache[filename];
  }

  return mock;
}

function getMockValue(mock: IMock, method: string, pathname: string) {
  const key = [method, method.toLowerCase()]
    .map(m => m + ' ' + pathname)
    .find(m => (typeof mock[m] !== undefined));

  if (key) {
    return mock[key];
  }

  const pattren = new RegExp(`^${method}\\s*${pathname}\\s*$`, 'i');

  for (let k in mock) {
    if (pattren.test(k)) return mock[k];
  }

  return false;
}

export function serveMock(root: string, options?: ServeMockOptions) {
  const opts = Object.assign({ extensions: ['.js', '.ts'], cache: true }, options);

  return function(req: IncomingMessage, res: ServerResponse, next: Function) {
    const { pathname } = parse(req.url);
    const mock = requireMockFile(pathname, root, opts);
    const value = mock && getMockValue(mock, req.method, pathname);

    if (value) {
      return dispatch(value, req, res);
    }

    next();
  }
}
