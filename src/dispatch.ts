import { IncomingMessage, ServerResponse } from 'http';
import { MockValue } from './index';

export default function(value: MockValue, req: IncomingMessage, res: ServerResponse) {
  if (typeof value === 'function') {
    return value(req, res);
  }

  if (typeof value === 'object') {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify(value));
  } else {
    res.write(value);
  }

  res.end();
}
