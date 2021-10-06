import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';
import { WatchOptions } from 'chokidar';
import { TokensToRegexpOptions } from 'path-to-regexp';

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

export type MockFunctionValue = (req: IncomingMessage, res: ServerResponse, store: Store) => void;
export type MockValue = string | Array<unknown> | Record<string, unknown> | MockFunctionValue;
export type Mock<V = MockValue> = Record<string, V>;

export type Serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export type ServeOptions = WatchOptions & Pick<TokensToRegexpOptions, 'sensitive'>;
export function createServe(paths: string | string[], options?: ServeOptions): Serve;

export function delay(value: MockValue, min: number, max?: number): MockFunctionValue;
export function delays(mock: Mock, min: number, max?: number): Mock<MockFunctionValue>;

export type ResourceAction = 'index' | 'create' | 'show' | 'update' | 'delete';
export interface ResourceOptions<T extends Record<string, unknown> = Record<string, unknown>> {
  rowKey: string;
  initialData: T[];
  only?: ResourceAction[];
  except?: ResourceAction[];
  validator(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T;
  validator(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  pagination(data: T[], query: ParsedUrlQuery): T[] | { data: T[]; [key: string]: unknown };
  filter(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[];
  responder(req: IncomingMessage, res: ServerResponse, data: T | T[], type: ResourceAction): void;
  errorHandler(req: IncomingMessage, res: ServerResponse, error: Error): void;
}

export function resource<T extends Record<string, unknown> = Record<string, unknown>>(
  uri: string,
  options?: Partial<ResourceOptions<T>>,
): Mock<MockFunctionValue>;

export function parser<T = Record<string, unknown> | string>(
  req: IncomingMessage,
  encoding?: string,
): Promise<T>;

export function getKeyFromUrl(url: string): string;
export function getKeysFromUrl(url: string): string[];

export class HttpError extends Error {
  constructor(
    statusCode: number,
    message?: Record<string, unknown> | string,
    headers?: OutgoingHttpHeaders,
  );
  getStatusCode(): number;
  getHeaders(): OutgoingHttpHeaders;
}

export class AccessDeniedHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class BadRequestHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class ConflictHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class GoneHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class LengthRequiredHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class MethodNotAllowedHttpError extends HttpError {
  constructor(
    allow?: string[],
    message?: Record<string, unknown> | string,
    headers?: OutgoingHttpHeaders,
  );
}

export class NotAcceptableHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class NotFoundHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class PreconditionFailedHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class PreconditionRequiredHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class ServiceUnavailableHttpError extends HttpError {
  constructor(
    retryAfter?: number | string,
    message?: Record<string, unknown> | string,
    headers?: OutgoingHttpHeaders,
  );
}

export class TooManyRequestsHttpError extends HttpError {
  constructor(
    retryAfter?: number | string,
    message?: Record<string, unknown> | string,
    headers?: OutgoingHttpHeaders,
  );
}

export class UnauthorizedHttpError extends HttpError {
  constructor(
    challenge: string,
    message?: Record<string, unknown> | string,
    headers?: OutgoingHttpHeaders,
  );
}

export class UnprocessableEntityHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}

export class UnsupportedMediaTypeHttpError extends HttpError {
  constructor(message?: Record<string, unknown> | string, headers?: OutgoingHttpHeaders);
}
