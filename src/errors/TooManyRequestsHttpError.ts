import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class TooManyRequestsHttpError extends HttpError {
  constructor(
    retryAfter: number | string | null = null,
    message: Record<string, unknown> | string = '',
    headers: OutgoingHttpHeaders = {},
  ) {
    if (retryAfter) {
      // eslint-disable-next-line no-param-reassign
      headers['Retry-After'] = retryAfter;
    }

    super(429, message, headers);
  }
}

export default TooManyRequestsHttpError;
