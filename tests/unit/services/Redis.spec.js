/**
 * Redis service test
 *
 * Author:    Phong Mai
 * Timestamp: 9/9/13 1:24 PM
 */
var Redis   = require('../../../src/services/Redis'),
    expect  = require('chai').expect;

describe('Redis Unit Test', function() {
    var service;

    beforeEach(function() {
        service = new Redis();
    });

    it('should be connected', function(done) {
        service.initialize({})
            .then(function() {
                expect(service.service.connected).to.be.true;
                done();
            });
    });
});