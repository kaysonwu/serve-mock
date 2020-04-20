"use strict";
exports.__esModule = true;
var path_1 = require("path");
var fs_1 = require("fs");
var url_1 = require("url");
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
function getMockValue(mock, method, pathname) {
    var key = [method.toUpperCase(), method.toLowerCase()]
        .map(function (m) { return m + ' ' + pathname; })
        .find(function (m) { return (mock[m] !== undefined); });
    if (key) {
        return mock[key];
    }
    var pattern = new RegExp("^([a-z]+/)*" + method + "(/[a-z]+)*\\s*" + pathname + "\\s*$", 'i');
    for (var k in mock) {
        if (pattern.test(k))
            return mock[k];
    }
    return false;
}
function createServe(root, options) {
    var opts = Object.assign({ extensions: ['.js', '.ts'], cache: true }, options);
    return function (req, res, next) {
        var pathname = url_1.parse(req.url).pathname;
        var mock = requireMockFile(pathname, root, opts);
        var value = mock && getMockValue(mock, req.method, pathname);
        if (value) {
            return dispatch_1["default"](value, req, res);
        }
        next();
    };
}
exports.createServe = createServe;
