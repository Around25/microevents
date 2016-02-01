"use strict";
let Transport = require('./connection').Transport;

class EventManager {

  constructor() {
    this.dispatcher = new Transport();
    this.handlers = [];
    this.activeHandlers = [];
  }

  setHandlers(handlers) {
    this.handlers = handlers;
  }

  connect(service, callback) {
    // connect to the event emmitter service
    this.dispatcher.connect(service.ServiceAddress, service.ServicePort, () => {
      // register handlers and wait for events
      Object.keys(this.handlers).forEach((key) => {
        let Handler = this.handlers[key];
        let handler = new Handler(this.dispatcher);
        handler.register();
        this.activeHandlers.push(handler);
      });

      if (callback) {
        callback();
      }
    });
  }

}

module.exports = EventManager;
