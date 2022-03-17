import { IncomingMessage, ServerResponse } from 'http';
import { MockValue, Store } from '../types';

export default async function send(
  req: IncomingMessage,
  res: ServerResponse,
  value: MockValue,
  store: Store,
): Promise<unknown> {
  if (typeof value === 'function') {
    return value(req, res, store);
  }

  return value;
}
