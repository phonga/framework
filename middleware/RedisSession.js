/**
 * RedisSession middle ware
 *
 * Author:    Phong Mai
 * Timestamp: 9/2/13 2:26 PM
 */
/**
 * Passport middleware
 *
 * Author:    Phong Mai
 * Timestamp: 9/2/13 1:31 PM
 */
module.exports = function(Context) {

    var express     = require('express'),
        RedisStore  = require('connect-redis')(express);

    Context.getApp().use(express.session({
        store:  new RedisStore(),
        secret: 'mySecret'
    }));
};
