import { delay, delays } from '../src/utils';
import { MockValue, IMock } from '../src';

interface MockResponse {
  content: any;
  headers: Record<string, string>;
}

const testDelay = (value: MockValue, ms: number = 5) => {
  return new Promise<MockResponse>((resolve) => {
    let response: Partial<MockResponse> = {};
    let val = value;

    if (typeof value === 'function') {
      val = function(req, res) {
        resolve(value(req, res));
      }
    }

    delay(val, ms)({} as any, {
      write(content) {
        response = {
          ...response,
          content,
        };
      },
      setHeader(name, value) {
        response = {
          ...response,
          headers: {
            ...response.headers,
            [name]: value,
          },
        };
      },
      end() {
        resolve(response as MockResponse);
      },
    } as any);
  });
}

describe('Test Utils', () => {

  test('delay can response correctly', async () => {
    let content: any = 'text content';
    let response = await testDelay(content);

    expect(response).toHaveProperty('content', content);

    content = { id: 1, name: 'zhangsan' };
    response = await testDelay(content);

    expect(response).toHaveProperty('content', JSON.stringify(content));
    expect(JSON.stringify(response.headers)).toMatch(/json/i);
  
    content = [{ id: 1, name: 'zhangsan' }, { id: 2, name: 'lisi' }];
    response = await testDelay(content);

    expect(response).toHaveProperty('content', JSON.stringify(content));
    expect(JSON.stringify(response.headers)).toMatch(/json/i);

    content = (req, res) => {
      res.write('callback');
      res.end()
    };
    response = await testDelay(content);
    
    expect(response).toHaveProperty('content', 'callback');
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
});
