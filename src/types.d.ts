/* eslint-disable @typescript-eslint/no-explicit-any */
// unknown 对接口不兼容，对类型兼容，因此使用 any，具体详见：https://github.com/microsoft/TypeScript/issues/45237
import { Stats } from 'fs';
import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';
import { WatchOptions } from 'chokidar';
import { ParsedQs } from 'qs';

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

export type MockFunctionValue = (req: IncomingMessage, res: ServerResponse, store: Store) => Promise<any> | any;
export type MockValue = string | Array<any> | Record<string, any> | MockFunctionValue;
export type Mock<V = MockValue> = Record<string, V>;

export interface ServeOptions extends WatchOptions {
  /** 是否区分大小写 */
  sensitive?: boolean;
  /** 失败响应处理器 */
  errorHandler?: (req: IncomingMessage, res: ServerResponse, error: Error) => void;
  /** 成功响应处理器 */
  successHandler?: (req: IncomingMessage, res: ServerResponse, data: any) => void;
  /** 文件监听事件 */
  onWatch?: (eventName: 'add' | 'change' | 'unlink', path: string, stats?: Stats) => void;
}

export type Serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export function createServe(paths: string | string[], options?: ServeOptions): Serve;

export function delay(value: MockValue, min: number, max?: number): MockFunctionValue;
export function delays(mock: Mock, min: number, max?: number): Mock<MockFunctionValue>;

export function rand(min: number, max: number): number;

export type ResourceAction = 'index' | 'create' | 'show' | 'update' | 'delete';
export interface ResourceOptions<T = Record<string, unknown>> {
  /** 数据行的键名，默认：id */
  rowKey: string;
  /** 初始数据 */
  initialData: T[];
  /** 截取数据长度的键名。请求列表数据时，当该查询参数为 1 时，只返回单条数据 */
  takeKey?: string;
  /** 允许创建的资源请求类型  */
  only?: ResourceAction[];
  /** 创建资源请求时需要排除掉的资源类型 */
  except?: ResourceAction[];
  /** 数据验证器，仅对：create、update、delete 资源类型有效 */
  validator(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T;
  validator(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  /** 分页器，仅对：index 资源类型有效 */
  pagination(data: T[], query: ParsedQs): T[] | { data: T[]; [key: string]: unknown };
  /** 过滤器，仅对：index 资源类型有效 */
  filter(data: T[], query: ParsedQs, req: IncomingMessage): T[];
  /** 在响应前对数据进行处理，如果返回 undefined 则不应答内容  */
  normalize(data: T | T [], type: ResourceAction): T | T[] | void;
}

export function resource<T = Record<string, unknown>>(
  uri: string,
  options?: Partial<ResourceOptions<T>>,
): Mock<MockFunctionValue>;

export function parser<T = Record<string, unknown> | string>(
  req: IncomingMessage,
  encoding?: string,
): Promise<T>;

export function getKeyFromUrl(url: string): string;
export function getKeysFromUrl(url: string): string[];

export function sleep(ms: number): Promise<void>;

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
