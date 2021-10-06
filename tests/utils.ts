import {
  IncomingHttpHeaders,
  IncomingMessage,
  OutgoingHttpHeaders,
  OutgoingMessage,
  ServerResponse,
} from 'http';
import { Socket } from 'net';

interface Response extends ServerResponse {
  write: jest.Mock;
  setHeader: jest.Mock;
  wait: () => Promise<void>;
}

export function mockIncomingMessage(
  method: string,
  url: string,
  data = '',
  headers: IncomingHttpHeaders = {},
): IncomingMessage {
  const req = new IncomingMessage(new Socket());

  Object.assign(req, {
    headers,
    method,
    url,
    on(name: string, callback: (value?: unknown) => void) {
      if (name === 'data') {
        callback(data);
      } else if (name !== 'error') {
        callback();
      }

      return this;
    },
  });

  return req;
}

export function mockServerResponse(): Response {
  let end: (value?: unknown) => void;
  let waitPromise = new Promise(resolve => {
    end = resolve;
  });

  return {
    end: () => {
      end();
      waitPromise = new Promise(resolve => {
        end = resolve;
      });
    },
    getHeader(name: string): number | string | string[] | undefined {
      return this.headers[name];
    },
    getHeaders(): OutgoingMessage {
      return this.headers;
    },
    headers: {},
    setHeader: jest.fn(),
    statusCode: 0,
    wait: () => waitPromise,
    write: jest.fn(),
    writeHead(statusCode: number, headers: OutgoingHttpHeaders): void {
      this.statusCode = statusCode;
      this.headers = headers;
    },
  } as unknown as Response;
}
