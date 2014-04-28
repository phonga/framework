var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    googleapis =    require('googleapis'),
    OAuth2 =        googleapis.auth.OAuth2;


var GoogleAPI = function() {
    BaseService.call(this, 'GoogleAPI');
    this.service = null;
    this.oauth = null;
};

util.inherits(GoogleAPI, BaseService);
/**
 * Initialize the sevice
 *
 * @param options
 * @param Logger
 * @returns {Promise}
 */
GoogleAPI.prototype.initialize = function(options, Logger) {

    var config = Context.getConfig().google;

    if (_.isNull(config.id) || _.isUndefined(config.id)) {
        throw new Error('Google client id missing');
    }

    if (_.isNull(config.secret) || _.isUndefined(config.secret)) {
        throw new Error('Google secret missing');
    }

    if (_.isNull(config.callback) || _.isUndefined(config.callback)) {
        throw new Error('Google callback missing');
    }

    if (_.isNull(options.api) || _.isUndefined(options.api)) {
        throw new Error('Google api missing');
    }

    if (_.isNull(options.version) || _.isUndefined(options.version)) {
        throw new Error('Google version missing');
    }

    this.oauth = new OAuth2(config.id, config.secret, config.callback);

    var defer = q.defer();

    this.service = googleapis.discover(options.api, options.version);
    defer.resolve();

    return defer.promise;
};
/**
 * Get the client with auth tokens
 *
 * @param accessToken
 * @param refreshToken
 * @returns {Promise}
 */
GoogleAPI.prototype.getClientWithTokens = function(accessToken, refreshToken) {
    this.oauth.credentials = {
        access_token: accessToken,
        refresh_token: refreshToken
    };

    var defer = q.defer();
    this.service
        .withAuthClient(this.oauth)
        .execute(_.bind(function(err, client) {
            this.oauth.credentials = null;
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(client);
            }
        }, this));

    return defer.promise;
};
/**
 * Get the client
 *
 * @returns {Promise}
 */
GoogleAPI.prototype.getClient = function() {
    var defer = q.defer();
    this.service
        .execute(function(err, client) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(client);
            }
        });

    return defer.promise;
};

module.exports = GoogleAPI;


