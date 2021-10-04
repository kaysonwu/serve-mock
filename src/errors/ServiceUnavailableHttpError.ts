import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class ServiceUnavailableHttpError extends HttpError {
  constructor(
    retryAfter: number | string | null = null,
    message: Record<string, unknown> | string = '',
    headers: OutgoingHttpHeaders = {},
  ) {
    if (retryAfter) {
      headers['Retry-After'] = retryAfter;
    }

    super(503, message, headers);
  }
}

export default ServiceUnavailableHttpError;
