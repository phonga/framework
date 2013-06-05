module.exports = function(grunt) {
    var exec = require('child_process').exec;
    var log = grunt.log;

    return function(dir, done){
        var command = 'cd ' + dir + ';npm install';
        log.writeln('Executing - ' + command);

        exec(command, function(code, stdout, stderr) {

            log.writeln(stdout);
            log.writeln(stderr);

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