var GoogleAPI =     require('GoogleAPI'),
    Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    _ =             require('underscore');

/**
 * Google Calendar API based off GoogleAPI service
 *
 * @constructor
 */
var GoogleCalendarAPI = function() {
    GoogleAPI.call(this, 'GoogleCalendarAPI');
    this.service = null;
};

util.inherits(GoogleAPI, GoogleAPI);

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

module.exports = GoogleCalendarAPI;