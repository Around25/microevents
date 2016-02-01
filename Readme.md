MicroEvents
===========

MicroEvents is a simple framework for creating production ready microservices
using RabbitMQ and Consul.

It allows you to define events and event handlers and focus only on the business
logic of your service without worrying on how the events travel to other services
or how to scale your application.

You also have the possibility to search for other services (like the AMQP server)
by connecting to a consul server and reacting to changes in the service list.

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

const MQ_SERVICE_NAME = process.env.MQ_SERVICE_NAME;
let consul = require('microevents').consul;
let EventManager = require('microevents').EventManager;
let eventHandlers = require('./event-handlers');

// init consul
consul.init();

// wait for queue service to start
consul.notify(MQ_SERVICE_NAME, function (service) {
  let eventManager = new EventManager();
  eventManager.setHandlers(eventHandlers);

  // connect to the queue service and register all events handlers
  eventManager.connect(service, () => {

    // send some test events
    this.dispatcher.trigger({event: 'auth.login', username: 'john', 'pass': 'secret'});
    this.dispatcher.trigger({event: 'auth.login', username: 'jane', 'pass': 'doe'});
  });
});
```

In order to listen for events create some handles like this:

```js
let BaseHandler = require('microevents').BaseHandler;
class AuthLoginHandler extends BaseHandler{
  handle(event) {
    console.log("Login event received:", event);
  }

  getHandledEvents() {
    return ['auth.login'];
  }
}

module.exports = AuthLoginHandler;
```

License
=======
See LICENSE file.
