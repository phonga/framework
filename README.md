#Framework

Based on ExpressJS with an extension for injectable services into the application.

## Services
Services are class definitions with a base class of BaseService that provide a self-contained unit of functionality. The abstract method initialize must be extended and a Promise returned.

```js
/**
 * Initialize the service
 */
BaseService.prototype.initialize = function(options) {
    throw new Error('BaseService initialize not defined');
};
```
Services in the framework will attempt to initialize before any other part of the application starts.

### Configuration
Services are configured under the services section of the configuration file.

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

## API
The api section defines the route and functionality for any APIs in the system. The output of the calls should be JSON responses. When adding a file, define the exports function with a Context as a parameter. The defined file will be automatically required by the system.

```js
module.exports = function(Context) {
    Context.route('/test')
        .get(function(req, resp) {
            resp.json({test: 'hello world'});
        })
};
```

## Middleware
Initialise and setup any middleware code for the express context. You can provide interceptors at this point if required. The middleware module when required, is invoked under the application Context instance and is therefor injectable.

```js
// Pass through the context and inject the GoogleCalendar
module.exports = function(Context, GoogleCalendar) {
    var config = Context.getConfig().google;

    passport.use(new GoogleStrategy({
        clientID: config.id,
        clientSecret: config.secret,
        callbackURL: "http://localhost:3000/auth/google/callback"
    }, function(accessToken, refreshToken, profile, done) {

        GoogleCalendar.getClientWithTokens(accessToken, refreshToken)
            .then(function(client) {
                client.calendar.events.list({calendarId: 'primary'})
                    .execute(function(err, result) {
                        console.log(err);
                        console.log(result);
                    });
            })
            .fail(function(err) {
                console.log(err);
            });

        done();
    }));
};
```

### Configuration
To enable the middleware, you must define a "middleware" property in the config as an array of names of the middleware to enable.

```js
{
    "google": {
        "id": "314912993116-ih2iret2scebshtcj0f4f1e2r1v2ghji.apps.googleusercontent.com",
        "secret": "PO0malqD-veAzJcFW9gLGHak",
        "callback": "http://localhost:3000/auth/google/callback"
    },
    "services": [
        {
            "id": "GoogleCalendar",
            "type": "GoogleAPI",
            "options": {
                "api": "calendar",
                "version": "v3"
            }
        }
    ],
    "middleware": ["GooglePassport"]
}
```

## Run
You can run either the cluster.js or the debug.js, both will work with the difference that the cluster will run in cluster mode.
