import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class NotFoundHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(404, message, headers);
  }
}

export default NotFoundHttpError;
