import { IncomingMessage, ServerResponse } from 'http';
import { MockValue, IMock } from './index';
import dispatch from './dispatch';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function delay(value: MockValue, min: number, max?: number) {
  const ms = ((max && max > min) ? rand(min, max) : min);
  return function(req: IncomingMessage, res: ServerResponse) {
    setTimeout(() => {
      dispatch(value, req, res);
    }, ms);
  }
}

export function delays(mock: IMock, min: number, max?: number) {
  const results: IMock = {};

  for (let key in mock) {
    results[key] = delay(mock[key], min, max);
  }

  return results;
}
