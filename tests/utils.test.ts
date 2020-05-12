import { MockValue, IMock, MockFunctionValue } from '../src/index';
import { delay, delays, resource, ResourceAction } from '../src/utils';
import { mockIncomingMessage, mockServerResponse } from './utils';

const testDelay = (value: MockValue, ms: number = 5) => {
  return new Promise<ReturnType<typeof mockServerResponse>>((resolve) => {
    let val = value;
    const res = mockServerResponse();

    if (typeof value === 'function') {
      val = function(req, res) {
        resolve(value(req, res));
      }
    }

    delay(val, ms)({ headers: {} } as any, res as any);
    setTimeout(() => {
      resolve(res);
    }, ms);
  });
}

function testResource(
  action: ResourceAction, 
  data: any,
  options: any = {}
): [ReturnType<typeof mockServerResponse>, Record<string, MockFunctionValue>] {
  const { id, headers } = options;
  const mock = options.mock || resource('/api/users', [{ id: 1, name: 'zhangsan' }], options);

  let key = '';
  let url = 'http://127.0.0.1/api/user';

  if (id) {
    url += '/' + id;
  }

  switch (action) {
    case 'create':
      key = `POST /api/users`;
      break;
    case 'update':
      key = `PUT /api/users/:id`;
      break;  
    case 'index':
      key = `GET /api/users`;

      if (data) {
        url += '?' + data;
      }
      break;  
    case 'show':
      key = `GET /api/users/:id`;
      break;
    default:
      key = `DELETE /api/users/:id`;
      break;    
  }

  const req = mockIncomingMessage(url, data, headers);
  const res = mockServerResponse();
  
  mock[key](req as any, res as any);

  return [res, mock];
}

describe('Test Utils', () => {

  test('delay can response correctly', async () => {
    let content: any = 'text content';
    let res = await testDelay(content);

    expect(res.write.mock.calls.length).toBe(1);
    expect(res.write.mock.calls[0][0]).toEqual(content);

    content = { id: 1, name: 'zhangsan' };
    res = await testDelay(content);

    expect(res.write.mock.calls[0][0]).toEqual(JSON.stringify(content));
    expect(res.setHeader.mock.calls.length).toBe(1);
    expect(res.setHeader.mock.calls[0][1]).toMatch(/json/i);

    content = jest.fn();
    await testDelay(content);
    
    expect(content.mock.calls.length).toBe(1);
  });

  // Don't put this test in front.
  // Because it mock setTimeout, it will interfere with other asynchronous tests.
  test('delay has fixed and random times', () => {

    jest.useFakeTimers();

    const req: any = {};
    const res: any = {};
    
    delay('Fixed times', 500)(req, res);

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);

    delay('Random times', 100, 1000)(req, res);

    expect(setTimeout).toHaveBeenCalledTimes(2);

    const calls: any[] = (setTimeout as any).mock.calls;
    const ms = calls[calls.length - 1][1];

    expect(ms).toBeLessThanOrEqual(1000);
    expect(ms).toBeGreaterThanOrEqual(100);

    const proxies = { 'GET /api/currentUser': { id: 1, name: 'zhangsan' }, 'POST /api/login': { status: 200 } } as IMock;
    const delayed = delays(proxies, 5);

    for (let k in delayed) {
      delayed[k](req, res);
    }

    expect(setTimeout).toHaveBeenCalledTimes(4);
  });

  describe('Test resource', () => {
    describe('test resource create action', () => {
      test('should be store record', () => {
        let [res, mock] = testResource('create', 'name=wangwu');

        expect(res.statusCode).toBe(201);

        [res] =  testResource('index', '', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/wangwu/);
      });

      test('should be echo record', () => {
        const [res] = testResource('create', 'name=wangwu', { echo: true });
   
        expect(res.statusCode).toBe(201);
        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/wangwu/);
      });

      test('should be support JSON', () => {
        let [res, mock] = testResource('create', JSON.stringify({ name: 'wangwu' }), { headers: { 'content-type': 'application/json' } });

        expect(res.statusCode).toBe(201);

        [res] =  testResource('index', '', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/wangwu/);
      });

      test('with custom resource validator', () => {
        const validator = jest.fn((_, __, res) => {
          res.statusCode = 422;
          return false;
        });

        const [res] = testResource('create', 'name=wangwu', { validator });

        expect(res.statusCode).toBe(422);
      });
    });

    describe('test resource update action', () => {
      test('should be store record', () => {
        let [res, mock] = testResource('update', 'name=lisi', { id: 1 });
        
        expect(res.statusCode).toBe(201);

        [res] =  testResource('index', '', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/lisi/);
      });

      test('should be echo record', () => {
        const [res] = testResource('update', 'name=lisi', { id: 1, echo: true });
   
        expect(res.statusCode).toBe(201);
        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/lisi/);
      });

      test('should response to not found', () => {
        const [res] = testResource('update', 'name=lisi');

        expect(res.statusCode).toBe(404);
      });

      test('with custom resource validator', () => {
        const validator = jest.fn((_, __, res) => {
          res.statusCode = 422;
          return false;
        });

        const [res, mock] = testResource('update', 'name=lisi', { id: 1, validator });

        expect(res.statusCode).toBe(422);
      });
    });

    describe('test resource index action', () => {
      test('should support conditional filter', () => {
        let [res, mock] = testResource('create', 'id=2&name=lisi');
        [res] = testResource('index', 'name=lisi', { mock });
   
        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/lisi/);

        const response = JSON.parse(res.write.mock.calls[0][0]);

        expect(Array.isArray(response)).toBeTruthy();
        expect(response.length).toBe(1);
      });

      test('support data paging', () => {
        let [res, mock] = testResource('create', 'id=2&name=lisi');

        testResource('create', 'name=wangwu', { mock });
        testResource('create', 'name=mazi', { mock });
        testResource('create', 'name=niuer', { mock });

        [res] = testResource('index', 'page=1', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/pagination/);

        [res] = testResource('index', 'page=1&page_size=2', { mock });

        const { data } = JSON.parse(res.write.mock.calls[0][0]);
   
        expect(data.length).toBe(2);
        expect(data[1]).toHaveProperty('name', 'lisi');

        [res] = testResource('index', 'page=2&page_size=2', { mock });

        const response = JSON.parse(res.write.mock.calls[0][0]);
   
        expect(response.data[1]).toHaveProperty('name', 'mazi');
      });

      test('with custom resource filter', () => {
        const filter = jest.fn(records => records);
        const [res] = testResource('index', 'id=1', { filter });

        expect(filter.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/zhangsan/);
      });
    });

    describe('test resource show action', () => {
      test('should be found record', () => {
        const [res] = testResource('show', '', { id: 1 });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toMatch(/zhangsan/);
      });

      test('should response to not found', () => {
        const [res] = testResource('show', '', { id: 2 });

        expect(res.statusCode).toBe(404);
      });
    });

    describe('test resource delete action', () => {
      test('always response 204', () => {
        const [res] = testResource('delete', '', { id: 2 });

        expect(res.statusCode).toBe(204)
      });

      test('should be support multiple ID', () => {
        let [res, mock] = testResource('delete', '', { id: '1,2' });

        expect(res.statusCode).toBe(204);

        [res] = testResource('index', '', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toEqual('[]');
      });

      test('should be support URL encoded', () => {
        let [res, mock] = testResource('delete', '', { id: encodeURIComponent('1,2') });

        expect(res.statusCode).toBe(204);

        [res] = testResource('index', '', { mock });

        expect(res.write.mock.calls.length).toBe(1);
        expect(res.write.mock.calls[0][0]).toEqual('[]');
      });
    });

    describe('with partial resource', () => {
      test('should only be given resources', () => {
        const mock = resource('/api/users', [], { only: ['show'] });
  
        expect(Object.keys(mock)).toHaveLength(1);
        expect(mock).toHaveProperty('GET /api/users/:id');
      });
  
      test('should except be given resources', () => {
        const mock = resource('/api/users', [], { except: ['show'] });
  
        expect(Object.keys(mock)).toHaveLength(4);
        expect(mock).toHaveProperty('GET /api/users');
      });
    });
  });
});
