var GoogleAPI =     require('./GoogleAPI'),
    Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    _ =             require('underscore'),
    q =             require('q'),
    moment =        require('moment');

/**
 * Google Calendar API based off GoogleAPI service
 *
 * @constructor
 */
var GoogleCalendarAPI = function() {
    GoogleAPI.call(this, 'GoogleCalendarAPI');
    this.service = null;
};

util.inherits(GoogleCalendarAPI, GoogleAPI);

/**
 * Override the initialize to add in the version and api type
 *
 * @param {Object} options - the options for the service
 * @returns {*|Q.promise|Promise|Function}
 */
GoogleCalendarAPI.prototype.initialize = function(options) {
    _.defaults(options, {
        version: 'v3'
    });

    options = _.extend(options, {
        api: 'calendar'
    });

    return GoogleAPI.prototype.initialize.call(this, options);
};
/**
 * Get the calendar events for a user
 *
 * @param {string} accessToken - the users access token
 * @param {string} refreshToken - the users refresh token
 * @returns {{asPrimary: asPrimary, maxTime: maxTime, minTime: minTime, execute: execute}}
 */
GoogleCalendarAPI.prototype.getEvents = function(accessToken, refreshToken) {
    var options = {};
    var self = this;
    return {
        /**
         * Get the primary calendar
         *
         * @returns {GoogleCalendarAPI.prototype.getEvents}
         */
        asPrimary: function() {
            options.calendarId = 'primary';
            return this;
        },
        /**
         * Set the maximum time to perform a search for
         *
         * @param {date} t - the date for the maximum time
         * @returns {GoogleCalendarAPI.prototype.getEvents}
         */
        maxTime: function(t) {
            options.timeMax = moment(t).utc().toISOString();
            return this;
        },
        /**
         * Set the minimum time to perform a search for
         * @param {date} t - the minimum time
         * @returns {GoogleCalendarAPI.prototype.getEvents}
         */
        minTime: function(t) {
            options.timeMin = moment(t).utc().toISOString();
            return this;
        },
        /**
         * Execute the query
         *
         * @returns {Promise}
         */
        execute: function() {
            var defer = q.defer();

            self.getClientWithTokens(accessToken, refreshToken)
                .then(function(client) {
                    client.calendar.events.list(options)
                        .execute(function(err, result) {
                            if (err) {
                                defer.reject(err);
                            } else {
                                defer.resolve(result);
                            }
                        });
                });

            return defer.promise;
        }
    }
};

module.exports = GoogleCalendarAPI;