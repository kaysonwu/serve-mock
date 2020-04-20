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

### Utils

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

### Typescript

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
