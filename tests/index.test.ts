import { resolve } from 'path';
import { createServe } from '../src/index';
import { mockServerResponse } from './utils';

const root = resolve(__dirname, '__mocks__');

function testMockServe(url: string, method: string, options?: any, next?: Function) {
  const req: any = { url, method, headers: {} };
  const res = mockServerResponse();

  createServe(root, options)(req, res as any, () => {
    if (next) {
      next();
    }
  });

  return res;
}

describe('Test mock serve', () => {

  test('should be case insensitive', () => {
    let res = testMockServe('/api/currentUser', 'GET');
     
    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/name/);

    res = testMockServe('/api/currentUser', 'get');
     
    expect(res.write.mock.calls[0][0]).toMatch(/name/);
  });

  test('match subpath files first', () => {
    const res = testMockServe('/api/menus', 'GET');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/Home/);
  });

  test('should support multiple methods match', () => {
    let res = testMockServe('/api/menus', 'PUT');

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toMatch(/201/);

    res = testMockServe('/api/menus', 'PATCH');

    expect(res.write.mock.calls[0][0]).toMatch(/201/);
  });

  test('should call the next middleware', () => {
    const next = jest.fn(() => {});

    testMockServe('/v1/login', 'POST', undefined, next);
    expect(next).toHaveBeenCalledTimes(1);

    testMockServe('/api/login', 'POST', undefined, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('should support ES module', () => {
    const res = testMockServe('/api/es', 'GET');

    expect(res.write.mock.calls[0][0]).toMatch(/es/i);
  });

  test('should support request parameters', () => {
    const res = testMockServe('/api/users/1', 'GET');

    expect(res.write.mock.calls[0][0]).toMatch(/zhangsan/);
  });
});
