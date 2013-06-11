var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    redis =         require('redis'),
    events =        require('events'),
    async =         require('async'),
    moment =        require('moment');

/**
 * Job
 *
 * Author:    Phong Mai
 * Timestamp: 6/10/13 7:17 PM
 */
var Job = function() {
    this.id = null;
    this.type = null;
    this.data = null;
    this.created = moment.utc();
    this.updated = null;
    this.status = Job.STATUS.PENDING;
    this.queue = null;
};

/**
 * Job status
 * @type {{PENDING: string, PROCESSING: string, COMPLETED: string, FAILED: string}}
 */
Job.STATUS = {
    PENDING:    'pending',
    PROCESSING: 'processing',
    COMPLETED:  'completed',
    FAILED:     'failed'
};

/**
 * Get the job name prefix
 *
 * @param id
 * @returns {string}
 */
Job.prefix = function(id) {
    return 'job:' + id;
};

/**
 * Get the job status name
 *
 * @param id
 * @returns {string}
 */
Job.status = function(id) {
    return Job.prefix(id) + ':status';
};

/**
 * Get the job data name
 *
 * @param id
 * @returns {string}
 */
Job.data = function(id) {
    return Job.prefix(id) + ':data'
};

/**
 * Get the jobs name
 *
 * @returns {string}
 */
Job.jobs = function() {
    return 'jobs';
};

/**
 * Conver the job object to a json string
 *
 * @returns {*}
 */
Job.prototype.serialize = function() {
    return JSON.stringify(this);
};

/**
 * Convert a json string to a job object
 *
 * @param json
 */
Job.prototype.deserialize = function(json) {
    var obj = JSON.parse(json);
    _.extend(this, obj);
};

/**
 * Queue class
 *
 * @param queue
 * @constructor
 */
var Queue = function(queue) {

    this.publisher = null;
    this.subscriber = null;

    this._listeners = [];
    this._queue = queue;
};

util.inherits(Queue, events.EventEmitter);

/**
 * Initialize the queue
 *
 * @param options
 * @param Logger
 * @returns {*}
 */
Queue.prototype.initialize = function(options, Logger) {

    this.on('newListener', _.bind(function(evt, listener) {
        if (_.contains(this._listeners, evt)) {
            this.removeListener(evt, listener);
        } else {
            this._listeners.push(evt);
        }
    }, this));

    options = options || {};

    _.defaults(options, {
        host:   '127.0.0.1',
        port:   6379
    });

    var publisherDefer = q.defer();
    var subscriberDefer = q.defer();

    this.publisher = redis.createClient(options.port, options.host);
    this.subscriber = redis.createClient(options.port, options.host);

    var self = this;
    this.publisher.on('connect', function() {
        Logger.info('Queue: ' + self._queue +  ' publisher connection connected');
        publisherDefer.resolve();
    });

    this.subscriber.on('connect', function() {
        Logger.info('Queue: ' + self._queue + ' subscriber connection connected');
        subscriberDefer.resolve();
    });

    return q.all([publisherDefer, subscriberDefer]);
};

/**
 * Get the queue name
 *
 * @returns {string}
 */
Queue.prototype.getQueueName = function() {
    return 'queue:' + this._queue;
};

/**
 * Publish a job on the queue
 *
 * @param job
 * @returns {Q.promise}
 */
Queue.prototype.publish = function(job) {
    if (!(job instanceof Job)) {
        throw new Error('job must be an instance of Job');
    }

    var defer = q.defer();

    job.queue = this._queue;
    var time = moment.utc().valueOf();
    var self = this;
    async.waterfall([
        function getId(callback) {
            self.publisher.incr(self._queueId(), function(err, value) {
                job.id = value;
                callback(null);
            });
        },
        function addQueueData(callback) {
            self.publisher.mset(Job.data(job.id), job.serialize(),
                                Job.status(job.id), Job.STATUS.PENDING,
                                function() {
                                    callback();
                                }
            );
        },
        function addToSet(callback) {
            self.publisher.zadd(Job.jobs(), time, job.id, callback);
        }
    ], function(err) {
        if (!err) {
            self.publisher.lpush(self.getQueueName(), job.id);
            defer.resolve(job.id);
        } else {
            defer.reject(err);
        }
    });

    return defer.promise;
};

/**
 * Start listening on the queue for the event
 */
Queue.prototype.listen = function() {
    this.subscriber.brpoplpush(this.getQueueName(), this._processingName(), 0, _.bind(function(err, value) {
        this.getJob(value)
            .then(_.bind(function(job) {
                this.emit(job.type, job);
                setImmediate(_.bind(this.listen, this));
            }, this));
    }, this));
};

/**
 * Get the job detail by id
 *
 * @param id
 * @returns {Q.promise}
 */
Queue.prototype.getJob = function(id) {
    var defer = q.defer();

    this.publisher.mget(Job.data(id),
                        Job.status(id),
                        function(err, values) {
                            if (err) {
                                defer.reject(err);
                            } else {
                                var job = new Job();
                                job.deserialize(values[0]);

                                defer.resolve(job);
                            }
                        });

    return defer.promise;
};

/**
 * Set the job to completed
 *
 * @param job
 * @returns {Q.promise}
 */
Queue.prototype.completeJob = function(job) {
    return this.updateJobStatus(job, Job.STATUS.COMPLETED);
};

/**
 * Set the job to failed
 *
 * @param job
 * @returns {Q.promise}
 */
Queue.prototype.failJob = function(job) {
    return this.updateJobStatus(job, Job.STATUS.FAILED);
};

/**
 * Set the job to processed
 *
 * @param job
 * @returns {Q.promise}
 */
Queue.prototype.processJob = function(job) {
    return this.updateJobStatus(job, Job.STATUS.PROCESSING);
};

/**
 * Update the job status
 *
 * @param job
 * @param status
 * @returns {Q.promise}
 */
Queue.prototype.updateJobStatus = function(job, status) {
    var defer = q.defer();

    job.status = status;
    job.updated = moment.utc();

    this.publisher.mset(Job.data(job.id), job.serialize(),
        Job.status(job.id), status,
        function() {
            defer.resolve();
        }
    );

    return defer.promise;
};

/**
 * Get the queue id name
 *
 * @returns {string}
 * @private
 */
Queue.prototype._queueId = function() {
    return 'queues:id';
};

/**
 * Get the processing name
 *
 * @returns {string}
 * @private
 */
Queue.prototype._processingName = function() {
    return this.getQueueName() + ':processing';
};

/**
 * Queue Manager Service
 *
 * @constructor
 */
var QueueManager = function() {
    BaseService.call(this, 'QueueManager');
    this._queues = {};
};

util.inherits(QueueManager, BaseService);

/**
 * Initialize the QueueManager
 *
 * @param options
 * @param Logger
 * @returns {*}
 */
QueueManager.prototype.initialize = function(options, Logger) {
    options = options || {};
    _.defaults(options, {queues: []});

    var defers = [];
    _.each(options.queues, function(queue) {
        var d = q.defer();
        var _q = new Queue(queue);

        Logger.info('QueueManager - creating queue: ' + queue);

        var self = this;
        Context.invoke(_q.initialize, {options: options}, _q)
            .then(function() {
                self._queues[queue] = _q;
                d.resolve();
            });
    }, this);

    return q.all(defers);
};

/**
 * Get the Queue by name
 *
 * @param queue
 * @returns {*}
 */
QueueManager.prototype.queue = function(queue) {
    return this._queues[queue];
};

// Export the Queue Manager
module.exports = QueueManager;
// Export the Job
module.exports.Job = Job;
