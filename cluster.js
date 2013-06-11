/**
 *
 *
 * Author:    Phong Mai
 * Timestamp: 6/11/13 8:21 PM
 */
var cluster =       require('cluster'),
    cpus =          require('os').cpus().length;


if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < cpus; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker) {
        console.log('Worker ' + worker.process.pid + ' died');
    });

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' online');
    });

} else {
    require('./app.js')();
}