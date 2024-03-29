var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    redis =         require('redis'),
    sprintf =       require('sprintf-js').sprintf;

/**
 * Redis service
 *
 * Author:    Phong Mai
 * Timestamp: 6/12/13 5:10 PM
 */
var Redis = function() {
    BaseService.call(this, 'Redis');
    this.service = null;
};

util.inherits(Redis, BaseService);

/**
 * Initialise the redis service
 *
 * @param {Object} options The options for the service
 * @returns {Q.promise}
 */
Redis.prototype.initialize = function(options, Logger) {
    options = options || {};

    _.defaults(options, {
        host:   'localhost',
        port:   6379
    });

    var defer = q.defer();

    this.service = redis.createClient(options.port, options.host);

    this.service.on('ready', _.bind(function() {
        this.info(Logger, sprintf('%s ready', Logger.formatString(options.serviceId)));
        defer.resolve();
    }, this));

    this.service.on('error', _.bind(function(err) {
        this.error(Logger, err);
        defer.reject(err);
    }, this));

    return defer.promise;
};

module.exports = Redis;
