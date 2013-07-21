var fs          = require('fs'),
    sprintf     = require('sprintf-js').sprintf;

/**
 * Require a route
 *
 * @param file
 * @param app
 */
var requireRoute = function(file, Context) {
    if (file.substr(file.lastIndexOf('.') + 1) !== 'js' || file.indexOf('helper') !== -1) {
        return;
    }

    var logger = Context.get('Logger');

    var name = file.substr(0, file.indexOf('.'));
    logger.info(sprintf('%s %s', logger.formatString('ROUTE'), name));

    // Load the route
    require(file)(Context);
};

/**
 * Scan the directory for routes
 *
 * @param directory
 * @param app
 */
var requireDirectory = function(directory, Context) {
    fs.readdirSync(directory).forEach(function(file) {
        if (file === "index.js") {
            return;
        }

        var location = directory + '/' + file;

        var stat = fs.lstatSync(location);
        if (stat.isDirectory()) {
            requireDirectory(location, Context);
        } else if (stat.isFile()) {
            requireRoute(location, Context);
        }
    });
};

module.exports = function(Context) {
    requireDirectory(__dirname, Context);
};