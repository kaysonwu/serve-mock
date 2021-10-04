import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class PreconditionRequiredHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(428, message, headers);
  }
}

export default PreconditionRequiredHttpError;
