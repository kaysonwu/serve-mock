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
    let data = await mock['GET /api/users'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(data).toHaveProperty([1, 'name'], 'mazi');

    req = mockIncomingMessage('GET', '/api/users?page=1&pageSize=1');
    data = await mock['GET /api/users'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(data).not.toHaveProperty([1, 'name'], 'mazi');

    // Create
    req = mockIncomingMessage('POST', '/api/users', 'name=zhangsan&age=20', headers);
    await mock['POST /api/users'](req, res, store);

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([2, 'name'], 'zhangsan');

    req = mockIncomingMessage('POST', '/api/users', '{"name": "wangwu", "age": 21}', {
      'content-type': 'application/json;charset=utf-8',
    });
    await mock['POST /api/users'](req, res, store);

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([3, 'name'], 'wangwu');

    // Update
    req = mockIncomingMessage('PUT', '/api/users/1024', 'name=lisi', headers);
    await mock['PUT /api/users/:id'](req, res, store);
    expect(res.statusCode).toBe(404);

    req = mockIncomingMessage('PUT', '/api/users/3', 'name=lisi', headers);
    await mock['PUT /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(201);
    expect(store.get('/api/users')).toHaveProperty([2, 'name'], 'lisi');

    // Show
    req = mockIncomingMessage('GET', '/api/users/1024');
    await mock['GET /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(404);

    req = mockIncomingMessage('GET', '/api/users/3');
    data = await mock['GET /api/users/:id'](req, res, store);

    expect(res.statusCode).toBe(200);
    expect(data).toHaveProperty('name', 'lisi');

    // Delete
    req = mockIncomingMessage('DELETE', '/api/users/3,4');
    await mock['DELETE /api/users/:id'](req, res, store);

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
      validator(item, _, records, type) {
        switch (type) {
          case 'create':
            if (typeof item === 'string') {
              throw new UnprocessableEntityHttpError({
                errors: { name: ['User name is required'] },
                message: 'This data is invalid',
              });
            }
            break;
          case 'update':
            if (item.name === 'lisi') {
              throw new Error('No permission');
            }
            break;
          case 'delete':
            if (Number(item[0]) === 1) {
              throw new NotFoundHttpError({ message: 'Not found.' });
            }
            return undefined;
          default:
            break;
        }

        return item;
      },
    });

    req = mockIncomingMessage('POST', '/api/users', 'name=wanger&age=20');
    await expect(mock['POST /api/users'](req, res, store)).rejects.toThrow(UnprocessableEntityHttpError);

    req = mockIncomingMessage('PUT', '/api/users/1', 'name=lisi&age=20', headers);
    await expect(mock['PUT /api/users/:id'](req, res, store)).rejects.toThrow(/No permission/);

    req = mockIncomingMessage('DELETE', '/api/users/1');
    await expect(mock['DELETE /api/users/:id'](req, res, store)).rejects.toThrow(NotFoundHttpError);
  });
});
