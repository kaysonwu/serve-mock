import { IncomingMessage, ServerResponse } from 'http';
import { FSWatcher, WatchOptions } from 'chokidar';
import requireModule from './utils/require';
import isPlainObject from './utils/isPlainObject';
import find, { Options } from './utils/find';
import send from './utils/send';
import { Mock } from './interface';
import ArrayStore from './arrayStore';

export type ServeOptions = WatchOptions & Pick<Options, 'sensitive'>;

export default function createServe(paths: string | string[], options: ServeOptions = {}) {
  const mocks: Record<string, Mock> = {};
  const store = new ArrayStore();

  const { sensitive = true, ...watchOptions } = options;
  const watcher = new FSWatcher(watchOptions);

  watcher
    .on('add', path => {
      const module = requireModule(path);

      if (isPlainObject<Mock>(module)) {
        mocks[path] = module;
      }
    })
    .on('unlink', path => delete mocks[path])
    .on('change', path => {
      const module = requireModule(path, true);

      if (isPlainObject<Mock>(module)) {
        mocks[path] = module;
      }
    })
    .add(paths);

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const value = find(req, mocks, { sensitive });
    return value ? send(req, res, value, store) : next();
  };
}
