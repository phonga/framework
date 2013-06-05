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

    this._commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    this._functionArgsRegex = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    this._functionArgSplit = /,/;
};

Context.prototype.loadFile = function(file) {
    var config = require(file);
    return this.load(config);
};

Context.prototype.load = function(config) {
    config = config || {};

    _.defaults(config,
        {
            services: [],
            directory: {
                service: this.__src('/services')
            }
        });

    this._serviceBaseDir = config.directory.service;

    var defers = [];
    _.each(config.services, function(serviceConfig) {

        this._checkServiceConfig(serviceConfig);

        var servicePath = this._serviceBaseDir + '/' + serviceConfig.type + '.js';
        if (!fs.existsSync(servicePath)) {
            throw new Error('Undefined service type: ' + serviceConfig.type);
        }

        var klass = require(servicePath);
        var service = new klass();
        service.setId(serviceConfig.id);

        serviceConfig.options = serviceConfig.options || {};
        var defer = service.initialize(serviceConfig.options);

        if (!_.isUndefined(defer) && !_.isNull(defer)) {
            defers.push(defer);
        }

        this._services[serviceConfig.id] = service;

    }, this);


    return q.all(defers);
};

Context.prototype.get = function(id) {
    if (!_.has(this._services, id)) {
        return null;
    }

    return this._services[id];
};

Context.prototype.invoke = function(func, argObject) {
    var fn = func.toString().replace(this._commentsRegex, '');
    var argString = fn.match(this._functionArgsRegex);
    var args = argString[1].split(this._functionArgSplit);

    var passedArgs = [];

    _.each(args, function(arg) {
        arg = arg.trim();

        if (argObject && argObject.hasOwnProperty(arg)) {
            passedArgs.push(argObject[arg]);
        } else {
            var service = this.get(arg);
            if (_.isNull(service)) {
                throw new Error('Unable to find service ' + arg);
            }

            passedArgs.push(service);
        }

    }, this);

    func.apply(this, passedArgs);
};

Context.prototype.invokeRequestHandler = function(func) {
    var self = this;
    return function(req, resp) {
        self.invoke(func, {req: req, resp: resp});
    };
};

Context.prototype._checkServiceConfig = function(serviceConfig) {
    if (_.isUndefined(serviceConfig.id)) {
        throw new Error('Service Config must contain an id');
    }

    if (_.isUndefined(serviceConfig.type)) {
        throw new Error('Service Config must contain an type');
    }
};

Context.prototype.__base = function() {
    return __dirname + '/../';
};

Context.prototype.__src = function(dir) {
    return this.__base() + '/src/' + dir;
};

module.exports = new Context();
