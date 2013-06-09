var Context =       require(__dirname + '/../../../src/Context'),
    expect =        require('chai').expect,
    MockService =   require('../../mock/services/MockService');

/**
 * Context Test Suite
 *
 * Author:    Phong Mai
 * Timestamp: 6/5/13 6:17 PM
 */
describe('Context Test Suite', function() {

    var config;

    beforeEach(function() {
        config = {
            directory: {
                service: Context.__base() + 'tests/mock/services'
            },
            services: [
                {
                    id:     'Mock',
                    type:   'MockService'
                }
            ]
        };
    });

    describe('load context tests', function() {

        it('should load the services', function(done) {
            Context.load(config)
                .then(function() {
                    expect(Context.get('Mock')).not.to.be.null;
                    expect(Context.get('Failed')).to.be.null;
                    done();
                });
        });

        it('should throw an error for an invalid service', function() {
            expect(function() {
                config.services.push({
                    id: 'FailedService',
                    type: 'NonExistant'
                })
                Context.load(config);
            }).to.throw();
        });

        it('should throw an error for an invalid service config', function() {
            expect(function() {
                config.services.push({
                    id: 'FailedService'
                })
                Context.load(config);
            }).to.throw();
        })
    });

    describe('invoke tests', function() {
        it('should invoke a function with service injection', function(done) {
            Context.invoke(function(Mock) {
                expect(Mock).not.to.be.null;
                expect(Mock).to.be.instanceOf(MockService);
                done();
            });
        });

        it('should invoke a function with passed params', function(done) {
            Context.invoke(function(hello) {
                expect(hello).to.equal('world');
                done();
            }, {hello: 'world'});
        });

        it('should invoke function where the passed param overrides the service', function(done) {
            Context.invoke(function(Mock) {
                expect(Mock).not.to.be.instanceOf(MockService);
                expect(Mock).to.equal('hello world');
                done();
            }, {Mock: 'hello world'});
        });

        it('should invoke a function without params', function(done) {
            Context.invoke(function() {
                done();
            });
        });

        it('should invoke a request handler function', function(done) {
            var func = Context.invokeRequestHandler(function(req, resp, Mock) {
                expect(Mock).to.be.instanceOf(MockService);
                expect(req).to.equal('hello');
                expect(resp).to.equal('world');

                done();
            });

            expect(typeof func).to.equal('function');

            func('hello', 'world');
        });

        it('should create an invokable function', function(done) {
            var func = Context.invokeFunction(function(Mock) {
                expect(Mock).to.be.instanceOf(MockService);
                done();
            });

            expect(typeof func).to.equal('function');

            func();
        });

        it('should throw an error for an unfound injection', function() {
            expect(function() {
                Context.invoke(function(Failed) {

                });
            }).to.throw();
        });
    });

});
