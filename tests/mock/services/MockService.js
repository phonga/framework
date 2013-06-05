var Context =       require('../../../src/Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q');
/**
 * Working Service
 *
 * Author:    Phong Mai
 * Timestamp: 6/5/13 7:35 PM
 */

var MockService = function() {
    BaseService.call(this, 'MockService');
};

util.inherits(MockService, BaseService);

MockService.prototype.initialize = function(options) {
    var deferred = q.defer();

    deferred.resolve();

    return deferred.promise;
};

module.exports = MockService;
