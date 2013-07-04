var fs  =    require('fs'),
    _   =     require('underscore');
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
            Logger.info('Middleware Loader: loading ' + middle);
            require(__dirname + '/' + middle)(Context);
        });
    });
};