import { OutgoingHttpHeaders } from 'http';
import HttpError from './HttpError';

class UnauthorizedHttpError extends HttpError {
  constructor(
    challenge: string,
    message: Record<string, unknown> | string = '',
    headers: OutgoingHttpHeaders = {},
  ) {
    // eslint-disable-next-line no-param-reassign
    headers['WWW-Authenticate'] = challenge;
    super(401, message, headers);
  }
}

export default UnauthorizedHttpError;
