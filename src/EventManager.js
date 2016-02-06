"use strict";
let EventEmitter = require('events');
let Transport = require('./connection').Transport;

class EventManager extends EventEmitter {

  constructor() {
    super();
    this.handlers = [];
    this.activeHandlers = [];
    this.dispatcher = new Transport();
    this.dispatcher.on('close', this.emit);
    this.dispatcher.on('error', this.emit);
    this.dispatcher.on('blocked', this.emit);
    this.dispatcher.on('unblocked', this.emit);
    this.dispatcher.on('message', this.emit);
    this.dispatcher.on('ready', this.registerHandlers.bind(this));
  }

  setHandlers(handlers) {
    this.handlers = handlers;
  }

  registerHandlers() {
    // register handlers and wait for events
    Object.keys(this.handlers).forEach((key) => {
      let Handler = this.handlers[key];
      let handler = new Handler(this.dispatcher);
      handler.register();
      this.activeHandlers.push(handler);
    });
    this.emit('ready');
  }

  connect(service) {
    // connect to the event emmitter service
    this.dispatcher.connect(service.ServiceAddress, service.ServicePort);
  }

}

module.exports = EventManager;
