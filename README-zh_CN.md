<h1 align="center">Serve Mock</h1>
<div align="center">
用于提供 Mock 文件的中间件
<br /><br />

![npm](https://img.shields.io/npm/v/serve-mock)
![Node](https://img.shields.io/node/v/serve-mock)
![Downloads](https://img.shields.io/npm/dy/serve-mock)
![License](https://img.shields.io/npm/l/serve-mock)
[![Build Status](https://travis-ci.com/kaysonwu/serve-mock.svg?branch=master)](https://travis-ci.com/kaysonwu/serve-mock)
<br /><br />
[English](README.md) | 中文 
</div>

- [安装](#安装)
- [使用](#使用)
  - [webpack-dev-server](#webpack-dev-server)
  - [Utils](#utils)
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

有时我们需要模拟网络延迟：

```js
const { delay } = require('serve-mock/utils');

module.exports = {
  'GET /api/currentUser': delay({ id: 1, name: 'kayson' }, 1000),
};
```

使用 `delay` 延迟单个对象，如果要延迟所有对象，请使用 `delays`：

```js
const { delays } = require('serve-mock/utils');

const proxies = {
  'GET /api/currentUser': { id: 1, name: 'kayson' },
  'GET /api/users': [{ id: 1, name: 'zhangsan', id: 2, name: 'lisi' }],
};

module.exports = delays(proxies, 100, 1000)
```

### Typescript

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
