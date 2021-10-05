import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';

export interface Store {
  /**
   * Determine if the given key exists in storage.
   */
  has(key: string): boolean;

  /**
   * Retrieve an item from the storage by key.
   */
  get<T = unknown>(key: string): T | null;
  get<T = unknown>(key: string, defaultValue: T): T;

  /**
   * Store an item in the storage.
   */
  put<T = unknown>(key: string, value: T): boolean;

  /**
   * Increment the value of an item in the storage.
   */
  increment(key: string, value?: number): number;

  /**
   * Decrement the value of an item in the storage.
   */
  decrement(key: string, value?: number): number;

  /**
   * Remove an item from the store.
   */
  forget(key: string): boolean;

  /**
   * Retrieve an item from the storage and delete it.
   */
  pull<T = unknown>(key: string): T | null;
  pull<T = unknown>(key: string, defaultValue: T): T;

  /**
   * Remove all items from the storage.
   */
  flush(): void;
}

export type ResourceAction = 'index' | 'create' | 'show' | 'update' | 'delete';

export type WithPagination<T> =
  | T[]
  | {
      data: T[];
      pagination?: {
        current: number;
        pageSize: number;
        total: number;
      };

      [key: string]: unknown;
    };

export interface ResourceOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  rowKey: string;
  initialData: T[];
  only?: ResourceAction[];
  except?: ResourceAction[];
  validator(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T;
  validator(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  pagination(data: T[], query: ParsedUrlQuery): WithPagination<T>;
  filter(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[];
  responder(req: IncomingMessage, res: ServerResponse, data: T | T[], type: ResourceAction): void;
  errorHandler(req: IncomingMessage, res: ServerResponse, error: Error): void;
}

export type MockFunctionValue = (req: IncomingMessage, res: ServerResponse, store: Store) => void;

export type MockValue = string | Array<unknown> | Record<string, unknown> | MockFunctionValue;

export type Mock = Record<string, MockValue>;
