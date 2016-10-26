require('dotenv').config({ path: './.env' })
const path = require('path');
var fs = require('fs');
var Tesseract = require('tesseract.js')

var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: process.env.CLOUD_PORT });
//, wss = new WebSocketServer({ port: 8083 });

wss.on('connection', function connection(ws) {
    console.log("Connection Established");
    ws.on('message', function incoming(message) { //message is JSON object stingified string
        try {
            var data = JSON.parse(message);
        } catch (error) {
            console.log('socket parse error: ' + error.data);
        }

        //console.log('CLOUD Server: %s', data['json_data']);
        var base64Image = data['json_data'];
        var decodedImage = new Buffer(base64Image, 'base64');
        fs.writeFile('image_decoded.png', decodedImage, function (err) { });
        Tesseract.recognize(decodedImage)
            .then(txtdata => {
                console.log('Recognized Text: ', txtdata.text);
                ws.send(JSON.stringify({
                    'cmd_id': data['cmd_id'],
                    'result': txtdata.text
                }));
            })
            .catch(err => {
                console.log('catch: ', err);
                ws.send(JSON.stringify({
                    'cmd_id': data['cmd_id'],
                    'result': "Error!!!"
                }));
            })
            .finally(e => {
                //console.log('finally\n');
                //process.exit();
            });
    });
});