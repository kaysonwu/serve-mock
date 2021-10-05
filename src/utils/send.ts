import { IncomingMessage, ServerResponse } from 'http';
import { MockValue, Store } from '../interface';

export default function send(
  req: IncomingMessage,
  res: ServerResponse,
  value: MockValue,
  store: Store,
): void {
  if (typeof value === 'function') {
    return value(req, res, store);
  }

  if (typeof value === 'string') {
    res.write(value);
  } else {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify(value));
  }

  return res.end();
}
