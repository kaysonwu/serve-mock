import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class PreconditionFailedHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(412, message, headers);
  }
}

export default PreconditionFailedHttpError;
