//core.js

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/coreDB');
var Schema = mongoose.Schema;

var subCategory = new Schema({
    name: String,
    typeNo: Number
})

var deviceSchema = new Schema({
    deviceId: String,
    type: { type: String },
    description: String,
    createdOn: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    categories: [subCategory],
});

var Device = mongoose.model('Device', deviceSchema);
var category1 = { name: 'IOT', typeNo: 1 };
var category2 = { name: 'quadrotor', typeNo: 2 };

var fs = require('fs');
var Tesseract = require('tesseract.js')

module.exports = function core(options) {
    var seneca = this;
    //Plugin Init. Called when plugin is used for first time
    //plugin name (i.e function name or return string) and init: 'plugin name' should be same
    seneca.add({ init: 'core' }, function (msg, done) {
        // do stuff, e.g.
        console.log('connecting to db during initialization...')
        setTimeout(function () {
            console.log(' DB connected!')
            done()
        }, 1000)
    });

    this.add({ role: 'coreRequest', cmd: 'getDevicesList' }, function (msg, done) {
        Device.find({ isActive: true }, function (err, results) {
            console.log(results);
        });
        done(null, { result: 'CORE SERVICE: dev1, dev2, dev3' })
    });

    this.add({ role: 'coreRequest', cmd: 'registerDevice' }, function (msg, done) {
        console.log("msg is " + msg.isActive);
        var cats = [];
        //cats.push(category1, category2);
        if (msg.categories == "IOT")
            cats.push(category1);
        else
            cats.push(category2);
        var newDevice = new Device({
            deviceId: msg.deviceId,
            description: msg.description,
            type: msg.type,
            categories: cats//new subCategory({name: "IOT", typeNo: "1"})
        });
        newDevice.save(function (err, result) {
            if (err) throw err;
            console.log(result);
        })
        done(null, {
            id: newDevice.id,
            result: 'CORE SERVICE: new device'
        })
    });

    this.add({ role: 'coreRequest', cmd: 'deleteDevice' }, function (msg, done) {
        Device.remove({ _id: msg.id }, function (err) {
            console.log(err);
        })
        Device.findByIdAndRemove(msg.id, function (err) {
            console.log(err);
        })
        done(null, { result: 'CORE SERVICE: device deleted' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataPoint' }, function (msg, done) {
        Device.findOne({ _id: msg.id }, function (err, doc) {
            console.log(doc);
        });
        Device.findById(msg.id, function (err, doc) {
            console.log(doc);
        })
        done(null, { result: 'CORE SERVICE: device posted a datapoint' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (msg, done) {
        Device.update({ _id: msg.id }, { description: msg.description }, function (err, numberAffected, rawResponse) {
            console.log(numberAffected);
        });
        Device.findByIdAndUpdate(msg.id, { description: msg.description }, function (err, numberAffected, rawResponse) {
            console.log(numberAffected);
        });
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (msg, done) {
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });

    this.add({ role: 'coreRequest', cmd: 'getDataPoints' }, function (msg, done) {
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });
    this.add({ role: 'coreRequest', cmd: 'taskScheduler' }, function (message, done) {
        //check for tasklist and available resources
        // decide to schedule task locally or on cloud
        // if locally --> call another core service to execute task (vision)
        // if on cloud --> call remote offload core service

        //execute taks locally only
        if (++options.counter % 3 != 0) {
            //console.log("executing task locally with " + message);
            seneca.act({ role: 'coreRequest', cmd: 'visionTask' }, message, function (err, reply) { //message.msg is image/txt
                //console.log(reply.result);
                done(null, reply)
            })
        } else {
            //onCloud
            options.cloud_client.cloudSendData(message, function (result) { //message.msg is image/txt
                //console.log("Msg replied from cloud" + result);
                done(null, { result: result });
            });
        }
    });
    this.add({ role: 'coreRequest', cmd: 'visionTask' }, function (message, done) {
        //execute vision task locally
        //console.log("visionTask: " + message.msg);


        //console.log('CLOUD Server: %s', data['json_data']);
        var base64Image = message.msg;
        var decodedImage = new Buffer(base64Image, 'base64');
        //fs.writeFile('image_decoded.png', decodedImage, function (err) { });
        Tesseract.recognize(decodedImage)
            .then(txtdata => {
                console.log('Recognized Text: ', txtdata.text);
                done(null, { result: txtdata.text })
            })
            .catch(err => {
                console.log('catch: ', err);
                done(null, { result: "Error!!!" })
            })
            .finally(e => {
                //console.log('finally\n');
                //process.exit();
            });
        //done(null, { result: 'result for ' + message.msg.replace(/^\D+/g, '') }) //message.msg is image/text
    });

    return 'core';
}