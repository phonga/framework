
module.exports = function() {

    var express =       require('express'),
        http =          require('http'),
        path =          require('path'),
        commander =     require('commander'),
        Context =       require('./src/Context'),
        sprintf =       require('sprintf-js').sprintf;

    var app = express();
    Context.setApp(app);

    var fn = Context.invokeFunction(
                    function(Logger) {

                        app.configure(function(){
                            app.set('port', process.env.PORT || 3000);
                            app.set('views', __dirname + '/website/views');
                            app.set('view engine', 'ejs');
                            app.use(express.compress());
                            app.use(express.favicon());
                            app.use(express.bodyParser());
                            app.use(express.methodOverride());
                            app.use(express.cookieParser('your secret here'));

                            require('./middleware/index')(Context);

                            app.use(app.router);
                            app.use(express.static(path.join(__dirname, '/website/public')));
                        });

                        app.configure('development', function(){
                            app.use(express.errorHandler());
                        });

                        http.createServer(app).listen(app.get('port'), function() {
                            require('./website/routes')(Context);
                            require('./api')(Context);
                            Logger.info(sprintf('/app/%d', app.get('port')));
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
