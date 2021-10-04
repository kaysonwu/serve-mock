import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class AccessDeniedHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(403, message, headers);
  }
}

export default AccessDeniedHttpError;
