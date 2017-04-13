require('dotenv').config({ path: './.env' })
const path = require('path');
var fs = require('fs');
var Tesseract = require('tesseract.js')

var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: process.env.CLOUD_PORT });
var mongoose = require('mongoose');
var cloudDB = mongoose.createConnection('mongodb://localhost/cloudDB');
var Schema = mongoose.Schema;

var gpsCoordinate = new Schema({
    lat: Number,
    lon: Number
}, { _id: false });
var nodeListSchema = new Schema({

    uuid: { type: String, index: { unique: true, dropDups: true } },
    ipAddr: { type: String },
    type: { type: String },
    description: String,
    hostname: String,
    createdOn: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    neighboursUUID: [String],
    servicesSupported: [String],
    gps: gpsCoordinate
});
nodeListSchema.methods.print = function () {
    console.log("Client #" + this.uuid + " updated.");
}
//get model
var NodeList = cloudDB.model('NodeList', nodeListSchema);
//clean db
NodeList.collection.drop();

var spatialTree = require("rbush")(9, ['.lat', '.lon', '.lat', '.lon']);

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) { //message is JSON object stingified string
        try {
            var data = JSON.parse(message);
        } catch (error) {
            console.log('socket parse error: ' + error.data);
        }
        if (typeof (data['type']) == 'undefined') {
            console.error("type field is undefined");
            return;
        }
        switch (data['type']) {
            case 'init':

                //check for init msg
                if (typeof (data['uuid']) != 'undefined') {

                    NodeList.findOneAndUpdate({
                        uuid: data['uuid']
                    }, { $set: { uuid: data['uuid'] } }, { upsert: true }, function (err, doc) {
                        if (err) console.error(err);
                        console.log("Init done. Received uuid is ", data['uuid']);
                        ws.send(JSON.stringify({
                            'type': "initDone"
                        }));
                    });

                }
                break;
            case 'services':
                console.log("Updating Services");
                if (typeof (data['uuid']) != 'undefined') {
                    NodeList.findOneAndUpdate({
                        uuid: data['uuid']
                    }, {
                            $addToSet: { servicesSupported: { $each: data['services'] } },
                            $set: { gps: data['gps'] }
                        }, { upsert: false, new: true }, function (err, doc) {
                            if (err) console.error(err);
                            console.log(data['gps']);
                            spatialTree.insert(data['gps']);
                            console.log("services updated");
                            ws.send(JSON.stringify({
                                'type': "servicesDone"
                            }));
                        })
                }
                break;
            case 'getNeighbours':
                if (typeof (data['uuid']) != 'undefined') {
                    NodeList.findOne({
                        uuid: data['uuid']
                    }, function (err, doc) {
                        if (err) console.error(err);
                        console.log(doc);
                        var knn = require('rbush-knn');
                        var neighbors = knn(spatialTree, doc.gps.lat, doc.gps.lat, data['count']);
                        ws.send(JSON.stringify({
                            'type': "getNeighboursDone",
                            "neighbors": neighbors
                        }));
                        console.log("neighbours updated");
                    })

                }
                //console.log("init" + JSON.stringify(data));
                break;


            case 'msg':
                //console.log('CLOUD Server: %s', data['clientID']);
                var base64Image = data['json_data'];
                var decodedImage = new Buffer(base64Image, 'base64');
                //fs.writeFile('image_decoded.png', decodedImage, function (err) { });
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
                break;
            default:
                console.log("Unknown Msg type received");
        }
    });
});