var Context =       require('../Context'),
    BaseService =   require(Context.__src('/services/BaseService')),
    util =          require('util'),
    q =             require('q'),
    _ =             require('underscore'),
    redis =         require('redis'),
    events =        require('events'),
    async =         require('async'),
    moment =        require('moment'),
    sprintf =       require('sprintf-js').sprintf;

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
    this.created = moment.utc().toDate();
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

    this._parallel = 5;
    this._processing = 0;
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
        Logger.info(sprintf('%s %s publisher connection connected', Logger.formatString('QUEUE'), self._queue));
        publisherDefer.resolve();
    });

    this.subscriber.on('connect', function() {
        Logger.info(sprintf('%s %s subscriber connection connected', Logger.formatString('QUEUE'), self._queue));
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
 * Set the concurrency level
 *
 * @param concurrency
 */
Queue.prototype.setConcurrency = function(concurrency) {
    this._parallel = concurrency;
};
/**
 * Publish a job on the queue
 *
 * @param {Job} job The job to publish
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
        /**
         * Get the id for the job
         *
         * @param callback
         */
        function getId(callback) {
            self.publisher.incr(self._queueId(), function(err, value) {
                job.id = value;
                callback(err);
            });
        },
        /**
         * Add the job data to the queue
         *
         * @param callback
         */
        function addQueueData(callback) {
            self.publisher.mset(Job.data(job.id), job.serialize(),
                                Job.status(job.id), Job.STATUS.PENDING,
                                function() {
                                    callback();
                                }
            );
        },
        /**
         * Add the job id to the set
         *
         * @param callback
         */
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
    if (this._listeners.length > 0) {
        this.subscriber.brpoplpush(this.getQueueName(), this._processingName(), 0, _.bind(function(err, value) {
            this.getJob(value)
                .then(_.bind(function(job) {
                    this._processing++;
                    this.emit(job.type, job);

                    if (!this._isBusy()) {
                        setImmediate(_.bind(this.listen, this));
                    }
                }, this));
        }, this));
    }
};

/**
 * Get the job detail by id
 *
 * @param {String} id The id for th ejob
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
 * Get the processing length
 *
 * @returns {Q.promise}
 */
Queue.prototype.getProcessingLength = function() {
    var defer = q.defer();

    this.publisher.llen(this._processingName(), function(err, value) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(value);
        }
    });

    return defer.promise;
};
/**
 * Get the queue length
 *
 * @returns {Q.promise}
 */
Queue.prototype.getLength = function() {
    var defer = q.defer();

    this.publisher.llen(this.getQueueName(), function(err, value) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(value);
        }
    });

    return defer.promise;
};
/**
 * Empty the queue
 *
 * @returns {Q.promise}
 */
Queue.prototype.flush = function() {
    var defer = q.defer();

    this.getLength()
        .then(_.bind(function(len) {
            this.publisher.del(this.getQueueName(), function(err) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve();
                }
            })
        }, this));

    return defer.promise;
};
/**
 * Repush failed jobs
 *
 * @returns {*}
 */
Queue.prototype.repushFailedJobs = function() {
    var defers = [];

    this.publisher.lpop(this._failedName(), _.bind(function(err, id) {
        defers.push(this.repushJob(id));
    }, this));

    return q.all(defers);
};
/**
 * Repush a job
 *
 * @param {String} id - the id for the job to push
 * @returns {Q.promise}
 */
Queue.prototype.repushJob = function(id) {
    var defer = q.defer();

    this.getJob(id)
        .then(_.bind(function(job) {

            this.updateJobStatus(job, Job.STATUS.PENDING)
                .then(_.bind(function() {
                    this.publisher.lpush(this.getQueueName(), job.id, function(err) {
                        if (err) {
                            defer.reject(err);
                        } else {
                            defer.resolve();
                        }
                    });
                }, this));
        }, this));

    return defer.promise;
};

/**
 * Set the job to completed
 *
 * @param {Job} job The job to complete
 * @returns {Q.promise}
 */
Queue.prototype.completeJob = function(job) {

    if (!this._isBusy()) {
        setImmediate(_.bind(this.listen, this));
    }

    return q.all([
        this._removeFromProcessing(job.id),
        this.updateJobStatus(job, Job.STATUS.COMPLETED)
    ]);
};

/**
 * Set the job to failed
 *
 * @param {Job} job The job to fail
 * @returns {Q.promise}
 */
Queue.prototype.failJob = function(job) {
    if (!this._isBusy()) {
        setImmediate(_.bind(this.listen, this));
    }

    return q.all([
        this._removeFromProcessing(job.id),
        this._addToFailed(job.id),
        this.updateJobStatus(job, Job.STATUS.FAILED)
    ]);
};

/**
 * Set the job to processed
 *
 * @param {Job} job The job to process
 * @returns {Q.promise}
 */
Queue.prototype.processJob = function(job) {
    return this.updateJobStatus(job, Job.STATUS.PROCESSING);
};

/**
 * Update the job status
 *
 * @param {Job} job The job to update the status for
 * @param {String} status The status to set on the job
 * @returns {Q.promise}
 */
Queue.prototype.updateJobStatus = function(job, status) {
    var defer = q.defer();

    job.status = status;
    job.updated = moment.utc().toDate();

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
 * Get the failed name
 *
 * @returns {string}
 * @private
 */
Queue.prototype._failedName = function() {
    return this.getQueueName() + ':failed';
};
/**
 * Remove from the processing list
 *
 * @param id
 * @returns {Q.promise}
 * @private
 */
Queue.prototype._removeFromProcessing = function(id) {
    var defer = q.defer();

    this.publisher.lrem(this._processingName(), 0, id,
        function() {
            defer.resolve();
        }
    );

    return defer.promise;
};
/**
 * Add to the failed list
 *
 * @param id
 * @returns {Q.promise}
 * @private
 */
Queue.prototype._addToFailed = function(id) {
    var defer = q.defer();

    this.publisher.lpush(this._failedName(), id,
        function() {
            defer.resolve();
        }
    );

    return defer.promise;
};
/**
 * Check if the queue is busy
 *
 * @returns {boolean}
 * @private
 */
Queue.prototype._isBusy = function() {
    return this._processing >= this._parallel;
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
 * @param {Object} options The options for the service
 * @param {Logger} Logger The logger service
 * @returns {*}
 */
QueueManager.prototype.initialize = function(options, Logger) {
    options = options || {};
    _.defaults(options, {queues: []});

    var defers = [];
    _.each(options.queues, function(queue) {
        var d = q.defer();
        var _q = new Queue(queue);

        Logger.info(sprintf('%s creating queue: %s', Logger.formatString('QUEUE-MANAGER'), queue));

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
 * @param {String} queue The queue name to get
 * @returns {*}
 */
QueueManager.prototype.queue = function(queue) {
    return this._queues[queue];
};

// Export the Queue Manager
module.exports = QueueManager;
// Export the Job
module.exports.Job = Job;
