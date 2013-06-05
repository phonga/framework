module.exports = function(grunt) {
    var log = grunt.log;

    return function(dir, options, done){
        options = options || {};

        var args = '--reporter spec --ignore-leaks --recursive ';
        var extraArgs = '';
        var env = process.env;

        if (options.coverage) {
            args += '--reporter html-cov ';
            extraArgs = ' > ' + options.coverage_output;
            env.COVERAGE = 1;
        }

        var command = 'mocha ' + args + dir + extraArgs,
            exec = require('child_process').exec;

        exec(command, {env: env}, function(err,stdout,stderr){
            log.writeln(stdout);
            log.writeln(stderr);
            done();
        })
    };
};