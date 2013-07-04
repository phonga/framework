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

    this.connection = null;
};

util.inherits(Mongoose, BaseService);

/**
 * Initialize the mongoose connection
 *
 * @param {Object} options The options for the service
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

    this.connection = mongoose.connection;

    this.connection.on('open', function() {
        Logger.info('Mongoose - connected ' + options.host);
        deferred.resolve();
    });

    this.connection.on('error', function(err) {
        Logger.error('Mongoose - ' + err.toString());
        deferred.reject(err);
    });

    mongoose.connect(options.host, options.db, options.port);

    return deferred.promise;
};

/**
 * Create schema object for the schema defintion
 *
 * @param {Object} schema The schema object
 * @param {Object} [methods] The methods object
 * @param {Object} [statics] The static methods object
 * @returns {*}
 */
Mongoose.prototype.createSchema = function(schema, methods, statics) {
    var s = mongoose.Schema(schema);

    if (methods) {
        s.method(methods);
    }

    if (statics) {
        s.static(statics);
    }

    return s;
};

/**
 * Create a mongoose model object
 *
 * @param {String} name The name for the model
 * @param {Object} schema The schema object
 * @param {Object} [methods] The methods object
 * @param {Object} [statics] The static methods object
 * @returns {Mongoose.model} Mongoose model created from the schema
 */
Mongoose.prototype.createModel = function(name, schema, methods, statics) {
    var s = schema;
    if (!(schema instanceof mongoose.Schema)) {
        s = this.createSchema(schema, methods, statics);
    }

    return mongoose.model(name, s);
};

module.exports = Mongoose;
