"use strict";
let EventEmitter = require('events');

/**
 * Base event handler
 */
class BaseHandler extends EventEmitter {
  /**
   * Constructor
   */
  constructor(dispatcher) {
    super();
    this.dispatcher = dispatcher;
    dispatcher.on('message', (event, ack) => {
      this.emit(event.event, event, ack);
      this.emit('#', event, ack);
    });
    this.registerListeners();
  }

  /**
   * Register to given events
   * @param {array} events
   */
  register(events) {
    events = events ? events : this.getHandledEvents();
    for (let i = 0; i < events.length; i++) {
      this.dispatcher.bindTo(events[i]);
    }
  }

  /**
   * Trigger a new event on the network
   */
  trigger(event) {
    this.dispatcher.trigger(event);
  }

  /**
   * Register any event listeners for this handler
   */
  registerListeners() {

  }

  /**
   * Get all handled events for this handler
   */
  getHandledEvents() {
    return [];
  }
}

module.exports = BaseHandler;
