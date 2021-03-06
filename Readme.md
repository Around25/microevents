MicroEvents
===========

MicroEvents is a simple framework for creating production ready microservices
using RabbitMQ.

It allows you to define events and event handlers and focus only on the business
logic of your service without worrying on how the events travel to other services
or how to scale your application.

You also have the possibility to search for other services (like the AMQP server)
by connecting to a Consul server and reacting to changes in the service list.

Install
=======
```
npm install microevents --save
```

Example
=======

Example micro service:

```js
"use strict";

let EventManager = require('microevents').EventManager;
let eventHandlers = require('./event-handlers');

let eventManager = new EventManager();
eventManager.setHandlers(eventHandlers);
eventManager.once('ready', () => {
  // send some test events
  eventManager.dispatcher.trigger({event: 'auth.register', username: 'john', 'pass': 'secret'});
  eventManager.dispatcher.trigger({event: 'auth.register', username: 'jane', 'pass': 'doe'});
});

// connect to the queue service and register all events handlers
eventManager.connect({ServiceAddress: 'localhost', ServicePort: 5672});
```

In order to listen for events create some handlers like this:

```js
let BaseHandler = require('microevents').BaseHandler;
class AuthRegisterHandler extends BaseHandler{
  registerListeners() {
    console.log('registering handle methods');
    this.on('auth.register', this.onAuthRegister.bind(this));
  }

  onAuthRegister(event) {
    console.log('register', event);
    // generate a unique id
    let requestId = event.username;
    // wait to process the reply for the next triggered event
    this.once('entity.saved.' + requestId, (replyEvent) => {
      console.log('entity saved', replyEvent);
    });
    // save the user by calling another event handler
    // use trigger to send through the AMQP server
    // the handler will trigger another event with 'entity.saved.' + event.requestId
    this.trigger({
      event: 'entity.save',
      replyId: requestId,
    });
  }

  getHandledEvents() {
    return ['auth.register', 'entity.saved.*'];
  }
}

module.exports = AuthRegisterHandler;
```

License
=======
See LICENSE file.
