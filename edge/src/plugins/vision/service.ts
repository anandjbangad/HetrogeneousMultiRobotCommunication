import fs = require('fs');
import Tesseract = require('tesseract.js')
import os = require("../../os.js");
import * as itf from "../../../../common/interfaces.d"

export function vision(globalCtx) {
    var seneca = this;
    //Plugin Init. Called when plugin is used for first time
    //plugin name (i.e function name or return string) and init: 'plugin name' should be same
    seneca.add({ init: 'vision' }, function (msg, done) {
        // do stuff, e.g.
        console.log('connecting to db during initialization...')
        setTimeout(function () {
            console.log(' vision api init done!')
            done()
        }, 1000)
    });

    this.add({ role: 'visionRequest', cmd: 'visionTask1' }, function (message, done) {
        //execute vision task locally
        //console.log("visionTask: " + message.msg);
        console.log("vision Request test............");

        //console.log('CLOUD Server: %s', data['json_data']);
        var base64Image = message.payload;
        var decodedImage = new Buffer(base64Image, 'base64');
        //fs.writeFile('image_decoded.png', decodedImage, function (err) { });
        Tesseract.recognize(decodedImage)
            .then(txtdata => {
                console.log('Recognized Text: ', txtdata.text);
                done(null, {
                    result: txtdata.text
                    //cmd_id: message.cmd_id
                })
            })
            .catch(err => {
                console.log('catch: ', err);
                done(null, {
                    result: "Error!!!"
                    //cmd_id: message.cmd_id
                })
            })
            .finally(e => {
                //console.log('finally\n');
                //process.exit();
            });
        //done(null, { result: 'result for ' + message.msg.replace(/^\D+/g, '') }) //message.msg is image/text
    });
    this.add({ role: 'visionRequest', cmd: 'visionTask2' }, function (message: itf.i_edge_req, done) {
        //execute vision task locally
        //console.log("visionTask: " + message.msg);
        console.log("vision Request test 2222............");
        let rsp: itf.i_edge_rsp = {
            type: message.type,
            result: "dummy task",
            cmd_id: message.cmd_id,
            task_id: message.task_id,
            ttl: message.ttl //ttl already decremented in offload module
        }
        done(null, rsp)
    });
    this.add({ role: 'visionRequest', cmd: 'Task3' }, function (message: itf.i_edge_req, done) {
        let rsp: itf.i_edge_rsp = {
            type: message.type,
            result: message.payload + ' E(' + os.getIpAddr().split(".")[3] + ')',
            // result: message.payload + ' E',
            cmd_id: message.cmd_id,
            task_id: message.task_id,
            ttl: message.ttl   //ttl already reduces in offload module
        }
        done(null, rsp)
    });
    return 'vision';
}