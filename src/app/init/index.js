var fs          = require('fs'),
    _           = require('underscore'),
    sprintf     = require('sprintf-js').sprintf;
/**
 * Entry point for app init code
 *
 * Author:    Phong Mai
 * Timestamp: 2/8/14 2:48 PM
 */
module.exports = function(Context) {
    Context.invoke(function(Logger) {
        fs.readdirSync(__dirname).forEach(function(file) {
            if (file !== "index.js") {
                var location = __dirname + '/' + file;
                Logger.info(sprintf('%s initializing ...', file));
                require(location)(Context);
            }
        });
    });
};