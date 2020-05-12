"use strict";
exports.__esModule = true;
var path_1 = require("path");
var fs_1 = require("fs");
var url_1 = require("url");
var path_to_regexp_1 = require("path-to-regexp");
var dispatch_1 = require("./dispatch");
function resolveMockFile(pathname, root, extensions) {
    var paths = pathname.split('/');
    for (var i = paths.length; i-- > 0;) {
        for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
            var extension = extensions_1[_i];
            var filename = path_1.join(root, paths[i] + extension);
            if (fs_1.existsSync(filename)) {
                return filename;
            }
        }
    }
    return false;
}
function requireMockFile(pathname, root, options) {
    var filename = resolveMockFile(pathname, root, options.extensions);
    if (!filename)
        return false;
    var mock = require(filename);
    if (!options.cache) {
        delete require.cache[require.resolve(filename)];
    }
    if (mock && mock.__esModule) {
        return mock["default"];
    }
    return mock;
}
function findMockValueFromKey(mock, key) {
    var keys = [key, key.toLocaleLowerCase()];
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var k = keys_1[_i];
        if (mock[k] !== undefined) {
            return mock[k];
        }
    }
    return false;
}
function findMockValue(mock, method, pathname) {
    var space = /\s+/g;
    var pattern = new RegExp("(^|/)" + method + "(/|$)", 'i');
    for (var key in mock) {
        var _a = key.split(space, 2), m = _a[0], path = _a[1];
        if (pattern.test(m)
            && path_to_regexp_1.pathToRegexp(path).test(pathname)) {
            return mock[key];
        }
    }
    return false;
}
function createServe(root, options) {
    var opts = Object.assign({ extensions: ['.js', '.ts'], cache: true }, options);
    return function (req, res, next) {
        var pathname = url_1.parse(req.url).pathname;
        var mock = requireMockFile(pathname, root, opts);
        if (!mock) {
            return next();
        }
        var method = req.method;
        var value = findMockValueFromKey(mock, (method + ' ' + pathname)) || findMockValue(mock, method, pathname);
        if (value) {
            return dispatch_1["default"](value, req, res);
        }
        next();
    };
}
exports.createServe = createServe;
