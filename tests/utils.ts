import { IncomingHttpHeaders } from 'http';

export function mockIncomingMessage(url: string, data: string = '', headers: IncomingHttpHeaders = {}) {
  return {
    url,
    headers,
    setEncoding: jest.fn(),
    on: jest.fn((name: string, callback: Function) => {
      if (name === 'data') {
        callback(data);
      } else {
        callback();
      }
    }),
  }
}

export function mockServerResponse() {
  return {
    statusCode: 0,
    write: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };
}
