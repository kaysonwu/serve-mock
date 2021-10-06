import { IncomingMessage, ServerResponse } from 'http';
import {
  NotFoundHttpError,
  UnprocessableEntityHttpError,
  delay,
  delays,
  resource,
} from '../src/index';
import Store from '../src/store';
import isPlainObject from '../src/utils/isPlainObject';
import { mockIncomingMessage, mockServerResponse } from './utils';

describe('Test utils', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('delay', () => {
    jest.useFakeTimers('legacy');

    delay('', 1000)({} as IncomingMessage, {} as ServerResponse, {} as Store);

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);

    delays({ 'GET /api/users': '' }, 1000, 2000)['GET /api/users'](
      {} as IncomingMessage,
      {} as ServerResponse,
      {} as Store,
    );
    expect(setTimeout).toHaveBeenCalledTimes(2);
  });

  test('isPlainObject', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(0)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject('')).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  test('arrayStore', () => {
    const store = new Store();

    expect(store.has('key')).toBe(false);
    expect(store.get('key')).toBe(null);
    expect(store.put('key', 'value')).toBe(true);
    expect(store.has('key')).toBe(true);
    expect(store.increment('increment')).toBe(1);
    expect(store.decrement('increment')).toBe(0);
    expect(store.forget('increment')).toBe(true);
    expect(store.forget('increment')).toBe(false);
    expect(store.pull('key')).toBe('value');
    expect(store.has('key')).toBe(false);
    store.pull('key', 'value');
    store.flush();
    expect(store.has('key')).toBe(false);
  });

  test('resource', async () => {
    const res = mockServerResponse();
    const store = new Store();
    const headers = { 'content-type': 'application/x-www-form-urlencoded' };

    let mock = resource('/api/users', {
      initialData: [
        { age: 18, id: 1, name: 'wanger' },
        { age: 19, id: 2, name: 'mazi' },
      ],
    });

    // Index
    let req = mockIncomingMessage('GET', '/api/users');
    mock['GET /api/users'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(res.write.mock.calls[res.write.mock.calls.length - 1][0]).toMatch(/mazi/);

    req = mockIncomingMessage('GET', '/api/users?page=1&pageSize=1');
    mock['GET /api/users'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(res.write.mock.calls[res.write.mock.calls.length - 1][0]).not.toMatch(/mazi/);

    // Create
    req = mockIncomingMessage('POST', '/api/users', 'name=zhangsan&age=20', headers);
    mock['POST /api/users'](req, res, store);
    await res.wait();

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([2, 'name'], 'zhangsan');

    req = mockIncomingMessage('POST', '/api/users', '{"name": "wangwu", "age": 21}', {
      'content-type': 'application/json;charset=utf-8',
    });
    mock['POST /api/users'](req, res, store);
    await res.wait();

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([3, 'name'], 'wangwu');

    // Update
    req = mockIncomingMessage('PUT', '/api/users/1024', 'name=lisi', headers);
    mock['PUT /api/users/:id'](req, res, store);
    expect(res.statusCode).toBe(404);

    req = mockIncomingMessage('PUT', '/api/users/3', 'name=lisi', headers);
    mock['PUT /api/users/:id'](req, res, store);
    await res.wait();

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([2, 'name'], 'lisi');

    // Show
    req = mockIncomingMessage('GET', '/api/users/1024');
    mock['GET /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(404);

    req = mockIncomingMessage('GET', '/api/users/3');
    mock['GET /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(res.write.mock.calls[res.write.mock.calls.length - 1][0]).toMatch(/lisi/);

    // Delete
    req = mockIncomingMessage('DELETE', '/api/users/3,4');
    mock['DELETE /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(204);
    expect(store.get('/api/users')).toHaveLength(2);

    // Options
    mock = resource('/api/users', { only: ['create', 'update'] });

    expect(mock).toHaveProperty('POST /api/users');
    expect(mock).toHaveProperty('PUT /api/users/:id');
    expect(mock).not.toHaveProperty('GET /api/users');

    mock = resource('/api/users', { except: ['create', 'update'] });

    expect(mock).not.toHaveProperty('POST /api/users');
    expect(mock).not.toHaveProperty('PUT /api/users/:id');
    expect(mock).toHaveProperty('GET /api/users');

    // Validator
    mock = resource('/api/users', {
      validator(data, _, records, type) {
        switch (type) {
          case 'create':
            if (typeof data === 'string') {
              throw new UnprocessableEntityHttpError({
                errors: { name: ['User name is required'] },
                message: 'This data is invalid',
              });
            }
            break;
          case 'update':
            if (data.name === 'lisi') {
              throw new Error('No permission');
            }
            break;
          case 'delete':
            if (Number(data[0]) === 1) {
              throw new NotFoundHttpError({ message: 'Not found.' });
            }
            return undefined;
          default:
            break;
        }

        return data;
      },
    });

    req = mockIncomingMessage('POST', '/api/users', 'name=wanger&age=20');
    mock['POST /api/users'](req, res, store);
    await res.wait();

    expect(res.statusCode).toBe(422);

    req = mockIncomingMessage('PUT', '/api/users/1', 'name=lisi&age=20', headers);
    mock['PUT /api/users/:id'](req, res, store);
    await res.wait();

    expect(res.statusCode).toBe(200);
    expect(res.write.mock.calls[res.write.mock.calls.length - 1][0]).toMatch(/No permission/);

    req = mockIncomingMessage('DELETE', '/api/users/1');
    mock['DELETE /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(404);
  });
});
