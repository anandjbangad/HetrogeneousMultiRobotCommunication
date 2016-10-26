require('dotenv').config({ path: './.env' })


//imported from core module
var WebSocket = require('ws');
var ws = new WebSocket('ws://' + process.env.EDGE_HOST + ':' + process.env.EDGE_PORT);
this.ws = ws;

var counter = 0;
ws.on('open', function open() {
    setInterval(function () {
        //console.log("Sending request " + counter);
        counter++;
        ws.send('Device Client: request number is ' + counter);
    }, 1000)
});

ws.on('message', function (data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
    console.log("Device Client: " + data);
});

