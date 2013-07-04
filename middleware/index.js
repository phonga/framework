var fs  =    require('fs'),
    _   =     require('underscore');
/**
 * Index reader module
 *
 * Author:    Phong Mai
 * Timestamp: 7/4/13 7:57 PM
 */
module.exports = function(Context) {
    var files = fs.readdirSync('.');
    _.each(files, function(file) {
        var stat = fs.statSync(__dirname + '/' + file);
        if (stat.isFile() && filename !== 'index.js') {
            require(file)(Context);
        }
    });
};
