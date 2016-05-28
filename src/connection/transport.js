"use strict";

let amqplib = require('amqplib');
let EventEmitter = require('events');
const TRANSPORT_EXCHANGE = process.env.TRANSPORT_EXCHANGE || 'event';
const TRANSPORT_QUEUE = process.env.TRANSPORT_QUEUE || '';

class Transport extends EventEmitter {

  constructor(options) {
    super();
    this.options = options || {noAck: false, heartbeat: 2};
    this.connection = null;
    this.channel = null;
    this.exchange = TRANSPORT_EXCHANGE;
    this.queue = TRANSPORT_QUEUE;
    this._onError = this.notify.bind(this, 'error');
    this._ack = this.ack.bind(this);
  }

  notify(event, data){
    this.emit(event, data);
  }

  connect(host, port) {
    port = port || 5672;
    // connect to the AMQP server
    let open = amqplib.connect('amqp://'+ host + ':' + port +'//?heartbeat=' + this.options.heartbeat);
    // wait for the connection to be established
    return open.then((conn) => {
        this.connection = conn;
        // listen for events from the server
        conn.on('error', this._onError);
        conn.on('close', this.notify.bind(this, 'close'));
        conn.on('blocked', this.notify.bind(this, 'blocked'));
        conn.on('unblocked', this.notify.bind(this, 'unblocked'));
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
    let ack = this._ack.bind(this, msg);
    // emit a message event and a unique event
    this.emit('message', event, ack);
    if (event.event !== 'message') {
      this.emit(event.event, event, ack);
    }
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
   * Unbind the queue from an event type
   */
  unbindFrom(name) {
    this.channel.unbindQueue(this.queue, this.exchange, name);
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
