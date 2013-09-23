var Context         = require('../Context'),
    BaseService     = require(Context.__src('/services/BaseService')),
    util            = require('util'),
    q               = require('q'),
    _               = require('underscore'),
    superagent      = require('superagent'),
    sprintf         = require('sprintf-js').sprintf,
    async           = require('async');

/**
 * Define a Neo4j Node
 * @constructor
 */
var Node = function(neo4j) {
    this.neo4j = neo4j;
    this.id = null;
    this.label = null;
    this.properties = {};
    this.self = null;
    this.data = null;
};

Node.prototype.save = function() {
    var defer = q.defer();

    var construct = new CreateQueryConstruct(this.label, this.properties);

    this.neo4j.query(QueryConstructBuilder.build(construct), this.properties)
        .then(_.bind(function(res) {
            var data = JSON.parse(res.text);

            this.set(data.data[0]);

            defer.resolve(this);
        }, this));

    return defer.promise;
};

Node.prototype.set = function(data) {
    this.data = data[0];
    this.label = data[1][0];

    this.self = this.data.self;
    var self = this.self.split('/');
    this.id = self[self.length - 1];

    _.each(_.keys(this.data.data), _.bind(function(index) {
        this.addProperty(index, this.data.data[index]);
    }, this));
};

Node.prototype.addProperty = function(key, value) {
    this.properties[key] = value;
};

Node.prototype.getProperty = function(key) {
    return this.properties[key];
};

Node.prototype.setLabel = function(label) {
    this.label = label;
};

Node.prototype.addRelationship = function(node, relationshipName, params) {
    var query = new Query(this.neo4j);
    query = query.match('n1').label(this.label);
    _.each(_.keys(this.properties), function(key) {
        query = query.where('n1.' + key).equals(this.properties[key]);
    }, this);

    query = query.match('n2').label(node.label);
    _.each(_.keys(node.properties), function(key) {
        query = query.where('n2.' + key).equals(node.properties[key]);
    }, this);

    query = query.relate('n1').by(relationshipName).with(params || {}).to('n2');

    return query.exec();
};

Node.prototype.getRelationship = function(relationship) {
    var query = new Query(this.neo4j);

    query.matchRelationship(this).by(relationship);

    return query.exec();
};

Node.find = function(service) {
    return new Query(service);
};

var QueryConstruct = function() {
    this._priority = 100;
};

QueryConstruct.prototype.query = function() {
    throw new Error('QueryConstruct: query not implemented');
};

var PropertyQueryConstruct = function(properties) {
    QueryConstruct.call(this);
    this._properties = properties;
};
util.inherits(PropertyQueryConstruct, QueryConstruct);

PropertyQueryConstruct.prototype.query = function() {
    var query = '';
    if (!_.isEmpty(this._properties)) {
        query += ' {';
        _.each(_.keys(this._properties), function(key, index) {
            if (index !== 0) {
                query += ', ';
            }
            query += key + ' : {' + key + '}';
        });
        query += '}';
    }

    return query;
};

var CreateQueryConstruct = function(label, properties) {
    PropertyQueryConstruct.prototype.constructor.call(this, properties);

    this._label = label;
    this._priority = 1;
};
util.inherits(CreateQueryConstruct, PropertyQueryConstruct);

CreateQueryConstruct.prototype.query = function() {
    var query = 'CREATE (n';
    if (this._label) {
        query += ':' + this._label;
    }

    query += PropertyQueryConstruct.prototype.query.call(this);

    query += ')';

    var returnConstruct = new ReturnQueryConstruct();
    returnConstruct.add(this, true);

    query += returnConstruct.query();

    return query;
};

CreateQueryConstruct.prototype.returns = function() {
    return 'n';
};

var QueryConstructBuilder = {
};

QueryConstructBuilder.build = function() {
    var constructs = Array.prototype.slice.call(arguments);
    var c = _.sortBy(constructs, function(construct) {
        return construct._priority;
    });

    var query = '';
    _.each(c, function(cn) {
        query += cn.query();
    });

    return query;
};

var MatchQueryConstruct = function() {
    QueryConstruct.call(this);

    this._matches = {};
    this._priority = 1;
};
util.inherits(MatchQueryConstruct, QueryConstruct);

MatchQueryConstruct.prototype.create = function(name) {
    this._matches[name] = {};
};

MatchQueryConstruct.prototype.addLabel = function(name, label) {
    this._matches[name].label = label;
};

MatchQueryConstruct.prototype.returns = function() {
    return _.keys(this._matches);
};

MatchQueryConstruct.prototype.query = function() {
    var _q = '';
    if (this._matches) {
        _q = 'MATCH ';
        _.each(_.keys(this._matches), _.bind(function(key, index) {
            if (index !== 0) {
                _q += ',';
            }

            _q += key;

            if (this._matches[key].label) {
                _q += ':' + this._matches[key].label;
            }

        }, this));
    }

    return _q;
};

var WhereQueryConstruct = function() {
    QueryConstruct.call(this);

    this._where = {};
};
util.inherits(WhereQueryConstruct, QueryConstruct);

WhereQueryConstruct.prototype.add = function(target, operand, value) {
    this._where[target] = this._where[target] || {};
    this._where[target][operand] = value;
};

WhereQueryConstruct.prototype.query = function() {
    var _q = '';
    if (!_.isEmpty(this._where)) {
        _q += ' WHERE ';
        _.each(_.keys(this._where), _.bind(function(key, index) {
            if (index !== 0) {
                _q += 'AND';
            }
            _.each(_.keys(this._where[key]), _.bind(function(action) {
                _q += sprintf(' %s %s "%s" ', key, action, this._where[key][action]);
            }, this));
        }, this));
    }

    return _q;
};

var ReturnQueryConstruct = function() {
    QueryConstruct.call(this);

    this._returns = [];
    this._priority = 1000;
};
util.inherits(ReturnQueryConstruct, QueryConstruct);

ReturnQueryConstruct.prototype.add = function(construct, labels) {
    if (construct.returns) {
        if (labels) {
            var returns = [];

            _.each(construct.returns(), function(r) {
                returns.push(r);
                returns.push(sprintf('labels(%s)', r));
            });

            this._returns = this._returns.concat(returns);
        } else {
            this._returns = this._returns.concat(construct.returns());
        }
    }
};

ReturnQueryConstruct.prototype.query = function() {
    var _q = ' RETURN ';
    _.each(this._returns, function(ret, index) {
        if (index !== 0) {
            _q += ',';
        }
        _q += ret;
    });

    return _q;
};

var RelationshipQueryConstruct = function() {
    QueryConstruct.call(this);

    this._relationships = [];
    this._priority = 500;
};
util.inherits(RelationshipQueryConstruct, QueryConstruct);
RelationshipQueryConstruct.prototype.add = function(node1, node2, relationship, params) {
    this._relationships.push({
        node1: node1,
        node2: node2,
        relationship: {
            name: relationship,
            params: params
        }
    });
};

RelationshipQueryConstruct.prototype.query = function() {
    var q = '';

    if (!_.isEmpty(this._relationships)) {
        _.each(this._relationships, function(relationship) {
            q += sprintf(' CREATE UNIQUE (%s)-[:%s %s]->(%s)',
                            relationship.node1,
                            relationship.relationship.name,
                            JSON.stringify(relationship.relationship.params),
                            relationship.node2);
        }, this);
    }

    return q;
};

var RelationshipMatchQueryConstruct = function() {
    QueryConstruct.call(this);

    this._relationships = [];
    this._priority = 1;
};
util.inherits(RelationshipMatchQueryConstruct, QueryConstruct);

RelationshipMatchQueryConstruct.prototype.add = function(node, relationship) {
    this._relationships.push({
        node: node,
        relationship: relationship
    });
};

RelationshipMatchQueryConstruct.prototype.query = function() {

    var q = '';
    _.each(this._relationships, function(rel) {
        q += sprintf('(n1:%s)-[:%s]->(n2:%s)', rel.node.label, rel.relationship, rel.node.label)
    }, this);


    return q;
};

RelationshipMatchQueryConstruct.prototype.returns = function() {
    if (!_.isEmpty(this._relationships)) {
        return ['n2'];
    } else {
        return [];
    }
};

var Query = function(service) {
    this._service = service;

    this._where = new WhereQueryConstruct();
    this._match = new MatchQueryConstruct();
    this._matchRelationship = new RelationshipMatchQueryConstruct();
    this._relationship = new RelationshipQueryConstruct();
};

Query.prototype.match = function(name) {
    this._match.create(name);
    return {
        label: _.bind(function(label) {
            this._match.addLabel(name, label);
            return this;
        }, this)
    }
};

Query.prototype.matchRelationship = function(node) {
    return {
        by: _.bind(function(relationship) {
            this._matchRelationship.add(node, relationship);

            return this;
        }, this)
    }
};

Query.prototype.where = function(where) {
    return {
        equals: _.bind(function(value) {
            this._where.add(where, '=', value);
            return this;
        }, this)
    }
};

Query.prototype.relate = function(node) {
    var n1 = node;
    var r = null;
    var p = null;
    return {
        by: function(relationship) {
            r = relationship;

            return this;
        },

        with: function(params) {
            p = params;

            return this;
        },

        to: _.bind(function(node2) {
            this._relationship.add(n1, node2, r, p);

            return this;
        }, this)
    }
};

Query.prototype.toString = function() {
    var returnQuery = new ReturnQueryConstruct();
    returnQuery.add(this._match, true);
    returnQuery.add(this._matchRelationship, true);
    return QueryConstructBuilder.build(this._match, this._matchRelationship, this._where, this._relationship, returnQuery);
};

Query.prototype.exec = function() {
    var defer = q.defer();
    var returnQuery = new ReturnQueryConstruct();
    returnQuery.add(this._match, true);
    returnQuery.add(this._matchRelationship, true);
    var _q = QueryConstructBuilder.build(this._match, this._matchRelationship, this._where, this._relationship, returnQuery);

    this._service.query(_q, this._params)
        .then(_.bind(function(res) {
            var data = JSON.parse(res.text);

            var nodes = [];
            _.each(data.data, function(node) {
                var n = new Node(this._service);
                n.set(node);

                nodes.push(n);
            }, this);


            defer.resolve(nodes);
        }, this));

    return defer.promise;
};

/**
 * Neo4j service
 *
 * Author:    Phong Mai
 * Timestamp: 9/13/13 2:18 PM
 */
var Neo4j = function() {
    BaseService.call(this, 'Neo4j');

    this.agent = superagent.agent();
    this.baseUrl = '';
};

util.inherits(Neo4j, BaseService);
/**
 * Initialize Neo4j
 * @param {Object} options - the options
 * @param {logger} [Logger] - the logger service
 * @returns {Q.promise}
 */
Neo4j.prototype.initialize = function(options, Logger) {
    var deferred = q.defer();

    options = options || {};
    _.defaults(options, {
        port:   7474,
        host:   'localhost'
    });

    this.baseUrl = 'http://' + options.host + ':' + options.port;

//    Logger.info('Neo4j: ' + this.baseUrl);

    deferred.resolve();

    return deferred.promise;
};
/**
 * Perform a cypher query
 *
 * @param {String} query - the query string
 * @param {Object} [params] - the params used in the query
 * @returns {Q.promise}
 */
Neo4j.prototype.query = function(query, params) {

    var deferred = q.defer();

//    params = params || {};

    var send = {
        query: query
    };

    if (params) {
        send.params = params;
    }

    this.agent
        .post(this.baseUrl + '/db/data/cypher')
        .send(send)
        .set('accept', 'application/json; charset=UTF-8')
        .set('content-type', 'application/json')
        .end(function(err, res) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(res);
            }
        });

    return deferred.promise;
};

Neo4j.prototype.flush = function() {
    return this.query('START n = node(*) MATCH n-[r?]-() WHERE ID(n)>0 DELETE n, r;');
};

module.exports = Neo4j;
module.exports.Node = Node;
module.exports.Query = Query;