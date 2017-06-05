import AMQPStats = require('amqp-stats');

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

setInterval(() => {
    stats.getQueue('/', 'c_task1_req', function (err, res, data) {
        if (err) { throw err; }
        //console.log(data.message_stats.deliver_get);
        console.log()

    })
}, 500);
export function getQueueStats(queueName: string) {
    return new Promise((resolve, reject) => {
        stats.getQueue('/', 'c_task1_req', function (err, res, data) {
            if (err) { throw err; }
            resolve({
                "messages": data.messages,
                "messages_ready": data.messages_ready,
                "deliver_get": data.message_stats.deliver_get
            });
        })
    });
}
// stats.getNode('rabbit@sbhal-pc', function (err, res, data) {
//     if (err) { throw err; }
//     console.log('data: ', data);
// })