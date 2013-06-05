module.exports = function(grunt) {

    var mocha = require('./grunt/mocha')(grunt);
    var npmInstall = require('./grunt/npm-install')(grunt);
    var gruntExec = require('./grunt/exec')(grunt);

    grunt.registerTask('test', function() {
        var done = this.async();

        mocha('./tests/unit', {}, function() {
            done();
        });
    });

    grunt.registerTask('setup', function() {
        var done = this.async();

        grunt.file.mkdir('logs');
        grunt.file.mkdir('build');

        npmInstall('.', function() {
            done();
        });
    });

    grunt.registerTask('coverage-exec', function() {
        var done = this.async();

        mocha('./server/tests', {coverage: true, coverage_output: './build/build.html'}, function() {
            done();
        });
    });

    grunt.registerTask('coverage-setup', function() {
        var done = this.async();

        var opts = {
            cmd: 'jscoverage',
            args: ['--exclude=../node-server/node_modules', '--no-highlight', '../node-server', '../node-server-cov']
        };

        gruntExec(opts, function() {
            npmInstall('../node-server-cov', function() {
                done();
            });
        });
    });

    grunt.registerTask('clean-logs', function() {
        var done = this.async();

        var opts = {
            cmd: 'rm',
            args: ['-rf', 'logs']
        };

        gruntExec(opts, function() {
            done();
        });
    });

    grunt.registerTask('clean-build', function() {
        var done = this.async();
        var opts = {
            cmd: 'rm',
            args: ['-rf', 'build']
        };

        gruntExec(opts, function() {
            done();
        });
    });

    grunt.registerTask('clean-cov', function() {
        var done = this.async();

        var opts = {
            cmd: 'rm',
            args: ['-rf', '../node-server-cov']
        };

        gruntExec(opts, function() {
            done();
        });
    });

    grunt.loadTasks('./grunt');
    grunt.registerTask('clean', 'clean-logs clean-build clean-cov');
    grunt.registerTask('default', 'test');
    grunt.registerTask('coverage', 'clean setup coverage-setup coverage-exec');
    grunt.registerTask('build', 'default');
};