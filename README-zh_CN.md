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
- [Utils](#utils)
  - [延迟](#延迟)
  - [资源](#资源)
    - [资源选项](#资源选项)
    - [部分资源](#部分资源)
    - [自定义分页](#自定义分页)
    - [自定义验证器](#自定义验证器)
    - [自定义响应](#自定义响应)
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

## Utils

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
  rowKey?: string; // 数据行的键名
  initialData?: T[]; // 初始化数据
  only?: ResourceAction[]; // 仅模拟给定的资源 API
  except?: ResourceAction[]; // 模拟除给定外的资源 API
  validator?(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T; // 自定义创建和更新时的数据验证
  validator?(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  pagination?(data: T[], query: ParsedUrlQuery): WithPagination<T>; // 自定义查询结果分页
  filter?(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[]; // 自定义查询结果过滤器
  responder?(req: IncomingMessage, res: ServerResponse, data: T | T[], type: ResourceAction): void; // 自定义数据响应
  errorHandler?(req: IncomingMessage, res: ServerResponse, error: Error): void; // 自定义错误处理程序
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

#### 自定义响应

如果你对某些 api 响应不满意，则可以自定义它：

```js
const { resource, ResourceOptions } = require('server-mock');

const responder: ResourceOptions['responder'] = (req, res, data, type) => {
  // 在这里开始你的响应逻辑
};

module.exports = resource('/api/users', { responder });
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
