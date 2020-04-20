import { IncomingMessage, ServerResponse } from 'http';
import { MockValue, IMock } from './index';
import dispatch from './dispatch';

export function delay(value: MockValue, ms: number | true) {
  if (ms === true) {
    
  }

  return function(req: IncomingMessage, res: ServerResponse) {
    setTimeout(() => {
      dispatch(value, req, res);
    }, ms as number);
  }
}

export function delays(mock: IMock, ms: number | true) {
  const results = {};

  for (let key in mock) {
    results[key] = delay(mock[key], ms);
  }

  return results;
}
