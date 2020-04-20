import { delay, delays } from '../src/utils';

const req: any = {};
const createResponse = () => {
  return {
    write: jest.fn(c => c),
    setHeader() {},
    end() {},
  };
}

describe('Test Utils', () => {
  test('has a fixed delay', () => {
    const res = createResponse();
  });
});
