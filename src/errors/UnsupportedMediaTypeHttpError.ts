import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class UnsupportedMediaTypeHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(415, message, headers);
  }
}

export default UnsupportedMediaTypeHttpError;
