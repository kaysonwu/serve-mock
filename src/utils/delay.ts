import { Mock, MockValue, MockFunctionValue } from '../interface';
import send from './send';
import rand from './rand';

export function delay(value: MockValue, min: number, max?: number): MockFunctionValue {
  const ms = max && max > min ? rand(min, max) : min;
  return (req, res, store) => {
    setTimeout(() => send(req, res, value, store), ms);
  };
}

export function delays(mocks: Mock, min: number, max?: number): Record<string, MockFunctionValue> {
  const delayed: Record<string, MockFunctionValue> = {};

  for (const key in mocks) {
    delayed[key] = delay(mocks[key], min, max);
  }

  return delayed;
}
