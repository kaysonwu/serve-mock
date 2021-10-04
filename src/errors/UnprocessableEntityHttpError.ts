import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class UnprocessableEntityHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(422, message, headers);
  }
}

export default UnprocessableEntityHttpError;
