"use strict";
let EventEmitter = require('events');
let Transport = require('./connection').Transport;

class EventManager extends EventEmitter {

  constructor() {
    super();
    this.handlers = [];
    this.activeHandlers = [];
    this.dispatcher = new Transport();
    this.dispatcher.on('close', this.notify.bind(this, 'close'));
    this.dispatcher.on('error', this.notify.bind(this, 'error'));
    this.dispatcher.on('blocked', this.notify.bind(this, 'blocked'));
    this.dispatcher.on('unblocked', this.notify.bind(this, 'unblocked'));
    this.dispatcher.on('message', this.notify.bind(this, 'message'));
    this.dispatcher.on('ready', this.registerHandlers.bind(this));
  }

  notify(event, data) {
    this.emit(event, data);
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
