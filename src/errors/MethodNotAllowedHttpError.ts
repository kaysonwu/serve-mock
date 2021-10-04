import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class MethodNotAllowedHttpError extends HttpError {
  constructor(
    allow: string[] = [],
    message: Record<string, unknown> | string = '',
    headers: OutgoingHttpHeaders = {},
  ) {
    headers['Allow'] = allow.join(', ').toUpperCase();
    super(405, message, headers);
  }
}

export default MethodNotAllowedHttpError;
