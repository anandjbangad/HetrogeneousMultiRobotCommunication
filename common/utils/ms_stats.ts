import AMQPStats = require('amqp-stats');
import Debug = require('debug');
let debug = Debug('amqpStats');

var stats = new AMQPStats({
    username: "guest", // default: guest
    password: "guest", // default: guest
    hostname: "localhost:15672",  // default: localhost:55672
    protocol: "http"  // default: http
});
// stats.overview(function (err, res, data) {
//     if (err) { throw err; }
//     console.log('data: ', data);
// });
let qStats = {};

// setInterval(() => {
//     stats.getQueue('/', 'c_task1_req', function (err, res, data) {
//         if (err) { throw err; }
//         //console.log(data.message_stats.deliver_get);
//         console.log()

//     })
// }, 500);
export function startMonitoringQueueStats(queueName: string) {
    setInterval(function () {
        stats.getQueue('/', queueName, function (err, res, data) {
            if (err) { throw err; }
            qStats[queueName] = {
                "messages": data.messages,
                "messages_ready": data.messages_ready,
                "deliver_get": data.backing_queue_status.len //data.message_stats.deliver_get
            }
        })
    }, 3000);
}

export function getQueueStats(queueName: string) {
    if (typeof qStats[queueName] !== 'object') {
        debug("Queried for unknown queue");
        return {
            "messages": 0,
            "messages_ready": 0,
            "deliver_get": 0
        };
    }
    return {
        "messages": qStats[queueName].messages,
        "messages_ready": qStats[queueName].messages_ready,
        "deliver_get": qStats[queueName].deliver_get
    };
}
// stats.getNode('rabbit@sbhal-pc', function (err, res, data) {
//     if (err) { throw err; }
//     console.log('data: ', data);
// })