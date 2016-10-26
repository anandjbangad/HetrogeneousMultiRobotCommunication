require('dotenv').config({ path: './.env' })
const path = require('path');

//imported from core module
var WebSocket = require('ws');
var ws = new WebSocket('ws://' + process.env.EDGE_HOST + ':' + process.env.EDGE_PORT);
this.ws = ws;

// List all files in a directory in Node.js recursively in a synchronous fashion
var counter = 15;
ws.on('open', function open() {
    walkSync(path.join(__dirname, '../dataset'), filelist, ws);
});

ws.on('message', function (data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
    console.log("Device Client: " + data);
});

var walkSync = function (dir, filelist, ws) {

    if (dir[dir.length - 1] != '/') dir = dir.concat('/')

    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist, ws);
        }
        else {
            counter = counter - 1;
            if (counter > 0) {
                console.log(dir + file);
                fs.readFile(dir + file, function (err, original_data) {
                    //fs.writeFile(dir + file, original_data, function (err) { });
                    var base64Image = original_data.toString('base64');
                    ws.send(base64Image);
                });
            }
            //filelist.push(dir+file);
        }
    });
    return filelist;
};
var filelist = {};


