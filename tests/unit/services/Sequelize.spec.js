var Sequelize   = require('../../../src/services/Sequelize'),
    Logger      = require('../../../src/services/Logger'),
    expect      = require('chai').expect;

describe('Sequelize Unit Test', function() {
    var service, logger;

    beforeEach(function() {
        service = new Sequelize();
        logger = new Logger();
        logger.initialize({disabled: true});
    });

    it('should be connected', function(done) {
        service.initialize({db: 'test', username: 'root', password: 'root'}, logger)
            .then(function() {
                expect(service._connection, 'Invalid connection').not.to.be.null;
                expect(service._connection, 'Invalid connection').not.to.be.undefined;
                expect(service.define).to.be.a.function;
                done();
            });
    });
});