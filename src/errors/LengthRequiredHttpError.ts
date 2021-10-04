import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class LengthRequiredHttpError extends HttpError {
  constructor(message: Record<string, unknown> | string = '', headers: OutgoingHttpHeaders = {}) {
    super(411, message, headers);
  }
}

export default LengthRequiredHttpError;
