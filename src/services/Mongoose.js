var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    mongoose =      require('mongoose'),
    sprintf =       require('sprintf-js').sprintf;
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

    this.connection = mongoose.createConnection();

    this.connection.on('open', _.bind(function() {
        this.info(Logger, sprintf('id: %s - ready', options.serviceId));
        deferred.resolve();
    }, this));

    this.connection.on('error', _.bind(function(err) {
        this.error(Logger, sprintf('id: %s - error: %s', options.serviceId, err.toString()));
        deferred.reject(err);
    }, this));

    this.connection.on('disconnected', _.bind(function() {
        this.error(Logger, sprintf('id: %s - disconnected', options.serviceId));
    }, this));

    this.connection.open(options.host, options.db, options.port, {auto_reconnect: true});

    return deferred.promise;
};

/**
 * Create schema object for the schema definition
 *
 * @param {Object} schema The schema object
 * @param {Object} [methods] The methods object
 * @param {Object} [statics] The static methods object
 * @returns {*}
 */
Mongoose.prototype.createSchema = function(schema, methods, statics) {
    var s = mongoose.Schema(schema);

    /**
     * Get the model method
     *
     * @returns {*}
     */
    s.methods.getModel = function() {
        return this.model(this.constructor.modelName);
    };
    /**
     * Find one instance and populate fields
     *
     * @param {Object} query - the query object
     * @param {Array} fields - the fields to populate
     * @returns {Q.promise}
     */
    s.statics.findOneAndPopulate = function(query, fields) {
        var defer = q.defer();

        var queryExec = this.findOne(query);

        _.each(fields, function(field) {
            queryExec = queryExec.populate(field);
        });

        queryExec.exec(function(err, obj) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(obj);
            }
        });

        return defer.promise;
    };
    /**
     * Find and populate fields
     *
     * @param query
     * @param fields
     * @returns {Q.promise}
     */
    s.statics.findAndPopulate = function(query, fields) {
        var defer = q.defer();

        var queryExec = this.find(query);
        _.each(fields, function(field) {
            queryExec = queryExec.populate(field);
        });

        queryExec.exec(function(err, obj) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(obj);
            }
        });

        return defer.promise;
    };

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

    return this.connection.model(name, s);
};

module.exports = Mongoose;
