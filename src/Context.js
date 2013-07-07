var q   = require('q'),
    _   = require('underscore'),
    fs  = require('fs');

/**
 * Context for the application
 *
 * Author:    Phong Mai
 * Timestamp: 6/5/13 5:50 PM
 */

var Context = function() {
    this._serviceBaseDir = null;
    this._services = {};
    this._config = {};
    this._app;
    this._initialized = false;

    this._commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    this._functionArgsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    this._functionArgSplit = /,/;
};

/**
 * Get the configuration information
 *
 * @returns {Object}
 */
Context.prototype.getConfig = function() {
    return this._config;
};

Context.prototype.clear = function() {
    this._serviceBaseDir = null;
    this._services = {};
    this._config = {};
    this._app;
    this._initialized = false;
};

/**
 * Set the application for the context
 *
 * @param {Object} app The application to set
 */
Context.prototype.setApp = function(app) {
    this._services.app = app;
    this._app = app;
};

/**
 * Get the application for the context
 *
 * @returns {*}
 */
Context.prototype.getApp = function() {
    return this._app;
};

/**
 * Load a file configuration
 *
 * @param {String} file The filename to load
 * @returns {*}
 */
Context.prototype.loadFile = function(file) {
    if (!this._initialized) {
        var config = require(file);
        return this.load(config);
    } else {
        var deferred = q.defer();

        deferred.resolve();

        return deferred.promise;
    }
};

/**
 * Load the configuration
 *
 * @param {Object} config The config object to load
 * @returns {*}
 */
Context.prototype.load = function(config) {
    config = config || {};

    this._config = config;

    // Set the defaults for the configuration
    _.defaults(config,
        {
            services: [],
            directory: {
                service: this.__src('/services')
            }
        });

    // Get the service base directory
    this._serviceBaseDir = config.directory.service;

    // Setup the logger to load first
    var logger = config.logger || {};
    _.defaults(logger, {
        id: 'Logger',
        type: 'Logger'
    });

    // Load the logger
    this._loadService(logger);

    // Load each of the services defined
    var defers = [];
    _.each(config.services, function(serviceConfig) {
        if (serviceConfig.type === 'Logger') {
            throw new Error('Unable to define Logger in service configuration, this should be defined outside.');
        }

        defers.push(this._loadService(serviceConfig));
    }, this);

    var deferred = q.defer();

    var self = this;
    q.all(defers)
        .then(function() {
            self._initialized = true;
            deferred.resolve();
        })
        .fail(function(reason) {
            deferred.reject(reason);
        });

    // Return a promise
    return deferred.promise;
};

/**
 * Get a service or null if one has not been found
 *
 * @param {String} id The service identifier to get
 * @returns {*}
 */
Context.prototype.get = function(id) {
    if (!_.has(this._services, id)) {
        return null;
    }

    return this._services[id];
};

/**
 * Invoke a function with injection of services, only the services known to the Context
 * will be injected, otherwise if not found in the service list or the argObject list
 * then an error is thrown.
 *
 * @param {Function} func The function to invoke
 * @param {Object} [argObject] The argument object
 * @param {Object} [bind] The binding object for the invoked function
 */
Context.prototype.invoke = function(func, argObject, bind) {
    var fn = func.toString().replace(this._commentsRegex, '');
    var argString = fn.match(this._functionArgsRegex);
    var args = argString[1].split(this._functionArgSplit);

    var passedArgs = [];

    _.each(args, function(arg) {
        arg = arg.trim();

        if (!_.isEmpty(arg)) {
            if (argObject && argObject.hasOwnProperty(arg)) {
                passedArgs.push(argObject[arg]);
            } else {
                var service = this.get(arg);
                if (_.isNull(service)) {
                    throw new Error('Unable to find service ' + arg);
                }

                passedArgs.push(service);
            }
        }

    }, this);

    return func.apply(bind || this, passedArgs);
};

/**
 * Provide an injectable invoke request handler method
 *
 * @param {Function} func The function to wrap in another function
 * @returns {Function}
 */
Context.prototype.invokeRequestHandler = function(func) {
    var self = this;
    return function(req, resp) {
        self.invoke(func, {req: req, resp: resp});
    };
};

/**
 * Provide an invokable function
 *
 * @param {Function} func The function to wrap in another function
 * @returns {Function}
 */
Context.prototype.invokeFunction = function(func) {
    var self = this;
    return function() {
        self.invoke(func);
    }
};

/**
 * Load a service from the config, returns a promise.
 *
 * @param {Object} serviceConfig The service config
 * @returns {*}
 * @private
 */
Context.prototype._loadService = function(serviceConfig) {
    this._checkServiceConfig(serviceConfig);

    var servicePath = this._serviceBaseDir + '/' + serviceConfig.type + '.js';
    if (!fs.existsSync(servicePath)) {
        throw new Error('Undefined service type: ' + serviceConfig.type);
    }

    // Instantiate the service
    var klass = require(servicePath);
    var service = new klass();
    service.setId(serviceConfig.id);

    // Get the options object
    serviceConfig.options = serviceConfig.options || {};
    // Get the service id into the options
    serviceConfig.options.serviceId = serviceConfig.id;
    // Invoke the initialize such that the Logger can be injected
    var defer = this.invoke(service.initialize, {options: serviceConfig.options}, service);

    // Store the service in the cache
    this._services[serviceConfig.id] = service;

    return defer;
};

/**
 * Check the service config, if there is missing information it will
 * throw an error.
 *
 * @param {Object} serviceConfig
 * @private
 */
Context.prototype._checkServiceConfig = function(serviceConfig) {
    if (_.isUndefined(serviceConfig.id)) {
        throw new Error('Service Config must contain an id');
    }

    if (_.isUndefined(serviceConfig.type)) {
        throw new Error('Service Config must contain an type');
    }
};

/**
 * Get the base directory
 *
 * @returns {string}
 * @private
 */
Context.prototype.__base = function() {
    return __dirname + '/../';
};

/**
 * Get the source directory
 *
 * @param {String} dir The directory to wrap
 * @returns {string}
 * @private
 */
Context.prototype.__src = function(dir) {
    return this.__base() + '/src/' + dir;
};

module.exports = new Context();
