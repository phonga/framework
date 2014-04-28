var Logger      = require('../../../src/services/Logger'),
    expect      = require('chai').expect,
    _           = require('underscore'),
    q           = require('q'),
    googleapis  = require('googleapis'),
    sinon       = require('sinon'),
    Context     = require(__dirname + '/../../../src/Context');


describe('GoogleAPI Unit Test', function() {
    var service,
        GoogleAPI,
        stub,
        authStub;

    beforeEach(function() {

        var returns = {
            withAuthClient: function() {
                return {
                    execute: function(cb) {
                        cb(null, {});
                    }
                }
            },
            execute: function(cb) {
                cb(null, {});
            }
        };

        authStub = sinon.stub(returns, 'withAuthClient');
        authStub.returns({
            execute: function(cb) {
                cb(null, {});
            }
        });

        stub = sinon.stub(googleapis, 'discover');
        stub.returns(returns);
        GoogleAPI   = require('../../../src/services/GoogleAPI');
    });

    afterEach(function() {
        stub.restore();
    });

    beforeEach(function(done) {

        Context.load({
            google: {
                id: '111',
                secret: '222',
                callback: '333'
            },
            services: []
        }).then(function() {
            done();
        });

    });

    beforeEach(function(done) {
        service = new GoogleAPI();
        var options = {
            serviceId: 'GoogleAPI',
            api: 'calendar',
            version: 'v3'
        };

        var logger = new Logger();
        logger.initialize({disabled: true});
        service.initialize(options, logger)
            .then(function() {
                done();
            });
    });

    it('should setup the service', function() {
        expect(service.service).not.to.be.null;
    });

    it('should get clients', function(done) {
        service.getClient()
            .then(function(client) {
                expect(client).not.to.be.null;
                expect(client).not.to.be.undefined;

                done();
            });
    });

    it('should get auth client', function(done) {
        service.getClientWithTokens('111', '222')
            .then(function(client) {
                expect(client).not.to.be.null;
                expect(client).not.to.be.undefined;

                done();
            })
            .fail(function(err) {
                console.log(err);
            });
    });

});