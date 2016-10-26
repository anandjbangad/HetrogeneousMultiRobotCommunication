module.exports = function (seneca) {
    console.log(process.env.EDGE_PORT);
    var WebSocketServer = require('ws').Server
        , wss = new WebSocketServer({ port: process.env.EDGE_PORT });

    wss.on('connection', function connection(ws) {
        console.log("Connection Established on Edge Server");
        ws.on('message', function incoming(message) {
            console.log('EDGE Server: %s', message);
            var msg = {
                "msg": message
            }
            seneca.act({ role: 'coreRequest', cmd: 'taskScheduler' }, msg, function (err, reply) {
                console.log(reply.result);
                ws.send(reply.result);
            })
        });
    });
}