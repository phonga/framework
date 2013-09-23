var Neo4j   = require('../../../src/services/Neo4j'),
    expect  = require('chai').expect;

describe('Redis Unit Test', function() {
    var service;

    beforeEach(function() {
        service = new Neo4j();
//        service.initialize({host: '10.0.3.61'});
        service.initialize({host: '192.168.1.112'});
    });

    afterEach(function(done) {
        service.flush()
            .then(function() {
                done();
            });
    });

//    it('should perform a query', function(done) {
//        service.query('CREATE (n:Person { name : {name} }) RETURN n', {name: 'test-person'})
//            .then(function(res) {
//                console.log(res.text);
//
//                done();
//            })
//            .fail(function(err) {
//                console.log(err);
//            })
//    });

    it('should save a node', function(done) {
        var node = new Neo4j.Node(service);

        node.setLabel('Person');
        node.addProperty('name', 'test-person');
        node.addProperty('gender', 'male');
        node.save()
            .then(function(n) {
                expect(n, 'Invalid node').not.to.be.null;
                expect(n.id, 'Invalid id').not.to.be.null;
                expect(n.id, 'Invalid id').not.to.be.undefined;
                expect(n.getProperty('name'), 'Invalid name property').to.equal('test-person');
                expect(n.getProperty('gender'), 'Invalid gender property').to.equal('male');

                done();
            });
    });

    it('should get a node', function(done) {
        var node = new Neo4j.Node(service);

        node.setLabel('Person');
        node.addProperty('name', 'test-person');
        node.addProperty('gender', 'male');
        node.save()
            .then(function(n) {
                node.save()
                    .then(function() {
                        Neo4j.Node.find(service)
                            .match('n').label('Person')
                            .where('n.name').equals('test-person')
                            .exec()
                            .then(function(nodes) {
                                expect(nodes, 'Invalid node length').to.have.length(2);

                                done();
                            });
                    });
            });
    });

    it('should add a relationship', function(done) {
        var node = new Neo4j.Node(service);

        node.setLabel('Person');
        node.addProperty('name', 'person1');
        node.save()
            .then(function(n) {
                var node2 = new Neo4j.Node(service);
                node2.setLabel('Person');
                node2.addProperty('name', 'person2');
                node2.save()
                    .then(function() {
                        node.addRelationship(node2, 'FRIEND')
                            .then(function(res) {
//                                console.log(res);
                                done();
                            });
                    });
            });
    });

    it('should get the relationships for a node', function(done) {

        var node2, node3;
        var node = new Neo4j.Node(service);

        node.setLabel('Person');
        node.addProperty('name', 'person1');
        node.save()
            .then(function(n) {
                node2 = new Neo4j.Node(service);
                node2.setLabel('Person');
                node2.addProperty('name', 'person2');
                return node2.save();
            })
            .then(function() {
                node3 = new Neo4j.Node(service);
                node3.setLabel('Person');
                node3.addProperty('name', 'person3');
                return node3.save();
            })
            .then(function() {
                return node.addRelationship(node2, 'FRIEND');
            })
            .then(function() {
                return node.addRelationship(node3, 'FRIEND');
            })
            .then(function() {
                node.getRelationship('FRIEND')
                    .then(function(nodes) {
                        expect(nodes, 'Invalid node relationships').to.have.length(2);
                        expect(nodes[0].id, 'Invalid node').to.equal(node2.id);
                        expect(nodes[1].id, 'Invalid node').to.equal(node3.id);
                        done();
                    })
                    .fail(function(err) {
                        console.log(err);
                    });
            });
    });
});