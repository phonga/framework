var Sequelize   = require('../../../src/services/Sequelize'),
    Logger      = require('../../../src/services/Logger'),
    expect      = require('chai').expect,
    sequelize   = require('sequelize');

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

    it('should create a class method', function(done) {
        service.initialize({db: 'test', username: 'root', password: 'root'}, logger)
            .then(function() {
                var table = service.define('test', {name: sequelize.STRING}, {classMethod: function() {}});

                expect(table.classMethod).to.be.a.function;
                done();
            });
    });

    it('should create a instance method', function(done) {
        service.initialize({db: 'test', username: 'root', password: 'root'}, logger)
            .then(function() {
                var table = service.define('test', {name: sequelize.STRING}, {}, {instanceMethod: function() {}});
                var t = table.build({name: 'hello'});

                expect(table.instanceMethod).not.to.be.a.function;
                expect(t.instanceMethod).to.be.a.function;

                done();
            });
    });
});