<h1 align="center">Serve Mock</h1>
<div align="center">
用于提供 Mock 文件的中间件
<br /><br />

![npm](https://img.shields.io/npm/v/serve-mock?style=flat-square)
![node](https://img.shields.io/node/v/serve-mock?style=flat-square)
![coverage](https://img.shields.io/codecov/c/github/kaysonwu/serve-mock/master?style=flat-square)
![downloads](https://img.shields.io/npm/dy/serve-mock?style=flat-square)
![license](https://img.shields.io/npm/l/serve-mock?style=flat-square)
[![build status](https://travis-ci.com/kaysonwu/serve-mock.svg?branch=master)](https://travis-ci.com/kaysonwu/serve-mock?style=flat-square)
<br /><br />
[English](README.md) | 中文 
</div>

- [安装](#安装)
- [使用](#使用)
  - [webpack-dev-server](#webpack-dev-server)
  - [响应处理器](#响应处理器)  
- [Utils](#utils)
  - [休眠](#休眠)
  - [延迟](#延迟)
  - [资源](#资源)
    - [资源选项](#资源选项)
    - [部分资源](#部分资源)
    - [自定义分页](#自定义分页)
    - [自定义验证器](#自定义验证器)
- [Typescript](#typescript)

## 安装

```
yarn add -D serve-mock
```

or

```
npm install -D serve-mock
```

## 使用

它是一个 `http` 中间件，因此，您可以在任何 `http` 服务中使用它：

```js
const { resolve } = require('path');
const http = require('http')
const { createServe } = require('serve-mock');

const mock = createServe(resolve(__dirname, 'mocks'));
http.createServer(function onRequest (req, res) {
  mock(req, res, () => {
    // If there is no corresponding mock file, you can do something here.
  });
}).listen(3000);

```

### webpack-dev-server

```js
const { resolve } = require('path');
const { createServe } = require('serve-mock');

module.exports = {
  mode: 'development',
  devServer: {
    ....,
    after(app) {
      app.all('*', createServe(resolve(__dirname, 'mocks')));
    },
  },
};
```

### 响应处理器

`Serve mock` 提供了两种状态的响应处理器，分别是：`errorHandler` 和 `successHandler`，可以通过对响应处理器的修改已满足定制化需求。

```js
function errorHandler(_: IncomingMessage, res: ServerResponse, error: Error): void {
  if (error instanceof HttpError) {
    res.writeHead(error.getStatusCode(), error.getHeaders());
    res.write(error.message);
  } else if (error instanceof Error) {
    res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
    res.write(JSON.stringify({ status: 400, message: error.message }));
  }

  res.end();
}

function successHandler(_: IncomingMessage, res: ServerResponse, data: unknown): void {
  if (typeof data === 'string') {
    res.write(data);
  } else if (data !== undefined) {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify(data));
  }

  res.end();
}

createServe(resolve(__dirname, 'mocks'), { errorHandler, successHandler })
```

## Utils

### 休眠

可以通过 `sleep` 在流程中实现延迟需求

```js
const { sleep, rand } = require('serve-mock');

module.exports = {
  'GET /api/currentUser': async (req, res) => {
    await sleep(rand(1000, 2000));

    // do thing.
  },
};
```

### 延迟

有时我们需要模拟网络延迟：

```js
const { delay } = require('serve-mock');

module.exports = {
  'GET /api/currentUser': delay({ id: 1, name: 'kayson' }, 1000),
};
```

使用 `delay` 延迟单个对象，如果要延迟所有对象，请使用 `delays`：

```js
const { Mock, delays } = require('serve-mock');

const mock: Mock = {
  'GET /api/currentUser': { id: 1, name: 'kayson' },
  'GET /api/users': [{ id: 1, name: 'zhangsan', id: 2, name: 'lisi' }],
};

module.exports = delays(mock, 100, 1000);
```

### 资源

`resource` 为定义一组模拟资源的 API 提供便捷方式

```typescript
function resource<T extends Record<string, unknown> = Record<string, unknown>>(name: string, options: ResourceOptions<T> = {}): Mock
```

#### 资源选项

```typescript
interface ResourceOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** 数据行的键名，默认：id */
  rowKey: string;
  /** 初始数据 */
  initialData: T[];
  /** 允许创建的资源请求类型  */
  only?: ResourceAction[];
  /** 创建资源请求时需要排除掉的资源类型 */
  except?: ResourceAction[];
  /** 数据验证器，仅对：create、update、delete 资源类型有效 */
  validator(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T;
  validator(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  /** 分页器，仅对：index 资源类型有效 */
  pagination(data: T[], query: ParsedUrlQuery): T[] | { data: T[]; [key: string]: unknown };
  /** 过滤器，仅对：index 资源类型有效 */
  filter(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[];
  /** 在响应前对数据进行处理，如果返回 undefined 则不应答内容  */
  normalize(data: T | T [], type: ResourceAction): T | T[] | void;
}
```

一行代码即可模拟出 RESTful 风格的 API：

```js
const { resource } = require('server-mock');

module.exports = resource('/api/users');
```

上述代码相当于：

```js
const mock = {
  // Create
  'POST /api/users': (req, res) => {
    res.statusCode = 201;
    res.end();
  },
  // Update
  'PUT /api/users/:id': (req, res) => {
    res.statusCode = 201;
    res.end();
  },

  // Query -> Index
  'GET /api/users': [],
  // Query -> Show
  'GET /api/users/:id': {},

  // Delete
  'DELETE /api/users/:id': (req, res) => {
    res.statusCode = 204;
    res.end();
  },
}
```

#### 部分资源

当声明资源 API 时，你可以指定模拟部分行为，而不是所有默认的行为：

```js
const { resource } = require('server-mock');

module.exports = resource('/api/users', { only: ['index', 'show'] });

// 或者

module.exports = resource('/api/users', { except: ['create', 'update', 'delete'] });
```

#### 自定义分页

对于需要数据分页的请求，如果默认分页无法满足需求可以选择自定义：

```js
const { resource, ResourceOptions } = require('server-mock');

const pagination: ResourceOptions['pagination'] = (data, query) => {
  // 在这里开始你的分页逻辑
};

module.exports = resource('/api/users', { pagination });
```

#### 自定义验证器

为了更加真实的模拟后端 API，我们还可以对请求数据进行验证，并选择性的对请求进行报错：

```js
const { resource, ResourceOptions, UnprocessableEntityHttpError } = require('server-mock');

const validator: ResourceOptions['validator'] = (data, req, records, type) => {
  if (data.name === 'admin') {
    throw new UnprocessableEntityHttpError({ message: 'Admin 已经存在' });
  }

  return data;
};

module.exports = resource('/api/users', { validator });
```

## Typescript

如果你的 `mock` 文件需要使用 [Typescript](https://www.typescriptlang.org/), 则可以使用 [@babel/register](https://babeljs.io/docs/en/next/babel-register.html) 来提供编译服务：

```js
const { resolve } = require('path');
const register = require('@babel/register');
const { createServe } = require('serve-mock');

register({
  caller: {
    name: 'serve-mock'
  },
  extensions: ['.ts'],
});

module.exports = {
  mode: 'development',
  devServer: {
    ....,
    after(app) {
      app.all('*', createServe(resolve(__dirname, 'mocks')));
    },
  },
};
```
