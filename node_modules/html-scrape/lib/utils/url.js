'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Grabs URL, and returns body.
 * @param  {string}   host     URL of body we are grabbing.
 * @param  {Function} callback Returns data and error.
 */
var url = function url(host, callback) {

  // Use request to grab the host's body.
  (0, _request2.default)(host, function (error, response, body) {

    // If error, or statusCode is off
    if (error || response.statusCode !== 200) {
      callback(error);
    }

    callback(false, body);
  });
};

exports.default = url;