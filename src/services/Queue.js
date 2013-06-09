var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    kue =           require('kue'),
    redis =         require('redis');
/**
 * Kue based queue
 *
 * Author:    Phong Mai
 * Timestamp: 6/9/13 2:30 PM
 */
var Queue = function() {
    BaseService.call(this, 'Queue');
};

util.inherits(Queue, BaseService);

Queue.initialize = function(options, Logger) {
    options = options || {};
    _.defaults(options, {
        port: 6389,
        host: '127.0.0.1'
    });

    kue.redis.createConnection = function() {
        var client = redis.createClient(options.port, options.host);
        return client;
    }
};
