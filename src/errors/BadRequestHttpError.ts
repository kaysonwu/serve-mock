import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class BadRequestHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(400, message, headers);
  }
}

export default BadRequestHttpError;
