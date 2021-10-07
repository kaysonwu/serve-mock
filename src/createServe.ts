import { FSWatcher } from 'chokidar';
import Store from './store';
import { Mock, Serve, ServeOptions } from './types';
import find from './utils/find';
import isPlainObject from './utils/isPlainObject';
import requireModule from './utils/require';
import send from './utils/send';

export default function createServe(paths: string | string[], options: ServeOptions = {}): Serve {
  const mocks: Record<string, Mock> = {};
  const store = new Store();

  const { sensitive = true, onWatch, ...watchOptions } = options;
  const watcher = new FSWatcher(watchOptions);

  watcher
    .on('add', (path, stats) => {
      const module = requireModule(path);

      if (isPlainObject<Mock>(module)) {
        mocks[path] = module;
      }

      onWatch?.('add', path, stats);
    })
    .on('unlink', path => {
      delete mocks[path];
      onWatch?.('unlink', path);
    })
    .on('change', (path, stats) => {
      const module = requireModule(path, true);

      if (isPlainObject<Mock>(module)) {
        mocks[path] = module;
      }

      onWatch?.('change', path, stats);
    })
    .add(paths);

  return (req, res, next) => {
    const value = find(req, mocks, { sensitive });
    return value ? send(req, res, value, store) : next();
  };
}
