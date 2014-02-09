var fs          = require('fs'),
    _           = require('underscore'),
    sprintf     = require('sprintf-js').sprintf;
/**
 * Index reader module
 *
 * Author:    Phong Mai
 * Timestamp: 7/4/13 7:57 PM
 */
module.exports = function(Context) {
    Context.invoke(function(Logger) {
        var middleware = Context.getConfig().middleware || [];

        _.each(middleware, function(middle) {
            Logger.info(sprintf('%s loading %s', Logger.formatString('MIDDLEWARE'), middle));
            require(__dirname + '/' + middle)(Context);
        });
    });
};