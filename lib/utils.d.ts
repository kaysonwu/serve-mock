/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';
import { IMock, MockValue, MockFunctionValue } from './index';
export declare function delay(value: MockValue, min: number, max?: number): MockFunctionValue;
export declare function delays(mock: IMock, min: number, max?: number): Record<string, MockFunctionValue>;
export declare function readyRequestData(req: IncomingMessage, callback: (data: ParsedUrlQuery) => void, encoding?: string): void;
export declare type ResourceAction = 'index' | 'create' | 'show' | 'update' | 'delete';
declare type ResourceOptions = {
    echo?: boolean;
    only?: ResourceAction[];
    except?: ResourceAction[];
    filter?: (records: any[], query: ParsedUrlQuery, req: IncomingMessage) => any;
    pagination?: (records: any[], query: ParsedUrlQuery) => any;
    validator?: (data: any, req: IncomingMessage, res: ServerResponse) => any;
    responder?: (req: IncomingMessage, res: ServerResponse, data: any, type: ResourceAction) => void;
};
export declare function defaultResponder(_: IncomingMessage, res: ServerResponse, data: any): void;
export declare function resource(name: string, initialRecords?: any[], options?: ResourceOptions): Record<string, MockFunctionValue>;
export {};
