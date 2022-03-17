import { IncomingMessage, ServerResponse } from 'http';

export default function successHandler(_: IncomingMessage, res: ServerResponse, data: unknown): void {
  if (typeof data === 'string') {
    res.write(data);
  } else if (data !== undefined) {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify(data));
  }

  res.end();
}
