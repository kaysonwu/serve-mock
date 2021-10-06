import { OutgoingHttpHeaders } from 'http';

class HttpError extends Error {
  protected statusCode: number;

  protected headers: OutgoingHttpHeaders;

  constructor(
    statusCode: number,
    message: Record<string, unknown> | string = '',
    headers: OutgoingHttpHeaders = {},
  ) {
    super(typeof message === 'string' ? message : JSON.stringify(message));

    this.statusCode = statusCode;
    this.headers = headers;

    if (
      typeof message !== 'string' &&
      !Object.prototype.hasOwnProperty.call(this.headers, 'Content-Type')
    ) {
      this.headers['Content-Type'] = 'application/json;charset=utf-8';
    }
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  getHeaders(): OutgoingHttpHeaders {
    return this.headers;
  }
}

export default HttpError;
