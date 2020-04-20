"use strict";
exports.__esModule = true;
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
