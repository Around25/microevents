"use strict";

let amqplib = require('amqplib');
const TRANSPORT_EXCHANGE = process.env.TRANSPORT_EXCHANGE || 'event';
const TRANSPORT_QUEUE = process.env.TRANSPORT_QUEUE || '';

class Transport {

  constructor(options) {
    this.options = options || {noAck: false};
    this.connection = null;
    this.channel = null;
    this.exchange = TRANSPORT_EXCHANGE;
    this.queue = TRANSPORT_QUEUE;
  }

  connect(host, port, callback) {
    port = port || 5672;
    let open = amqplib.connect('amqp://'+ host + ':' + port +'//');
    return open.then((conn) => {
        this.connection = conn;
        return conn.createChannel()
          .then((channel) => {
            this.channel = channel;
            this.channel.prefetch(1);
            this.initChannel(callback);
          }, console.error);
      }, console.error);
  }

  getExchange() {
    let promise = this.channel.assertExchange(this.exchange, 'topic', {durable: true});
    promise.then(null, console.error);
    return promise;
  }

  onMessage(callback, msg) {
    if (!this.options.noAck) {
      this.channel.ack(msg);
    }
    let event = JSON.parse(msg.content.toString());
    callback(event, this.ack.bind(this));
  }

  ack(msg) {
    this.channel.ack(msg);
  }

  reject(msg) {
    this.channel.ack(msg);
  }

  initChannel(callback) {
    return this.getExchange().then(() => {
      return this.channel.assertQueue(this.queue, {durable: true}).then((queue) => {
        callback();
      });
    });
  }

  on(name, callback) {
    console.log(' [*] Listening for ', name, ' events.');
    this.channel.bindQueue(this.queue, this.exchange, name);
    this.channel.consume(this.queue, this.onMessage.bind(this, callback), {noAck: false});
  }

  trigger(event) {
    this.getExchange().then(() => {
      this.channel.publish(this.exchange, event.event, new Buffer(JSON.stringify(event)), { persistent: true });
    });
  }
}

module.exports = Transport;
