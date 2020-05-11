import { resolve } from 'path';
import { createServe } from '../src/index';
import { createServerResponse, Response } from './utils';

const root = resolve(__dirname, '__mocks__');

const testMockServe = (url: string, method: string, options?: any, next?: Function) => {
  return new Promise<Response>((resolve) => {
    const req: any = { url, method };
    const res = createServerResponse(res => resolve(res));
    createServe(root, options)(req, res, () => {
      resolve({} as any);

      if (next) {
        next();
      }
    });
  });
}

describe('Test mock serve', () => {

  test('should be case insensitive', async () => {
    let response = await testMockServe('/api/currentUser', 'GET');
     
    expect(response.content).toMatch(/name/);
    expect(JSON.stringify(response.headers)).toMatch(/json/i);

    response = await testMockServe('/api/users', 'POST');
     
    expect(response.content).toMatch(/201/);
  });

  test('should match the subpath first', async () => {
    const response = await testMockServe('/api/menus', 'GET');

    expect(Array.isArray(JSON.parse(response.content))).toBeTruthy();
  });

  test('should support fuzzy match', async () => {
    const response = await testMockServe('/api/menus', 'POST');

    expect(response.content).toMatch(/201/);
  });

  test('should call the next middleware', async () => {
    const next = jest.fn(() => {});

    await testMockServe('/v1/login', 'POST', undefined, next);
    expect(next).toHaveBeenCalledTimes(1);

    await testMockServe('/api/login', 'POST', undefined, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('should support ES module', async () => {
    const response = await testMockServe('/api/es', 'GET');

    expect(response.content).toMatch(/es/i);
  });

  test('should support request parameters', async () => {
    const response = await testMockServe('/api/users/1', 'GET');

    expect(response.content).toMatch(/zhangsan/);
  });
});
