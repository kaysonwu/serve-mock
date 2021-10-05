<h1 align="center">Serve Mock</h1>
<div align="center">
A middleware for serving mock files
<br /><br />

![npm](https://img.shields.io/npm/v/serve-mock)
![Node](https://img.shields.io/node/v/serve-mock)
![Downloads](https://img.shields.io/npm/dy/serve-mock)
![License](https://img.shields.io/npm/l/serve-mock)
[![Build Status](https://travis-ci.com/kaysonwu/serve-mock.svg?branch=master)](https://travis-ci.com/kaysonwu/serve-mock)
<br /><br />
English | [中文](README-zh_CN.md) 
</div>

- [Installation](#installation)
- [Usage](#usage)
  - [webpack-dev-server](#webpack-dev-server)
- [Utils](#utils)
  - [Delay](#delay)
  - [Resource](#resource)
    - [Resource Options](#resource-options)
    - [Partial Resource](#partial-resource)
    - [Custom Pagination](#custom-pagination)
    - [Custom Validator](#custom-validator)
    - [Custom Responder](#custom-responder)
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

## Utils

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
  rowKey?: string; // Key of data row
  initialData?: T[]; // Initialization data
  only?: ResourceAction[]; // Mock only given resource API
  except?: ResourceAction[]; // Mock API except for a given resource
  validator?(data: T, req: IncomingMessage, records: T[], type: 'create' | 'update'): T; // Custom data validation when creating and updating
  validator?(data: string[], req: IncomingMessage, records: T[], type: 'delete'): void;
  pagination?(data: T[], query: ParsedUrlQuery): WithPagination<T>; // Custom query result pagination
  filter?(data: T[], query: ParsedUrlQuery, req: IncomingMessage): T[]; // Custom query result filter
  responder?(req: IncomingMessage, res: ServerResponse, data: T | T[], type: ResourceAction): void; // Data response
  errorHandler?(req: IncomingMessage, res: ServerResponse, error: Error): void; // Custom error handler
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
