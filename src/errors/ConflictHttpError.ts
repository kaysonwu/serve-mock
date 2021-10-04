import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class ConflictHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(409, message, headers);
  }
}

export default ConflictHttpError;
