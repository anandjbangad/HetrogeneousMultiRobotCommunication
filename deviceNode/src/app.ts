import { config } from "dotenv";
config({ path: "./.env" });
import path = require('path');
import { task1, task2 } from "./task";

import Tesseract = require('tesseract.js')

import { Client } from 'node-rest-client';
var client = new Client();
import * as itf from "../../common/interfaces.d"
import jwt = require('jsonwebtoken');
import amqp = require('amqplib');

var globalCtx: any = {};
globalCtx.req_count = 0;
globalCtx.rsp_count = 0;
// direct way
// set content-type header and data as json in args parameter 
var args = jwt.sign({
    data: {
        uri: "hello",
        type: "IOT",
        description: "New device"
    },
    headers: { "Content-Type": "application/json" }
}, 'secret-key');
import WebSocket = require('ws');
import fs = require("fs");
// client.post("http://localhost:9081/devices", args, function (data, response) {
//     // parsed response body as js object 
//     //console.log(data);
//     // raw response 
//     //console.log(response);
//     console.log("vishu");
//     var token = data.token;


// call rest api to register Device
// upon successfull registration, store secret
// use the secret in websocket communication
// 
//console.log("token received is ", data.token);
//imported from core module
//import WebSocket = require('ws');
amqp.connect('amqp://' + process.env.EDGE_HOST)
    .then((conn) => {
        return conn.createChannel();
    })
    .then((ch) => {
        var q = 'd_task1_req';
        q = "";
        globalCtx.amqp = {};
        globalCtx.amqp.ch = ch;
        return ch.assertQueue(q, { durable: false });
    })
    .then(function (q) {
        return globalCtx.amqp.ch.assertQueue('d_task1_rsp', { durable: false });
    })
    .then((q) => {
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C");
        return globalCtx.amqp.ch.consume('d_task1_rsp', (json_message) => {
            //console.log(" [x] Received %s", msg.content.toString());
            let message: itf.e_edge_rsp = JSON.parse(json_message.content);
            console.log("Device Client:", ++globalCtx.rsp_count, "/", globalCtx.req_count, message.result);
        }, { noAck: true });
    })
    .then(() => {
        //start sending requests
        setInterval(() => {
            console.error("--Req:", globalCtx.req_count, "--Rsp:", globalCtx.rsp_count);
        }, 10000);
        //task1(ws);
        task2(globalCtx);
    })
    .catch((err) => {
        console.log(err);
    })
// var ws = new WebSocket('ws://' + process.env.EDGE_HOST + ':' + process.env.EDGE_PORT + '/client', {
//     sid: 'https://websocket.org'
// });
// this.ws = ws;
//import fs = require("fs");
// List all files in a directory in Node.js recursively in a synchronous fashion
// var counter = 15;
// var delay_bw_images = 3000;
// ws.on('open', () => {
//     setInterval(() => {
//         console.error("--Req:", globalCtx.req_count, "--Rsp:", globalCtx.rsp_count);
//     }, 10000);
//     //task1(ws);
//     task2(ws, globalCtx);
//     // //ws.send({});
//     // // var filelist = walkSync(path.join(__dirname, '../dataset'), filelist, ws);
//     // let genObj = walkSync(path.join(__dirname, '../../dataset'), ws);
//     // genObj.next();
//     // let interval = setInterval(() => {
//     //     let val = genObj.next();

//     //     if (val.done) {
//     //         clearInterval(interval);
//     //     } else {
//     //         console.log(val.value);
//     //         fs.readFile(val.value, function (err, original_data) {
//     //             var base64Image = original_data.toString('base64');
//     //             //getDecodedText(base64Image);
//     //             let json_message: itf.e_edge_req = {
//     //                 type: "devmsg",
//     //                 payload: base64Image,
//     //                 task_id: 1
//     //             };
//     //             ws.send(JSON.stringify(json_message));
//     //         });
//     //     }
//     // }, delay_bw_images);
//     // console.log("Connection Established");
// });
// function getDecodedText(decodedImage) {
//     Tesseract.recognize(Buffer.from(decodedImage, 'base64'))
//         .then(txtdata => {
//             console.log('Recognized Text: ', txtdata.text);
//         })
//         .catch(err => {
//             console.log('catch: ', err);
//         })
//         .finally(e => {
//             //console.log('finally\n');
//             //process.exit();
//         });
// }
// ws.on('message', function (json_message, flags) {
//     // flags.binary will be set if a binary data is received.
//     // flags.masked will be set if the data was masked.
//     //globalCtx.rsp_count++;
//     let message: itf.e_edge_rsp = JSON.parse(json_message);
//     console.log("Device Client:", ++globalCtx.rsp_count, "/", globalCtx.req_count, message.result);
// });



// var walkSync = function* (dir, ws) {

//     if (dir[dir.length - 1] != '/') dir = dir.concat('/')

//     var fs = fs || require('fs'),
//         files = fs.readdirSync(dir);

//     for (let file of files) {
//         if (fs.statSync(dir + file).isDirectory()) {
//             yield* walkSync(dir + file + '/', ws);
//         }
//         else {
//             yield (dir + file);
//         }
//     }
// };


//});