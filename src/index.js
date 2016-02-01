"use strict";
let connection = require('./connection');
module.exports = {
  consul: connection.consul,
  Transport: connection.Transport,
  EventManager: require('./EventManager');
  BaseHandler: require('./handler/BaseHandler');
}
