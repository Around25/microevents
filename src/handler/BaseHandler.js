class BaseHandler {
  constructor(dispatcher) {
    this.dispatcher = dispatcher
  }

  register() {
    let events = this.getHandledEvents();
    for (let i=0; i<events.length; i++) {
      this.dispatcher.on(events[i], this.handle.bind(this));
    }
  }

  trigger(event) {
    this.dispatcher.trigger(event);
  }

  handle(event) {

  }

  getHandledEvents() {
    return [];
  }
}

module.exports = BaseHandler;
