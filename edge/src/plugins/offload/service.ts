//offload.js

import { Device, NodeList } from "../../storage.js";
import os = require("../../os.js");

import { cpuPercent, freeMem } from "../../os.js";
import { cloudSendData } from "../../ws/cloud_client.js";
import fs = require("fs");
import neigh = require("../../neighbors.js");
import Tesseract = require("tesseract.js");
import * as itf from "../../../../common/interfaces.d"
//define array to store neighbors
export function offload(globalCtx) {
  var seneca = this;
  //Plugin Init. Called when plugin is used for first time
  //plugin name (i.e function name or return string) and init: 'plugin name' should be same
  seneca.add({ init: "offload" }, function (msg, done) {
    // do stuff, e.g.
    console.log("connecting to db during initialization...");
    setTimeout(function () {
      console.log(" DB connected!");
      done();
    }, 1000);
  });

  this.add({ role: "offloadRequest", cmd: "getDevicesList" }, function (msg, done) {
    Device.find({ isActive: true }, function (err, results) {
      console.log(results);
    });
    done(null, { result: "offload SERVICE: dev1, dev2, dev3" });
  });

  this.add({ role: "offloadRequest", cmd: "registerDevice" }, function (msg, done) {
    console.log("msg is " + msg.isActive);
    var cats = [];
    //cats.push(category1, category2);
    if (msg.categories == "IOT") console.log("new device registered");
    else console.log("error");
    var newDevice = new Device({
      deviceId: msg.deviceId,
      description: msg.description,
      type: msg.type,
      categories: cats //new subCategory({name: "IOT", typeNo: "1"})
    });
    newDevice.save(function (err, result) {
      if (err) throw err;
      console.log(result);
    });
    done(null, {
      id: newDevice.id,
      result: "offload SERVICE: new device"
    });
  });

  this.add({ role: "offloadRequest", cmd: "deleteDevice" }, function (msg, done) {
    Device.remove({ _id: msg.id }, function (err) {
      console.log(err);
    });
    Device.findByIdAndRemove(msg.id, function (err) {
      console.log(err);
    });
    done(null, { result: "offload SERVICE: device deleted" });
  });

  this.add({ role: "offloadRequest", cmd: "postDataPoint" }, function (msg, done) {
    Device.findOne({ _id: msg.id }, function (err, doc) {
      console.log(doc);
    });
    Device.findById(msg.id, function (err, doc) {
      console.log(doc);
    });
    done(null, { result: "offload SERVICE: device posted a datapoint" });
  });

  this.add({ role: "offloadRequest", cmd: "postDataToDevice" }, function (
    msg,
    done
  ) {
    Device.update({ _id: msg.id }, { description: msg.description }, function (
      err,
      numberAffected,
      rawResponse
    ) {
      console.log(numberAffected);
    });
    Device.findByIdAndUpdate(msg.id, { description: msg.description }, function (
      err,
      numberAffected,
      rawResponse
    ) {
      console.log(numberAffected);
    });
    done(null, { result: "offload SERVICE: data to device through MQTT or WS" });
  });

  this.add({ role: "offloadRequest", cmd: "getInfo" }, function (msg, done) {
    console.log("getInfo offload request reached");
    var result;
    NodeList.findOne({ uuid: process.env.uuid }, function (err, doc) {
      if (err) console.error(err);
      result = {
        ipAddr: doc.ipAddr,
        services: doc.services,
        cpu: cpuPercent,
        mem: freeMem
      };
    });
    done(null, result);
  });

  this.add({ role: "offloadRequest", cmd: "getDataPoints" }, function (msg, done) {
    done(null, { result: "offload SERVICE: data to device through MQTT or WS" });
  });
  this.add({ role: "offloadRequest", cmd: "taskScheduler" }, function (
    message: itf.i_edge_req,
    done
  ) {
    //check for tasklist and available resources
    // decide to schedule task locally or on cloud
    // if locally --> call another offload service to execute task (vision)
    // if on cloud --> call remote offload offload service

    //execute taks locally only
    let num: number = 0;
    if (message.ttl == 0) {
      num = 1;
    }
    message.ttl = message.ttl - 1;
    switch (num) {
      //    switch (++options.counter % 3) { 
      case 0:
        console.log("Msg Rcvd: offload to neighbor");
        message.payload = message.payload + ' E(' + os.getIpAddr().split(".")[3] + ')';


        console.log(neigh.Neighbors.getInstance().getAllNeighbor()[0].ipAddr);
        //neigh.Neighbors.getInstance().getAllNeighbor()[0].test();
        //correct ctx in neighborsenddata since called from neighbor class
        for (let curNeigh of neigh.Neighbors.getInstance().getAllNeighbor()) {
          curNeigh.neighborSendData(message, function (result: itf.i_edge_rsp) {
            done(null, result);
          });
        }
        // if (typeof neigh.Neighbors.getInstance().getAllNeighbor() !== null) {
        //   neigh.Neighbors.getInstance().getAllNeighbor()[0].neighborSendData(message, function (result: itf.i_edge_rsp) {
        //     //result is without command id
        //     console.error("result is --> ", result);
        //     done(null, result);
        //   });
        // }
        break;
      // case 0:
      case 1:
        console.log("Msg Rcvd: no offload");
        //console.log("executing task locally with " + message);
        // seneca.act({ role: 'offloadRequest', cmd: 'visionTask' }, message, function (err, reply) { //message.msg is image/txt
        //     //console.log(reply.result);
        //     done(null, reply)
        // })
        //if queue is empty, run the task now otherwise enque in queue
        seneca.act(
          { role: "visionRequest", cmd: "Task3" },
          message,
          function (err, reply: itf.i_edge_rsp) {
            done(null, reply);
          }
        );
        break;
      case 2:
        console.log("Msg Rcvd: offload to cloud");
        //onCloud
        //if(options.globalCtx.isCloudAlive === true){}
        cloudSendData(message, function (result: itf.i_edge_rsp) {
          //console.log("Msg replied from cloud" + result);
          done(null, result);
        });
        break;
    }
  });

  return "offload";
};
