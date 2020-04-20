"use strict";
exports.__esModule = true;
function default_1(value, req, res) {
    if (typeof value === 'function') {
        return value(req, res);
    }
    if (Array.isArray(value) || typeof value === 'object') {
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        res.write(JSON.stringify(value));
    }
    else {
        res.write(value);
    }
    res.end();
}
exports["default"] = default_1;
;
