"use strict";

let consul = null;

function init(host, port) {
  consul = require("consul")({
    host: host || process.env.CONSUL_PORT_8500_TCP_ADDR,
    post: port || process.env.CONSUL_PORT_8500_TCP_POST,
    promisify: true,
  });
}

function _processResponse(callback, services) {
  if (!services.length){
    console.error('service not found', services);
    return;
  }
  callback(services[0]);
}

function notify(name, callback) {
  consul.catalog.service.list().then((serviceList) => {
    if (serviceList[name]) {
      consul.catalog.service.nodes(name)
        .then((data, res) => {
          _processResponse(callback, data);
        }, console.error);
    } else {
      console.error("Waiting for service to come online: ", name);
      let watch = consul.watch({
        method: consul.catalog.service.nodes,
        options: {service: name}
      });
      watch.on('change', (data, res) => {
        console.log(data, res);
        _processResponse(callback, data);
      });

      watch.on('error', (err) => {
        console.log('error:', err);
      });

      setTimeout(() => {
        console.error("Service lookup timed out: ", name);
        watch.end();
      }, 30 * 1000);
    }
  }, console.error);
}

module.exports = {
  init: init,
  notify: notify,
};
