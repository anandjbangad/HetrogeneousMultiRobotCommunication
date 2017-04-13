
var socketQueueId = 0;
var socketQueue = {};
function init() {
    return new Promise(function (resolve, reject) {
        //imported from core module
        var WebSocket = require('ws');
        var ws = new WebSocket('ws://' + process.env.CLOUD_HOST + ':' + process.env.CLOUD_PORT);
        //var ws = new WebSocket('ws://localhost:8083');
        this.ws = ws;

        ws.on('open', function open() {
            console.log("Connection Established to cloud");
            //update uuid with cloud
            ws.send(JSON.stringify({
                'type': "init",
                'uuid': process.env.UUID,
                "date": Date.now()
            }));
            resolve();
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
            if (typeof (data['type']) == 'undefined') {
                console.error("type field is undefined");
                return;
            }
            switch (data['type']) {
                case 'initDone':
                    var step, services = [];
                    for (step = 1; step <= process.env.SERVICES_SUPPORT_COUNT; step++) {
                        services.push(eval("process.env.SERVICE_" + step));
                    }
                    module.exports.registerServices(services);
                    break;

                case 'servicesDone':
                    //send upto 5 neighbouring devices' uuid
                    module.exports.getNeighbours();
                    break;
                case 'getNeighboursDone':
                    console.log(data['neighbors']);
                    //store neighbors list
                    require("./neighbors.js").neighbors.updateNeighbors(data['neighbors']);
                    break;
                case 'msg':
                    //check for other msgs
                    if (typeof (data['cmd_id']) != 'undefined' && typeof (socketQueue['i_' + data['cmd_id']]) == 'function') {
                        execFunc = socketQueue['i_' + data['cmd_id']];
                        execFunc(data['result']);
                        delete socketQueue['i_' + data['cmd_id']]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
                        return;
                    } else {
                        socketRecieveData(e.data);
                    }
                    break;
                default:
                    console.log("Unknown Msg type received");
            }
        });
    });
}
function cloudSendData(data, onReturnFunction) {
    return new Promise(function (resolve, reject) {
        //console.log("Cloud Send Data invoked!!!");
        socketQueueId++;
        if (typeof (onReturnFunction) == 'function') {
            // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
            socketQueue['i_' + socketQueueId] = onReturnFunction;
        }
        jsonData = JSON.stringify({
            'type': "msg",
            'cmd_id': socketQueueId,
            'json_data': data.msg,
            'uuid': 1,
            "date": Date.now()
        });
        try {
            this.ws.send(jsonData);
        } catch (e) {
            console.log('Sending failed ... .disconnected failed');
        }
    });
}
function getNeighbours() {
    return new Promise(function (resolve, reject) {
        //send upto 5 neighbouring devices' uuid
        this.ws.send(JSON.stringify({
            'type': "getNeighbours",
            'uuid': process.env.UUID,
            "count": 5
        }));
    });
}
function registerServices(services) {
    return new Promise(function (resolve, reject) {//register ~3 services
        ws.send(JSON.stringify({
            'type': "services",
            'uuid': process.env.UUID,
            "services": services,
            "gps": {
                "lat": process.env.lat,
                "lon": process.env.lon
            }
        }));
    });
}
module.exports = {
    "init": init,
    "cloudSendData": cloudSendData,
    "getNeighbours": getNeighbours,
    "registerServices": registerServices
}
function socketRecieveData(data) {
    //whatever processing you might need
    console.log('socketRecieveData');
}