require('dotenv').config({ path: './.env' })

var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: process.env.CLOUD_PORT });
//, wss = new WebSocketServer({ port: 8083 });

wss.on('connection', function connection(ws) {
    console.log("Connection Established");
    ws.on('message', function incoming(message) {
        try {
            var data = JSON.parse(message);
        } catch (error) {
            console.log('socket parse error: ' + error.data);
        }

        console.log('CLOUD Server: %s', data['json_data']);
        ws.send(JSON.stringify({
            'cmd_id': data['cmd_id'],
            'result': 'response for ' + data['json_data'].replace(/^\D+/g, '')
        }));
    });
});
