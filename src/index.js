"use strict";
exports.__esModule = true;
var path_1 = require("path");
var fs_1 = require("fs");
var url_1 = require("url");
var dispatch_1 = require("./dispatch");
function resolveMockFile(pathname, root, extensions) {
    var paths = pathname.split('/');
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var path = paths_1[_i];
        for (var _a = 0, extensions_1 = extensions; _a < extensions_1.length; _a++) {
            var extension = extensions_1[_a];
            var filename = path_1.join(root, path + extension);
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
        // TODO
        console.log('requireFile', require.resolve(filename));
        //  delete require.cache[filename];
    }
    return mock;
}
function getMockValue(mock, method, pathname) {
    var key = [method, method.toLowerCase()]
        .map(function (m) { return m + ' ' + pathname; })
        .find(function (m) { return (typeof mock[m] !== undefined); });
    if (key) {
        return mock[key];
    }
    var pattren = new RegExp("^" + method + "\\s*" + pathname + "\\s*$", 'i');
    for (var k in mock) {
        if (pattren.test(k))
            return mock[k];
    }
    return false;
}
function serveMock(root, options) {
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
exports.serveMock = serveMock;
