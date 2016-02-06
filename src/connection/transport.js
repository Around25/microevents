"use strict";

let amqplib = require('amqplib');
let EventEmitter = require('events');
const TRANSPORT_EXCHANGE = process.env.TRANSPORT_EXCHANGE || 'event';
const TRANSPORT_QUEUE = process.env.TRANSPORT_QUEUE || '';

class Transport extends EventEmitter {

  constructor(options) {
    super();
    this.options = options || {noAck: false};
    this.connection = null;
    this.channel = null;
    this.exchange = TRANSPORT_EXCHANGE;
    this.queue = TRANSPORT_QUEUE;
    this._onError = this.emit.bind(this, 'error');
    this._ack = this.ack.bind(this);
  }

  connect(host, port) {
    port = port || 5672;
    // connect to the AMQP server
    let open = amqplib.connect('amqp://'+ host + ':' + port +'//');
    // wait for the connection to be established
    return open.then((conn) => {
        this.connection = conn;
        // listen for events from the server
        conn.on('error', this._onError);
        conn.on('close', this.emit.bind(this, 'close'));
        conn.on('blocked', this.emit.bind(this, 'blocked'));
        conn.on('unblocked', this.emit.bind(this, 'unblocked'));
        // create a communication channel
        return conn.createChannel()
          .then((channel) => {
            this.channel = channel;
            this.channel.prefetch(1);
            // create exchange and queue if not defined
            let promise = this.getExchange();
            promise.then(() => {
              return this.channel.assertQueue(this.queue, {durable: true}).then((queue) => {
                // start listening for messages
                this.channel.consume(this.queue, this.onMessage.bind(this), {noAck: false});
                // trigger the ready event
                this.emit('ready');
              }, this._onError);
            });
            return promise;
          }, this._onError);
      }, this._onError);
  }

  /**
   * @todo: Disconnect from the AMQP server
   */
  disconnect() {
    // remove all active listeners
    // this.removeAllListeners();
  }

  getExchange() {
    let promise = this.channel.assertExchange(this.exchange, 'topic', {durable: true});
    promise.then(null, this._onError);
    return promise;
  }

  /**
   * Handle all received messages
   */
  onMessage(msg) {
    // in case the consumer is closed by the AMQP server disconnect
    if (!msg) {
      return this.disconnect();
    }
    if (!this.options.noAck) {
      this.ack(msg);
    }
    let event = JSON.parse(msg.content.toString());
    this.emit('message', event, this._ack.bind(this, msg));
  }

  ack(msg) {
    this.channel.ack(msg);
  }

  reject(msg) {
    this.channel.ack(msg);
  }

  /**
   * Bind a new event type to the queue
   */
  bindTo(name) {
    this.channel.bindQueue(this.queue, this.exchange, name);
  }

  /**
   * Send an event to the AMQP server
   */
  trigger(event) {
    this.getExchange().then(() => {
      this.channel.publish(this.exchange, event.event, new Buffer(JSON.stringify(event)), { persistent: true });
    });
  }
}

module.exports = Transport;
