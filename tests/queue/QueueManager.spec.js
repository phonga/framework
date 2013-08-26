var expect =        require('chai').expect,
    QueueManager =  require(__dirname + '/../../src/services/QueueManager'),
    Job =           require(__dirname + '/../../src/services/QueueManager').Job,
    Logger =        require(__dirname + '/../../src/services/Logger'),
    Context =       require(__dirname + '/../../src/Context');

describe('QueueManager Test Suite', function() {
    var manager, logger;

    beforeEach(function(done) {
        logger = new Logger();
        manager = new QueueManager();
        logger.initialize({disabled: true});

        Context._services['Logger'] = logger;

        manager.initialize({queues: ['JOB', 'JOB-STATUS']}, logger)
            .then(function() {
                done();
            });
    });

    it('should get the queue by name', function() {
        var q = manager.queue('JOB');

        expect(q, 'Invalid queue object').not.to.be.null;
        expect(q, 'Invalid queue object').not.to.be.undefined;
    });

    it('should get the length of the queue', function(done) {
        var queue = manager.queue('JOB');

        var job = new Job();
        job.type = 'EVENT';

        queue.publish(job)
            .then(function(id) {

                queue.getLength()
                    .then(function(length) {
                        expect(length, 'Invalid length').to.equal(1);
                        done();
                    });
            });
    });

    it('should flush the queue', function(done) {
        var queue = manager.queue('JOB');

        var job = new Job();
        job.type = 'EVENT';

        queue.publish(job)
            .then(function(id) {

                queue.flush()
                    .then(function() {
                        return queue.getLength();
                    })
                    .then(function(length) {
                        expect(length, 'Invalid length').to.equal(0);
                        done();
                    })
                    .fail(function(err) {
                        console.log(err);
                    });
            });
    });

    describe('listeners', function() {

        it('should publish to the queue', function(done) {
            var q = manager.queue('JOB');

            var job = new Job();
            job.type = 'EVENT';

            q.publish(job)
                .then(function(id) {
                    return q.getJob(id);
                })
                .then(function(job) {
                    expect(job, 'Invalid job').not.to.be.null;
                    expect(job, 'Invalid job').not.to.be.undefined;

                    expect(job.queue, 'Invalid job queue').to.equal('JOB');
                    expect(job.status, 'Invalid job status').to.equal('pending');

                    q.publish(job)
                        .then(function(id) {
                            done();
                        });
                });
        });

        it('should listen to an event on the queue', function(done) {
            var q = manager.queue('JOB');

            var job = new Job();
            job.type = 'EVENT';

            var count = 0;
            q.on('EVENT', function(job) {
                expect(job, 'Invalid job').not.to.be.null;
                expect(job, 'Invalid job').not.to.be.undefined;

                q.completeJob(job)
                    .then(function() {
                        expect(job.status, 'Invalid status').to.equal(Job.STATUS.COMPLETED);

                        count++;
                        if (count == 2) {
                            done();
                        }
                    })
                    .fail(function(reason) {
                        console.log(reason);
                    });
            });

            q.listen();
        });

        describe('Job status update', function() {
            var queue, jobId;

            beforeEach(function(done) {
                queue = manager.queue('JOB-STATUS');

                queue.flush()
                    .then(function() {
                        var job = new Job();
                        job.type = 'EVENT';

                        queue.publish(job)
                            .then(function(id) {
                                jobId = id;
                                done();
                            });
                    });
            });

            it('should update the job status to processing', function(done) {
                queue.getJob(jobId)
                    .then(function(j) {
                        queue.processJob(j);
                        return queue.getJob(j.id);
                    })
                    .then(function(j) {
                        expect(j.status, 'Invalid job status').to.equal(Job.STATUS.PROCESSING);

                        done();
                    }
                );
            });

            it('should update the job status to completed', function(done) {
                queue.getJob(jobId)
                    .then(function(j) {
                        queue.completeJob(j)
                            .then(function() {
                                return queue.getJob(j.id);
                            })
                            .then(function(j) {
                                expect(j.status, 'Invalid job status').to.equal(Job.STATUS.COMPLETED);

                                done();
                            });
                    })
            });

            it('should update the job status to failed', function(done) {
                queue.getJob(jobId)
                    .then(function(j) {
                        queue.failJob(j)
                            .then(function() {
                                return queue.getJob(j.id);
                            })
                            .then(function(j) {
                                expect(j.status, 'Invalid job status').to.equal(Job.STATUS.FAILED);

                                done();
                            })
                            .fail(function(err) {
                                console.log(err);
                            });
                    });
            });

            it('should repush failed jobs', function(done) {
                queue.flush()
                    .then(function() {
                        return queue.repushFailedJobs();
                    })
                    .then(function() {

                        queue.getLength()
                            .then(function(length) {
                                expect(length, 'Invalid processing length').to.equal(1);
                                done();
                            })
                            .fail(function(err) {
                                console.log(err);
                            });

                    });
            });
        });
    });
});