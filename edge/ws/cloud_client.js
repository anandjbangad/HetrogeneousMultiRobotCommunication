
var socketQueueId = 0;
var socketQueue = {};

module.exports = {
    "init": function () {
        //imported from core module
        var WebSocket = require('ws');
        var ws = new WebSocket('ws://' + process.env.CLOUD_HOST + ':' + process.env.CLOUD_PORT);
        //var ws = new WebSocket('ws://localhost:8083');
        this.ws = ws;

        ws.on('open', function open() {
            console.log("Connection Established");
            var array = new Float32Array(5);
            for (var i = 0; i < array.length; ++i) {
                array[i] = i / 2;
            }
            //ws.send(array, { binary: true, mask: true });
        });

        ws.on('message', function (message, flags) {
            // flags.binary will be set if a binary data is received.
            // flags.masked will be set if the data was masked.
            try {
                data = JSON.parse(message);
            } catch (error) {
                console.log('socket parse error: ' + data['result']);
            }

            if (typeof (data['cmd_id']) != 'undefined' && typeof (socketQueue['i_' + data['cmd_id']]) == 'function') {
                execFunc = socketQueue['i_' + data['cmd_id']];
                execFunc(data['result']);
                delete socketQueue['i_' + data['cmd_id']]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
                return;
            } else {
                socketRecieveData(e.data);
            }
        });
    },
    "cloudSendData": function (data, onReturnFunction) {
        //console.log("Cloud Send Data invoked!!!");
        socketQueueId++;
        if (typeof (onReturnFunction) == 'function') {
            // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
            socketQueue['i_' + socketQueueId] = onReturnFunction;
        }
        jsonData = JSON.stringify({ 'cmd_id': socketQueueId, 'json_data': data.msg });
        try {
            this.ws.send(jsonData);
        } catch (e) {
            console.log('Sending failed ... .disconnected failed');
        }
    }

}
function socketRecieveData(data) {
    //whatever processing you might need
    console.log('socketRecieveData');
}