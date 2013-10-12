/**
 * Stomp service test
 *
 * Author:    Phong Mai
 * Timestamp: 9/9/13 1:24 PM
 */
var AMQP        = require('../../../src/services/Amqp'),
    expect      = require('chai').expect,
    _           = require('underscore'),
    querystring = require('querystring'),
    Context     = require(__dirname + '/../../../src/Context');


    describe('AMQP Unit Test', function() {
    var service;

    beforeEach(function(done) {
        service = new AMQP();
        var options = {
            exchanges: [
                {
                    name: 'test-exchange',
                    binds: [
                        {
                            queue: 'test-queue',
                            route: 'testRoute'
                        }
                    ]
                }
            ]
        };

        service.initialize(options)
            .then(function() {
                done();
            });
    });

    it('should setup the exchange', function() {
        expect(_.keys(service.exchanges), 'Invalid exchange length').to.be.length(1);
        expect(service.exchanges['test-exchange'], 'Invalid exchange').not.to.be.undefined;
        expect(service.exchanges['test-exchange'], 'Invalid exchange').not.to.be.null;
        expect(_.isFunction(service.exchanges['test-exchange'].publish), 'Invalid publish function').to.be.true;
    });

    it('should get a queue', function(done) {
        service.queue('test-queue')
            .then(function(queue) {
                expect(queue, 'Invalid queue').not.to.be.undefined;
                expect(queue.name, 'Invalid queue name').to.equal('test-queue');

                done();
            });
    });

    it('should store the exchange in Context', function() {
        expect(Context.get('test-exchange'), 'Invalid context exchange service').not.to.be.undefined;
        expect(Context.get('test-exchange'), 'Invalid context exchange service').not.to.be.null;
    });

    it('should store the queue in Context', function() {
        expect(Context.get('test-queue'), 'Invalid context queue service').not.to.be.undefined;
        expect(Context.get('test-queue'), 'Invalid context queue service').not.to.be.null;
    });

    it('should get an exchange', function(done) {
        service.exchange('test-exchange')
            .then(function(exchange) {
                expect(exchange, 'Invalid exchange').not.to.be.undefined;
                expect(exchange.name, 'Invalid exchange name').to.equal('test-exchange');

                done();
            });
    });

    it('should publish and receive a message', function(done) {
        var queue = Context.get('test-queue');
        queue.subscribe(function(message) {
            expect( message.data.toString(), 'Invalid payload').to.equal('hello world');
            done();
        });

        var exchange = Context.get('test-exchange')
        exchange.publish('testRoute', 'hello world', {});
    });
});