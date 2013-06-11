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

        manager.initialize({queues: ['JOB']}, logger)
            .then(function() {
                done();
            });
    });

    it('should get the queue by name', function() {
        var q = manager.queue('JOB');

        expect(q, 'Invalid queue object').not.to.be.null;
        expect(q, 'Invalid queue object').not.to.be.undefined;
    });

    describe('listeners', function(done) {

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

                    q.publish(job)
                        .then(function(id) {
                            console.log('another job');
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

                count++;
                if (count == 2) {
                    done();
                }
            });

            q.listen();
        });

        describe('Job status update', function() {
            var queue, jobId;

            beforeEach(function(done) {
                queue = manager.queue('JOB');

                var job = new Job();
                job.type = 'EVENT';

                queue.publish(job)
                    .then(function(id) {
                        jobId = id;
                        done();
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
                        queue.completeJob(j);
                        return queue.getJob(j.id);
                    })
                    .then(function(j) {
                        expect(j.status, 'Invalid job status').to.equal(Job.STATUS.COMPLETED);

                        done();
                    }
                );
            });

            it('should update the job status to failed', function(done) {
                queue.getJob(jobId)
                    .then(function(j) {
                        queue.failJob(j);
                        return queue.getJob(j.id);
                    })
                    .then(function(j) {
                        expect(j.status, 'Invalid job status').to.equal(Job.STATUS.FAILED);

                        done();
                    }
                );
            });
        });
    });
});