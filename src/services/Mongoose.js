var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    mongoose =      require('mongoose');
/**
 * Mongoose Service
 *
 * Author:    Phong Mai
 * Timestamp: 6/8/13 11:16 AM
 */
var Mongoose = function() {
    BaseService.call(this, 'Mongoose');
};

util.inherits(Mongoose, BaseService);

/**
 * Initialize the mongoose connection
 *
 * @param options
 * @returns {Q.promise}
 */
Mongoose.prototype.initialize = function(options, Logger) {
    var deferred = q.defer();

    options = options || {};
    _.defaults(options, {
        db:     '',
        port:   27017,
        host:   'localhost'
    });

    var db = mongoose.connection;

    db.on('open', function() {
        Logger.info('Mongoose - connected ' + options.host);
        deferred.resolve();
    });

    db.on('error', function(err) {
        Logger.error('Mongoose - ' + err.toString());
        deferred.reject(err);
    });

    mongoose.connect(options.host, options.db, options.port);

    return deferred.promise;
};

/**
 * Create a mongoose model object
 *
 * @param name
 * @param schema
 * @param methods
 * @param statics
 * @returns {*}
 */
Mongoose.prototype.createModel = function(name, schema, methods, statics) {
    var s = mongoose.Schema(schema);

    if (methods) {
        s.method(methods);
    }

    if (statics) {
        s.static(statics);
    }

    return mongoose.model(name, s);
};

module.exports = Mongoose;
