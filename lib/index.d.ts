/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
export declare type MockFunctionValue = (req: IncomingMessage, res: ServerResponse) => void;
export declare type MockValue = string | Array<any> | Object | MockFunctionValue;
export interface IMock {
    [key: string]: MockValue;
}
interface ServeMockOptions {
    extensions: string[];
    cache?: boolean;
}
export declare function createServe(root: string, options?: ServeMockOptions): (req: IncomingMessage, res: ServerResponse, next: Function) => any;
export {};
