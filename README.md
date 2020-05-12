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
const http = require('http')
const { createServe } = require('serve-mock');

const mock = createServe('mocks');
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
const { delay } = require('serve-mock/utils');

module.exports = {
  'GET /api/currentUser': delay({ id: 1, name: 'kayson' }, 1000),
};
```

Use `delay` to delay a single object, if you want to delay all objects, use `delays`:

```js
const { delays } = require('serve-mock/utils');

const proxies = {
  'GET /api/currentUser': { id: 1, name: 'kayson' },
  'GET /api/users': [{ id: 1, name: 'zhangsan', id: 2, name: 'lisi' }],
};

module.exports = delays(proxies, 100, 1000)
```

### Resource

`resource` provides a convenient way to define a set of API to simulate resources.

```typescript
function resource(name: string, initialRecords: any[] = [], options: ResourceOptions = {})
```

#### Resource Options

```typescript
type ResourceOptions = {
  echo?: boolean;   // Echo data after creation and update
  only?: ResourceAction[]; // Mock only given resource API
  except?: ResourceAction[]; // Mock API except for a given resource
  filter?: (records: any[], query: ParsedUrlQuery, req: IncomingMessage) => any; // Custom query result filter
  pagination?: (records: any[], query: ParsedUrlQuery) => any; // Custom query result pagination
  validator?: (data: any, req: IncomingMessage, res: ServerResponse) => any; // Custom data validation when creating and updating
  responder?: (req: IncomingMessage, res: ServerResponse, data: any, type: ResourceAction) => void; // Data response
}
```

One line of code to mock RESTful style API:

```js
const { resource } = require('server-mock/utils');

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
const { resource } = require('server-mock/utils');

module.exports = resource('/api/users', [], { only: ['index', 'show'] });

// OR

module.exports = resource('/api/users', [], { except: ['create', 'update', 'delete'] });
```

#### Custom Pagination

For request that require data pagination, if the default pagination cannot meet the needs, you can choose to customize:

```js
const { resource } = require('server-mock/utils');

function pagination(records, query) {
  // Start your pagination logic here.
}

module.exports = resource('/api/users', [], { pagination });
```

#### Custom Validator

In order to more realistically simulate the back-end API, we can also verify the request data and selectively report errors to the request:

```js
const { resource } = require('server-mock/utils');

function validator(data: any, req: IncomingMessage, res: ServerResponse) {
  if (data.name === 'admin') {
    res.statusCode = 422;
    res.write('Admin already exists');
    return false;
  }

  return data;
}

module.exports = resource('/api/users', [], { validator });
```

#### Custom Responder

If you are not satisfied with some api response, you can customize it:

```js
const { resource, defaultResponder } = require('server-mock/utils');

function responder(req, res, data, type) {
  if (type !== 'index') {
    return defaultResponder(req, res, data, type);
  } 

  // Start your response logic here.
}

module.exports = resource('/api/users', [], { responder });
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
