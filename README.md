<h1 align="center">Serve Mock</h1>
<div align="center">
A middleware for serving mock files
<br /><br />

![npm](https://img.shields.io/npm/v/serve-mock?style=flat-square)
![node](https://img.shields.io/node/v/serve-mock?style=flat-square)
![coverage](https://img.shields.io/codecov/c/github/kaysonwu/serve-mock/master?style=flat-square)
![downloads](https://img.shields.io/npm/dy/serve-mock?style=flat-square)
![license](https://img.shields.io/npm/l/serve-mock?style=flat-square)
[![build status](https://travis-ci.com/kaysonwu/serve-mock.svg?branch=master)](https://travis-ci.com/kaysonwu/serve-mock?style=flat-square)
<br /><br />
English | [中文](README-zh_CN.md) 
</div>

- [Installation](#installation)
- [Usage](#usage)
  - [webpack-dev-server](#webpack-dev-server)
  - [Handler](#handler)
- [Utils](#utils)
  - [Sleep](#sleep)
  - [Delay](#delay)
  - [Resource](#resource)
    - [Resource Options](#resource-options)
    - [Partial Resource](#partial-resource)
    - [Custom Pagination](#custom-pagination)
    - [Custom Validator](#custom-validator)
- [Typescript](#typescript)

## Installation

```
yarn add -D serve-mock
```

or

```
npm install -D serve-mock
```

## Usage

It is an http middleware, so you can use it in any http service:

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

### Handler

`Serve mock` provide response handlers in two states, namely `errorHandler` and `successHandler`, which can meet customization requirements by modifying the response handlers.

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

### Sleep

Use `sleep` to delay in the process:

```js
const { sleep, rand } = require('serve-mock');

module.exports = {
  'GET /api/currentUser': async (req, res) => {
    await sleep(rand(1000, 2000));

    // do thing.
  },
};
```

### Delay

Sometimes we need to simulate network delay：

```js
const { delay } = require('serve-mock');

module.exports = {
  'GET /api/currentUser': delay({ id: 1, name: 'kayson' }, 1000),
};
```

Use `delay` to delay a single object, if you want to delay all objects, use `delays`:

```js
const { Mock, delays } = require('serve-mock');

const mock: Mock = {
  'GET /api/currentUser': { id: 1, name: 'kayson' },
  'GET /api/users': [{ id: 1, name: 'zhangsan', id: 2, name: 'lisi' }],
};

module.exports = delays(mock, 100, 1000);
```

### Resource

`resource` provides a convenient way to define a set of API to simulate resources.

```typescript
function resource<T extends Record<string, unknown> = Record<string, unknown>>(name: string, options: ResourceOptions<T> = {}): Mock
```

#### Resource Options

```typescript
type ResourceOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** The key of data row. */
  rowKey?: string;
  /** Initialization data. */
  initialData?: T[];
  /** Mock only given resource API */
  only?: ResourceAction[];
  /** Mock API except for a given resource */
  except?: ResourceAction[];
  /** Custom data validation when creating and updating, only valid for create,update and delete resource APIs */
  validator?(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T;
  validator?(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  /** Custom query result pagination, only valid for index resource API */
  pagination?(data: T[], query: ParsedUrlQuery): WithPagination<T>;
  /** Custom query result filter, only valid for index resource API */
  filter?(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[];
  /** Process the data before response.  */
  normalize(data: T | T [], type: ResourceAction): T | T[] | void;
}
```

One line of code to mock RESTful style API:

```js
const { resource } = require('server-mock');

module.exports = resource('/api/users');
```

The above code is equivalent to:

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

#### Partial Resource

When declaring a resource API, you can specify some of the simulated behavior instead of all the default behavior:

```js
const { resource } = require('server-mock');

module.exports = resource('/api/users', { only: ['index', 'show'] });

// OR

module.exports = resource('/api/users', { except: ['create', 'update', 'delete'] });
```

#### Custom Pagination

For request that require data pagination, if the default pagination cannot meet the needs, you can choose to customize:

```js
const { resource, ResourceOptions } = require('server-mock');

const pagination: ResourceOptions['pagination'] = (data, query) => {
  // Start your pagination logic here.
};

module.exports = resource('/api/users', { pagination });
```

#### Custom Validator

In order to more realistically simulate the back-end API, we can also verify the request data and selectively report errors to the request:

```js
const { resource, ResourceOptions, UnprocessableEntityHttpError } = require('server-mock');

const validator: ResourceOptions['validator'] = (data, req, records, type) => {
  if (data.name === 'admin') {
    throw new UnprocessableEntityHttpError({ message: 'Admin already exists' });
  }

  return data;
};

module.exports = resource('/api/users', { validator });
```

#### Custom Responder

If you are not satisfied with some api response, you can customize it:

```js
const { resource, ResourceOptions } = require('server-mock');

const responder: ResourceOptions['responder'] = (req, res, data, type) => {
  // Start your response logic here.
};

module.exports = resource('/api/users', { responder });
```

## Typescript

If your mock file needs to use typescript syntax, you can use [@babel/register](https://babeljs.io/docs/en/next/babel-register.html) to provide compilation services：

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
