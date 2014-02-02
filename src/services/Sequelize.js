var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    sequelize =     require('sequelize'),
    sprintf =       require('sprintf-js').sprintf;

/**
 * Sequelize service
 *
 * @constructor
 */
var Sequelize = function() {
    BaseService.call(this, 'Sequelize');

    this._connection = null;
};

util.inherit(Sequelize, BaseService);

/**
 * Initialize the sequelize connection
 *
 * @param {Object} options - the options for the connection
 * @param {Logger} Logger - the logger
 */
Sequelize.prototype.initialize = function(options, Logger) {
    var deferred = q.defer();

    options = options || {};
    _.defaults(options, {
        port:       3306,
        host:       'localhost',
        password:   null
    });

    // Initialize the connection
    this._connection = new sequelize(options.db, options.username, options.password, options);

    // Authenticate
    this._connection.authenticate()
        .complete(_.bind(function(err) {
            if (err) {
                this.error(Logger, sprintf('%s %s', Logger.formatString(options.serviceId), err.toString()));
                deferred.reject(err);
            } else {
                this.info(Logger, sprintf('%s ready', Logger.formatString(options.serviceId)));
                deferred.resolve();
            }
        }, this));
};
/**
 * Define a model
 *
 * @param {String} model - the name of the model
 * @param {Object} definition - the model definition
 * @returns {*}
 */
Sequelize.prototype.define = function(model, definition) {
    return this._connection.define(model, definition);
};

module.exports = Sequelize;