import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class GoneHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(410, message, headers);
  }
}

export default GoneHttpError;
