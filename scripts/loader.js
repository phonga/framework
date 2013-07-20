var commander       = require('commander'),
    Context         = require('../src/Context');
/**
 * Script Loader
 *
 * Author:    Phong Mai
 * Timestamp: 7/20/13 11:59 AM
 */

var pkg = require('../package.json');

commander.option('-c, --config <config>', 'Specify the configuration file', 'etc/' + pkg.name.toLowerCase() + '.json')
    .option('-s, --script <script>', 'Specify the script to run')
    .parse(process.argv);

if (!commander.script) {
    console.log('Script required');
    process.abort();
}

Context.loadFile(Context.__base() + commander.config)
    .then(function() {
        require(__dirname + '/' + commander.script)(Context, function() {
            process.abort();
        });
    })
    .fail(function(reason) {
        console.log(reason);
        Context.get('Logger').error(reason, reason);
        process.abort();
    });

