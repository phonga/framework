Application specific folder that contains init and middleware code.

### Init
Any javascript file placed under the init directory will auto require and be executed just before the server has been created. Once required it will pass through the application Context instance.

```js
module.exports = function(Context) {
    // Do something in here before the server has been created
};
```

### Middleware
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
