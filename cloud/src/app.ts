import { config } from "dotenv";
config({ path: "./.env" });
import fs = require("fs");
import Tesseract = require("tesseract.js");
import rbush = require("rbush");
import knn = require("rbush-knn");
import * as itf from "../../common/interfaces.d"
import { Task3, visionTask1 } from "./task"
import amqp = require('amqplib');


import { Server as WebSocketServer } from "ws";
let wss = new WebSocketServer({ port: process.env.CLOUD_PORT });
import mongoose = require("mongoose");
var cloudDB = mongoose.createConnection("mongodb://localhost/cloudDB");
var Schema = mongoose.Schema;

var gpsCoordinate = new Schema(
  {
    lat: Number,
    lon: Number
  },
  { _id: false }
);
var nodeListSchema = new Schema({
  uuid: { type: String, index: { unique: true, dropDups: true } },
  sessionID: { type: Number },
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
};
//get model
var NodeList = cloudDB.model("NodeList", nodeListSchema);
//clean db
//NodeList.collection.drop();
// NodeList.remove({}, function () {
//   console.log("Nodelist db cleaned");
// });

function getRemoteIPInfoOnServer(ws) {
  return {
    remoteIP: ws.upgradeReq.connection.remoteAddress,
    family: ws._socket._peername.family,
    port: ws._socket._peername.port
  };
};
var spatialTree = rbush(9, [".lat", ".lon", ".lat", ".lon"]);

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 10000);
let amqpCloud: any = {};

amqp.connect('amqp://localhost')
  .then((conn) => {
    return conn.createChannel();
  })
  .then((ch) => {
    amqpCloud.ch = ch;
    var q = 'c_task1_req';
    ch.assertQueue(q, { durable: false });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, (msg) => {
      console.log(" [x] Received %s", msg.content.toString());
      ch.assertQueue(msg.properties.replyTo, { durable: false });
      console.log("reply to ", msg.properties.replyTo);

      let message: itf.i_edge_req = JSON.parse(msg.content);
      Task3(message)
        .then((edge_rsp: itf.i_edge_rsp) => {
          ch.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(edge_rsp)), { correlationId: msg.properties.correlationId });
        });
    }, { noAck: true });
  })
  .then(() => {
    //pubsub
    var ex = "os_env_cloud";
    var msg = "this is testing in cloud";
    amqpCloud.ch.assertExchange(ex, 'fanout', { durable: false });
    setInterval(() => {
      amqpCloud.ch.publish(ex, '', new Buffer(msg));
      console.log(" [x] Sent from Cloud %s", msg);
    }, 1500);
  })
  .catch((err) => {
    console.log(err);
  })

wss.on("connection", function connection(ws) {
  console.log("\n\nsomeone trying to connect from " + JSON.stringify(getRemoteIPInfoOnServer(ws)));
  ws.isAlive = true;
  ws.on('pong', function () {
    this.isAlive = true;
  });
  ws.on("message", function incoming(message) {
    //message is JSON object stingified string

    try {
      var data = JSON.parse(message);
    } catch (error) {
      console.log("socket parse error: " + error.data);
    }
    if (typeof data["type"] == "undefined") {
      console.error("type field is undefined");
      return;
    }
    // NodeList.findOne(
    //   {
    //     uuid: data["uuid"]
    //   },
    //   function (err, doc) {
    //     if (typeof data["sessionID"] != doc.sessionID) {
    //       console.error("type field is undefined");
    //       return;
    //     }
    //   });

    console.log("-->Msg Rcvd:", data["type"]);
    switch (data["type"]) {
      case "init":
        //check for init msg
        if (typeof data["uuid"] != "undefined") {
          NodeList.findOneAndUpdate(
            {
              uuid: data["uuid"]
            },
            { $set: { uuid: data["uuid"], sessionID: data["sessionID"], ipAddr: ws.upgradeReq.connection.remoteAddress } },
            { upsert: true },
            function (err, doc) {
              if (err) console.error(err);
              console.log("Init done. Received uuid is ", data["uuid"]);
              ws.send(
                JSON.stringify({
                  type: "initDone"
                })
              );
            }
          );
        }
        break;
      case "services":
        console.log("Updating Services");
        if (typeof data["uuid"] != "undefined") {
          NodeList.findOneAndUpdate(
            {
              uuid: data["uuid"]
            },
            {
              $addToSet: { servicesSupported: { $each: data["services"] } },
              $set: { gps: data["gps"] }
            },
            { upsert: false, new: true },
            function (err, doc) {
              if (err) console.error(err);
              console.log(data["gps"]);
              //spatialTree.insert(data["gps"]);
              spatialTree.insert({
                minX: data["gps"].lat,
                minY: data["gps"].lon,
                maxX: data["gps"].lat,
                maxY: data["gps"].lon,
                ipAddr: doc.ipAddr
              });
              console.log("services updated");
              //wait for 5sec time so that other nodes also register them with cloud
              setTimeout(() => {
                ws.send(JSON.stringify({
                  type: "servicesDone",
                  ipAddr: doc.ipAddr
                }));
              }, 5000);

            }
          );
        }
        break;
      case "getNeighbours":
        if (typeof data["uuid"] != "undefined") {
          NodeList.findOne(
            {
              uuid: data["uuid"]
            },
            function (err, doc) {
              if (err) console.error(err);
              console.log(doc);

              var neighbors = knn(
                spatialTree,
                doc.gps.lat,
                doc.gps.lat,
                data["count"], (item) => {
                  return item.ipAddr !== doc.ipAddr;
                }
              );
              console.log(neighbors);
              ws.send(
                JSON.stringify({
                  type: "getNeighboursDone",
                  neighbors: neighbors,
                  ipAddr: doc.ipAddr
                })
              );
              console.log("neighbours updated");
            }
          );
        }
        //console.log("init" + JSON.stringify(data));
        break;
      case "msg":
        let message: itf.i_edge_req = data;
        Task3(message)
          .then((edge_rsp: itf.i_edge_rsp) => {
            ws.send(JSON.stringify(edge_rsp));
          });
        break;
      // case "msg":
      //   //console.log('CLOUD Server: %s', data['clientID']);
      //   let message: itf.i_edge_req = data;
      //   var base64Image = message["payload"];
      //   var decodedImage = new Buffer(base64Image, "base64");
      //   //fs.writeFile('image_decoded.png', decodedImage, function (err) { });
      //   Tesseract.recognize(decodedImage)
      //     .then(txtdata => {
      //       console.log("Recognized Text: ", txtdata.text);
      //       ws.send(
      //         JSON.stringify({
      //           cmd_id: message["cmd_id"],
      //           result: txtdata.text,
      //           type: "cldmsg",
      //           task_id: message.task_id,
      //           ttl: message.ttl - 1
      //         })
      //       );
      //     })
      //     .catch(err => {
      //       console.log("catch: ", err);
      //       ws.send(
      //         JSON.stringify({
      //           cmd_id: message.cmd_id,
      //           result: "Error",
      //           type: "cldmsg",
      //           task_id: message.task_id,
      //           ttl: 0
      //         })
      //       );
      //     })
      //     .finally(e => {
      //       //console.log('finally\n');
      //       //process.exit();
      //     });
      //   break;
      default:
        console.log("Unknown Msg type received");
    }
  });
});

setInterval(function () {

}, 2000);
