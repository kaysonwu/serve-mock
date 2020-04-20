import { IMock, MockValue, MockFunctionValue } from './index';
export declare function delay(value: MockValue, min: number, max?: number): MockFunctionValue;
export declare function delays(mock: IMock, min: number, max?: number): Record<string, MockFunctionValue>;
