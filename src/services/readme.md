Services are injectable in the application Context instance via the invoke method. To create a service you must inherit from the BaseService via the util.inherits method:

```js
util.inherits(AMQP, BaseService);
```
To get the service registered and running, the initialize method must return a promise that is fulfilled when either the service is ready or when there is an error:

```js
AMQP.prototype.initialize = function(options, Logger) {
    options = options || {};

    _.defaults(options, {
        login:      'guest',
        password:   'guest',
        host:       'localhost',
        port:       5672
    });

    var defer = q.defer();

    var self = this;
    amqp.connect('amqp://' + options.host)
        .then(function(connection) {
            return connection.createChannel();
        })
        .then(function(channel) {
            self.service = channel;
            self._initializeExchanges(options.exchanges, Logger)
                .then(function() {
                    self.info(Logger, Logger.formatString(options.serviceId) + ' ready');
                    defer.resolve();
                });
        });

    return defer.promise;
};

```

To use the service a definition must be setup in the config file under services:

```js
{
    "services": [
        {
            "id":   "Mongoose",
            "type": "Mongoose",
            "options": {
                "db":   "test"
            }
        },
        {
            "id":   "cache",
            "type": "Redis"
        },
        {
            "id":   "queue",
            "type": "Amqp",
            "options": {
                "exchanges": [
                    {
                        "name": "VideoExchange",
                        "binds": [
                            {
                                "queue": "Limelight",
                                "route": "limelight"
                            }
                        ]
                    }
                ]
            }
        }
    ]
}
```

To inject use the "id" definition:

```js
module.exports = function(Context, queue) {
    // do something
}
```
