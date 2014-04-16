
module.exports = function() {

    var express =       require('express'),
        bodyParser =    require('body-parser'),
        methodOverride =require('method-override'),
        compress =      require('compression'),
        favicon =       require('static-favicon'),
        cookieParser =  require('cookie-parser'),
        errorHandler =  require('errorhandler'),
        http =          require('http'),
        path =          require('path'),
        commander =     require('commander'),
        Context =       require('./src/Context'),
        sprintf =       require('sprintf-js').sprintf;

    var app = express();
    Context.setApp(app);

    var fn = Context.invokeFunction(
                    function(Logger) {

                        app.set('port', process.env.PORT || 3000);
                        app.set('views', __dirname + '/website/views');
                        app.set('view engine', 'ejs');
                        app.use(compress());
                        app.use(bodyParser());
                        app.use(favicon());
                        app.use(methodOverride());
                        app.use(cookieParser('your secret here'));

                        require(Context.__src('app/middleware/index'))(Context);

                        app.use(express.static(path.join(__dirname, '/website/public')));

                        app.use(errorHandler());

                        require(Context.__src('app/init/index'))(Context);

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
