import { resolve } from 'path';
import { createServe, ServeOptions } from '../src/index';
import { mockIncomingMessage, mockServerResponse } from './utils';

jest.mock('chokidar', () => {
  const { readdirSync, statSync } = require('fs');
  const { join } = require('path');

  const originalModule = jest.requireActual('chokidar');

  originalModule.FSWatcher.prototype.add = function (path: string) {
    const add = this.rawListeners('add')[0];
    const unlink = this.rawListeners('unlink')[0];
    const change = this.rawListeners('change')[0];

    readdirSync(path).forEach(name => {
      const filename = join(path, name);
      const stat = statSync(filename);

      if (name === 'login.js') {
        unlink(filename, stat);
      } else if (name === 'user.js') {
        change(filename, stat);
      } else if (stat.isFile()) {
        add(filename, stat);
      }
    });
  };

  return originalModule;
});

const root = resolve(__dirname, '__mocks__');

function testMockServe(method: string, url: string, options?: ServeOptions, next?: Function) {
  const req = mockIncomingMessage(method, url);
  const res = mockServerResponse();

  createServe(root, options)(req, res, () => {
    if (next) {
      next();
    }
  });

  return res;
}

describe('Test mock serve', () => {
  test('method should be case insensitive', () => {
    let res = testMockServe('GET', '/api/currentUser');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/name/);

    res = testMockServe('get', '/api/currentUser');
    expect(res.write.mock.calls[0][0]).toMatch(/name/);

    res = testMockServe('POST', '/api/users');
    expect(res.write.mock.calls[0][0]).toMatch(/success/);
  });

  test('should support multiple methods match', () => {
    let res = testMockServe('PUT', '/api/users');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/201/);

    res = testMockServe('PATCH', '/api/users');
    expect(res.write.mock.calls[0][0]).toMatch(/201/);
  });

  test('should call the next middleware', () => {
    const next = jest.fn(() => {});

    testMockServe('POST', '/api/login', undefined, next);
    expect(next).toHaveBeenCalledTimes(1);

    testMockServe('GET', '/api/logout', undefined, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('should support ES module', () => {
    const res = testMockServe('GET', '/api/es');

    expect(res.write.mock.calls[0][0]).toMatch(/es/i);
  });

  test('should support request parameters', () => {
    const res = testMockServe('GET', '/api/users/1');
    expect(res.write.mock.calls[0][0]).toMatch(/zhangsan/);
  });
});
