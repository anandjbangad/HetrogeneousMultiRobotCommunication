require('dotenv').config({ path: './.env' })
const path = require('path');

//imported from core module
var WebSocket = require('ws');
var ws = new WebSocket('ws://' + process.env.EDGE_HOST + ':' + process.env.EDGE_PORT);
this.ws = ws;
var fs = fs || require('fs')
// List all files in a directory in Node.js recursively in a synchronous fashion
var counter = 15;
var delay_bw_images = 3000;
ws.on('open', function open() {
    // var filelist = walkSync(path.join(__dirname, '../dataset'), filelist, ws);
    let genObj = walkSync(path.join(__dirname, '../dataset'), ws);
    genObj.next();
    let interval = setInterval(() => {
        val = genObj.next();

        if (val.done) {
            clearInterval(interval);
        } else {
            console.log(val.value);
            fs.readFile(val.value, function (err, original_data) {
                var base64Image = original_data.toString('base64');
                ws.send(base64Image);
            });
        }
    }, delay_bw_images);
    console.log("Connection Established");
});

ws.on('message', function (data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
    console.log("Device Client: " + data);
});



var walkSync = function* (dir, ws) {

    if (dir[dir.length - 1] != '/') dir = dir.concat('/')

    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);

    for (let file of files) {
        if (fs.statSync(dir + file).isDirectory()) {
            yield* walkSync(dir + file + '/', ws);
        }
        else {
            yield (dir + file);
        }
    }
};


