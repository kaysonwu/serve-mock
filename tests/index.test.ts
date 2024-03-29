/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { resolve } from 'path';
import { createServe } from '../src/index';
import { ServeOptions } from '../src/types';
import { mockIncomingMessage, mockServerResponse } from './utils';

jest.mock('chokidar', () => {
  const { readdirSync, statSync } = require('fs');
  const { join } = require('path');

  const originalModule = jest.requireActual('chokidar');

  originalModule.FSWatcher.prototype.add = function add(path: string) {
    const onAdd = this.rawListeners('add')[0];
    const onUnlink = this.rawListeners('unlink')[0];
    const onChange = this.rawListeners('change')[0];

    readdirSync(path).forEach(name => {
      const filename = join(path, name);
      const stat = statSync(filename);

      if (name === 'login.js') {
        onUnlink(filename, stat);
      } else if (name === 'user.js') {
        onChange(filename, stat);
      } else if (stat.isFile()) {
        onAdd(filename, stat);
      }
    });
  };

  return originalModule;
});

const root = resolve(__dirname, '__mocks__');

async function testMockServe(method: string, url: string, options?: ServeOptions, next?: () => void) {
  const req = mockIncomingMessage(method, url);
  const res = mockServerResponse();

  await createServe(root, options)(req, res, () => {
    if (next) {
      next();
    }
  });

  return res;
}

describe('Test mock serve', () => {
  test('method should be case insensitive', async () => {
    let res = await testMockServe('GET', '/api/currentUser');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/name/);

    res = await testMockServe('get', '/api/currentUser');
    expect(res.write.mock.calls[0][0]).toMatch(/name/);

    res = await testMockServe('POST', '/api/users');
    expect(res.write.mock.calls[0][0]).toMatch(/success/);
  });

  test('should support multiple methods match', async () => {
    let res = await testMockServe('PUT', '/api/users');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/201/);

    res = await testMockServe('PATCH', '/api/users');
    expect(res.write.mock.calls[0][0]).toMatch(/201/);
  });

  test('should call the next middleware', () => {
    const next = jest.fn(() => {
      // noop
    });

    testMockServe('POST', '/api/login', undefined, next);
    expect(next).toHaveBeenCalledTimes(1);

    testMockServe('GET', '/api/logout', undefined, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('should support ES module', async () => {
    const res = await testMockServe('GET', '/api/es');
    expect(res.write.mock.calls[0][0]).toMatch(/es/i);
  });

  test('should support request parameters', async () => {
    const res = await testMockServe('GET', '/api/users/1');
    expect(res.write.mock.calls[0][0]).toMatch(/zhangsan/);
  });

  test('should support error handler', async () => {
    const res = await testMockServe('GET', '/api/error');
    expect(res.write.mock.calls[0][0]).toMatch(/error/);
  });
});
