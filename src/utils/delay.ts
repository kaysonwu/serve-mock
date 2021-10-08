/* eslint-disable no-restricted-syntax, guard-for-in */
import { Mock, MockFunctionValue, MockValue } from '../types';
import rand from './rand';
import send from './send';

export function delay(value: MockValue, min: number, max?: number): MockFunctionValue {
  return (req, res, store) => {
    setTimeout(() => send(req, res, value, store), max && max > min ? rand(min, max) : min);
  };
}

export function delays(mocks: Mock, min: number, max?: number): Record<string, MockFunctionValue> {
  const delayed: Record<string, MockFunctionValue> = {};

  for (const key in mocks) {
    delayed[key] = delay(mocks[key], min, max);
  }

  return delayed;
}
