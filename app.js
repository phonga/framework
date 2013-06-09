
/**
 * Module dependencies.
 */

var cluster =       require('cluster'),
    cpus =          require('os').cpus().length;


if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < cpus; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker) {
        console.log('Worker ' + worker.process.pid + ' died');
    });

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' online');
    });

} else {

    var express =       require('express'),
        http =          require('http'),
        path =          require('path'),
        Context =       require('./src/Context');

    var app = express();
    Context.setApp(app);

    var fn = Context.invokeFunction(
                    function(Logger) {

                        app.configure(function(){
                            app.set('port', process.env.PORT || 3000);
                            app.set('views', __dirname + '/website/views');
                            app.set('view engine', 'ejs');
                            app.use(express.favicon());
                            app.use(express.bodyParser());
                            app.use(express.methodOverride());
                            app.use(express.cookieParser('your secret here'));
                            app.use(express.session());
                            app.use(app.router);
                            app.use(express.static(path.join(__dirname, '/website/public')));
                        });

                        app.configure('development', function(){
                            app.use(express.errorHandler());
                        });

                        http.createServer(app).listen(app.get('port'), function() {
                            require('./website/routes')(Context);
                            Logger.info('Worker server listening on port ' + app.get('port'));
                        });
                    }
            );

    Context.loadFile(Context.__base() + '/etc/config.json')
        .then(fn)
        .fail(function(reason) {
            console.log('Context Failed: ' + reason);
            process.abort();
        });
}