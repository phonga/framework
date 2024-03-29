var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    amqp =          require('amqplib'),
    sprintf =       require('sprintf-js').sprintf;

/**
 * AMQP Service
 *
 * Author:    Phong Mai
 * Timestamp: 10/6/13 11:18 AM
 */
var AMQP = function() {
    BaseService.call(this, 'AMQP');
    this.service = null;
    this.exchanges = {};
};

util.inherits(AMQP, BaseService);
/**
 * Initialize the amqp
 *
 * @param options
 * @returns {Q.promise}
 */
AMQP.prototype.initialize = function(options, Logger) {
    options = options || {};

    _.defaults(options, {
        login:      'guest',
        password:   'guest',
        host:       'localhost',
        port:       5672
    });

    var defer = q.defer();

    var self = this;
    amqp.connect('amqp://' + options.host)
        .then(function(connection) {
            return connection.createChannel();
        })
        .then(function(channel) {
            self.service = channel;
            self._initializeExchanges(options.exchanges, Logger)
                .then(function() {
                    self.info(Logger, Logger.formatString(options.serviceId) + ' ready');
                    defer.resolve();
                });
        });

    return defer.promise;
};
/**
 * Create a queue
 *
 * @param {String} name - the name for the queue
 * @returns {Q.promise}
 */
AMQP.prototype.queue = function(name) {
    var defer = q.defer();

    this.service.assertQueue(name)
        .then(function(queue) {
            defer.resolve(queue);
        });

    return defer.promise;
};
/**
 * Create the exchange
 *
 * @param {String} name - the name for the exchange
 * @returns {Q.promise}
 */
AMQP.prototype.exchange = function(name) {
    var defer = q.defer();

    this.service.assertExchange(name, 'topic')
        .then(function(exchange) {
            defer.resolve(exchange);
        });

    return defer.promise;
};
/**
 * Create an exchange object
 *
 * @param {Exchange} exchange - the exchange object
 * @returns {{publish: Function}}
 * @private
 */
AMQP.prototype._exchangeFactory = function(exchange) {
    var self = this;
    return {
        exchange: exchange,
        /**
         * Publish to the exchange
         *
         * @param {String} routingKey - the routing key
         * @param {Mixed} message - the message package
         * @param {Object} options - the options for the publish
         * @returns {Q.promise}
         */
        publish: function(routingKey, message, options) {
            var defer = q.defer();

            if (self.service.publish(exchange, routingKey, new Buffer(message), options)) {
                defer.resolve();
            } else {
                defer.reject();
            }

            return defer.promise;
        }
    }
};
/**
 * Initialize the exchanges
 *
 * @param {Array} exchanges - exchange definitions
 * @param {Logger} Logger - logger service
 * @returns {*}
 * @private
 */
AMQP.prototype._initializeExchanges = function(exchanges, Logger) {
    var defers = [];

    var self = this;
    _.each(exchanges, function(option) {
        var defer = q.defer();
        defers.push(defer.promise);

        self.exchange(option.name)
            .then(function() {
                self.info(Logger, '/' + option.name);
                return self._initializeBinds(option.name, option.binds, Logger);
            })
            .then(function() {
                self.exchanges[option.name] = self._exchangeFactory(option.name);
                Context.set(option.name, self.exchanges[option.name]);
                defer.resolve();
            });
    });

    return q.all(defers);
};
/**
 * Initialize the exchange binds
 *
 * @param {Exchange} exchange - the exchange to bind to
 * @param {Object} binds - the bind definition
 * @param {Logger} Logger - logger service
 * @returns {*}
 * @private
 */
AMQP.prototype._initializeBinds = function(exchange, binds, Logger) {
    var defers = [];

    var self = this;
    _.each(binds, function(bind) {
        var defer = q.defer();

        self.queue(bind.queue)
            .then(function(queue) {
                self.service.bindQueue(queue.queue, exchange, bind.route)
                    .then(function() {
                        Context.set(bind.queue, {
                            subscribe: function(callback) {
                                self.service.consume(bind.queue, callback, {noAck: true});
                            },

                            ack: function(message) {
                                self.service.ack(message);
                            }
                        });

                        self.info(Logger, sprintf('/%s/%s/%s', exchange, bind.route, bind.queue));
                        defer.resolve();
                    });

            });

        defers.push(defer.promise);
    });

    return q.all(defers);
};

module.exports = AMQP;