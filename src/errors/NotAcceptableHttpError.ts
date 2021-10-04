import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class NotAcceptableHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(406, message, headers);
  }
}

export default NotAcceptableHttpError;
