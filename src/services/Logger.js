var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    winston =       require('winston'),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore');


/**
 * Logger service
 *
 * Author:    Phong Mai
 * Timestamp: 6/5/13 5:51 PM
 */
var Logger = function() {
    BaseService.call(this, 'Logger');

    this._logger = null;
    this._disabled = false;
};

Logger.TYPE = {
    CONSOLE:    'console'
};

util.inherits(Logger, BaseService);

/**
 * Initialize the logger
 *
 * @param options
 */
Logger.prototype.initialize = function(options) {
    var transport;

    options = options || {};
    _.extend(options, {
        timestamp:  true,
        type:       Logger.TYPE.CONSOLE,
        disabled:   false
    });

    switch(options.type) {
        case Logger.TYPE.CONSOLE:
            transport = new (winston.transports.Console)(options)
            break;
    }

    this._logger = new (winston.Logger)({
        transports: [
            transport
        ]
    });

    this._disabled = options.disabled;
};

/**
 * Log an info
 *
 * @param message
 * @param meta
 */
Logger.prototype.info = function(message, meta) {
    this.log('info', message, meta);
};

/**
 * Log an error
 *
 * @param message
 * @param meta
 */
Logger.prototype.error = function(message, meta) {
    this.log('error', message, meta);
};

/**
 * Default log method
 *
 * @param type
 * @param message
 * @param meta
 */
Logger.prototype.log = function(type, message, meta) {
    if (!this._disabled) {
        if (!_.isUndefined(meta)) {
            this._logger.log(type, message, meta);
        } else {
            this._logger.log(type, message);
        }
    }
};

module.exports = Logger;
