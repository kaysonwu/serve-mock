"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var url_1 = require("url");
var querystring_1 = require("querystring");
var dispatch_1 = require("./dispatch");
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function delay(value, min, max) {
    var ms = ((max && max > min) ? rand(min, max) : min);
    return function (req, res) {
        setTimeout(function () {
            dispatch_1["default"](value, req, res);
        }, ms);
    };
}
exports.delay = delay;
function delays(mock, min, max) {
    var results = {};
    for (var key in mock) {
        results[key] = delay(mock[key], min, max);
    }
    return results;
}
exports.delays = delays;
function parseRequestData(data, type) {
    if (type.includes('json')) {
        return JSON.parse(data);
    }
    return querystring_1.parse(data);
}
function readyRequestData(req, callback, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    var data = '';
    req.setEncoding(encoding);
    req.on('data', function (chunk) { return data += chunk; });
    req.on('end', function () {
        callback(parseRequestData(data, ("" + req.headers['content-type']).toLowerCase()));
    });
}
exports.readyRequestData = readyRequestData;
function getResourceActions(options) {
    if (options.only) {
        return options.only;
    }
    var except = options.except;
    var actions = ['index', 'create', 'show', 'update', 'delete'];
    if (except) {
        return actions.filter(function (action) { return !except.includes(action); });
    }
    return actions;
}
function defaultPagination(records, query) {
    var page = query.page;
    if (!page) {
        return records;
    }
    var current = Math.max(1, page);
    var pageSize = Math.max(1, (query.pageSize || query.page_size || 15));
    var start = (current - 1) * pageSize;
    var end = start + pageSize;
    return {
        data: records.slice(start, end),
        pagination: {
            current: current,
            pageSize: pageSize,
            total: records.length
        }
    };
}
function defaultFilter(records, query, req) {
    var data = records.filter(function (record) {
        for (var key in query) {
            if (Object.prototype.hasOwnProperty.call(record, key)
                && query[key] !== record[key]) {
                return false;
            }
        }
        return true;
    });
    return data;
}
function defaultValidator(data) {
    return data;
}
function defaultResponder(_, res, data) {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.write(JSON.stringify(data));
    res.end();
}
exports.defaultResponder = defaultResponder;
function getIdFromPath(url) {
    return url_1.parse(url).pathname.split('/').pop();
}
function getIdsFromPath(url) {
    var id = decodeURIComponent(getIdFromPath(url));
    if (id.includes(',')) {
        return id.split(',');
    }
    return [id];
}
function resource(name, initialRecords, options) {
    if (initialRecords === void 0) { initialRecords = []; }
    if (options === void 0) { options = {}; }
    var uri = '/' + name.replace(/^\/|\/$/g, '');
    var actions = getResourceActions(options);
    var echo = options.echo, _a = options.filter, filter = _a === void 0 ? defaultFilter : _a, _b = options.pagination, pagination = _b === void 0 ? defaultPagination : _b, _c = options.validator, validator = _c === void 0 ? defaultValidator : _c, _d = options.responder, responder = _d === void 0 ? defaultResponder : _d;
    var mock = {};
    var records = initialRecords;
    if (actions.includes('create')) {
        mock["POST " + uri] = function (req, res) {
            readyRequestData(req, function (data) {
                var record = validator(data, req, res);
                if (record === false) {
                    return res.end();
                }
                if (!record.id) {
                    record.id = records.reduce(function (id, c) { return (id > c.id ? id : c.id + 1); }, records.length + 1);
                }
                records.push(record);
                res.statusCode = 201;
                if (echo) {
                    return responder(req, res, record, 'create');
                }
                res.end();
            });
        };
    }
    if (actions.includes('update')) {
        mock["PUT " + uri + "/:id"] = function (req, res) {
            var id = getIdFromPath(req.url);
            var index = records.findIndex(function (d) { return String(d.id) === id; });
            if (index === -1) {
                res.statusCode = 404;
                return res.end();
            }
            readyRequestData(req, function (data) {
                var record = validator(data, req, res);
                if (record === false) {
                    return res.end();
                }
                records[index] = __assign(__assign({}, records[index]), record);
                res.statusCode = 201;
                if (echo) {
                    return responder(req, res, records[index], 'update');
                }
                res.end();
            });
        };
    }
    if (actions.includes('index')) {
        mock["GET " + uri] = function (req, res) {
            var query = url_1.parse(req.url, true).query;
            var data = pagination(filter(records, query, req), query);
            res.statusCode = 200;
            responder(req, res, data, 'index');
        };
    }
    if (actions.includes('show')) {
        mock["GET " + name + "/:id"] = function (req, res) {
            var id = getIdFromPath(req.url);
            var record = records.find(function (d) { return String(d.id) === id; });
            if (!record) {
                res.statusCode = 404;
                return res.end();
            }
            res.statusCode = 200;
            responder(req, res, record, 'show');
        };
    }
    if (actions.includes('delete')) {
        mock["DELETE " + uri + "/:id"] = function (req, res) {
            var ids = getIdsFromPath(req.url);
            records = records.filter(function (record) { return !ids.includes(String(record.id)); });
            res.statusCode = 204;
            res.end();
        };
    }
    return mock;
}
exports.resource = resource;
