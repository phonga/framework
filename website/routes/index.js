var fs = require('fs');
var logger = require('../common/logger'),
    sprintf = require('sprintf').sprintf;

/**
 * Require a route
 *
 * @param file
 * @param app
 */
var requireRoute = function(file, app) {
    if (file.substr(file.lastIndexOf('.') + 1) !== 'js' || file.indexOf('helper') !== -1) {
        return;
    }

    var name = file.substr(0, file.indexOf('.'));
    logger.info(logger.LOG_TYPE.ROUTE, sprintf('[%-10s] loaded', name));

    // Load the route
    require(file)(app);
};

/**
 * Scan the directory for routes
 *
 * @param directory
 * @param app
 */
var requireDirectory = function(directory, app) {
    fs.readdirSync(directory).forEach(function(file) {
        if (file === "index.js") {
            return;
        }

        var location = directory + '/' + file;

        var stat = fs.lstatSync(location);
        if (stat.isDirectory()) {
            requireDirectory(location, app);
        } else if (stat.isFile()) {
            requireRoute(location, app);
        }
    });
};

module.exports = function(app) {
    requireDirectory(__dirname, app);
};