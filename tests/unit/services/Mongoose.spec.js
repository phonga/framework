var Mongoose    = require('../../../src/services/Mongoose'),
    Logger      = require('../../../src/services/Logger'),
    expect      = require('chai').expect;

describe('Mongoose Unit Test', function() {
    var service, logger;

    beforeEach(function() {
        service = new Mongoose();
        logger = new Logger();
        logger.initialize({disabled: true});
    });

    it('should be connected', function(done) {
        service.initialize({db: 'test'}, logger)
            .then(function() {
                expect(service.connection, 'Invalid connection').not.to.be.null;
                expect(service.connection, 'Invalid connection').not.to.be.undefined;
                expect(service.connection.db._state, 'Invalid connection state').to.equal('connected');
                done();
            });
    });
});