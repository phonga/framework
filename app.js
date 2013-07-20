
module.exports = function() {

    var express =       require('express'),
        http =          require('http'),
        path =          require('path'),
        commander =     require('commander'),
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

                            require('./middleware/index')(Context);

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

    var pkg = require('./package.json');

    commander.option('-c, --config <config>', 'Specify the configuration file', 'etc/' + pkg.name.toLowerCase() + '.json')
        .parse(process.argv);

    Context.loadFile(Context.__base() + commander.config)
        .then(fn)
        .fail(function(reason) {
            console.log(reason);
            Context.get('Logger').error(reason, reason);
            process.abort();
        });
};
