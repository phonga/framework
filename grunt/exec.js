module.exports = function(grunt) {
    var exec = require('child_process').exec;
    var log = grunt.log;

    return function (opts, done) {
        var command = opts.cmd + ' ' + opts.args.join(' ');
        log.writeln('Executing command - ' + command);
        exec(command, opts.opts, function(code, stdout, stderr) {
            if (opts.stdout) {
                log.writeln(stdout);
            }

            if(!done){
                return;
            }
            if(code === 0) {
                done(null, stdout, code);
            } else {
                done(code, stderr, code);
            }
        });
    };
};