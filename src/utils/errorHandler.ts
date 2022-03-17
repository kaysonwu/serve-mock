import { IncomingMessage, ServerResponse } from 'http';
import HttpError from '../errors/HttpError';

export default function errorHandler(
  _: IncomingMessage,
  res: ServerResponse,
  error: Error
): void {
  if (error instanceof HttpError) {
    res.writeHead(error.getStatusCode(), error.getHeaders());
    res.write(error.message);
  } else if (error instanceof Error) {
    res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
    res.write(JSON.stringify({ status: 400, message: error.message }));
  }

  res.end();
}
