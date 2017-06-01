import neigh = require("../neighbors.js");
import os = require("../os.js");
import WebSocket = require("ws");
import ipaddr = require('ipaddr.js');
import * as itf from "../../../common/interfaces.d"
import amqp = require('amqplib');

var socketQueueId: number = 0;
var socketQueue: any = {};

let cloud_ws;

export function init(globalCtx) {
  console.log("Cloud Client init!");
  //amqp.connect('amqp://' + process.env.CLOUD_HOST)
  amqp.connect('amqp://localhost')
    .then((conn) => {
      return conn.createChannel();
    })
    .then((ch) => {
      globalCtx.amqpCloud = {};
      globalCtx.amqpCloud.ch = ch;
      //var q = 'c_task1_req';
      return ch.assertQueue("c_task1_req", { durable: false });

    })
    .then((q) => {
      globalCtx.amqpCloud.reqQ = q.queue;
      // setInterval(() => {
      //   console.log("trying to send to cld");
      //   globalCtx.amqpCloud.ch.sendToQueue("c_task1_req", Buffer.from("sidd"));
      // }, 400);

      return globalCtx.amqpCloud.ch.assertQueue(process.env.UUID + '_cld', { durable: false });
    })
    .then((q) => {
      globalCtx.amqpCloud.rspQ = q.queue;
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
      return globalCtx.amqpCloud.ch.consume(globalCtx.amqpCloud.rspQ, (msg) => {
        //check correlation-id from map
        let cld_msg: itf.i_edge_rsp = JSON.parse(msg.content);
        if (
          typeof msg.properties.correlationId != "undefined" &&
          typeof socketQueue["i_" + msg.properties.correlationId] == "function"
        ) {
          let execFunc = socketQueue["i_" + msg.properties.correlationId];
          execFunc(cld_msg);
          delete socketQueue["i_" + msg.properties.correlationId]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
          return;
        } else {
          console.log("socketRecieveData", cld_msg.result);
        }
      }, { noAck: true })
    })
    .then(() => {
      //establish websocket connection
      return webSocketCloudConn(globalCtx);
    })
    .then(() => {
      globalCtx.seneca.cloudInitDone = true;
    })
    .catch((err) => {
      console.log(err);
    })
}
function webSocketCloudConn(globalCtx) {
  return new Promise(function (resolve, reject) {
    //imported from core module
    try {
      cloud_ws = new WebSocket("ws://" + process.env.CLOUD_HOST + ":" + process.env.CLOUD_PORT); //force new connection
    } catch (e) {
      console.log(e);
    }
    //var ws = new WebSocket('ws://localhost:8083');

    cloud_ws.on("open", function open() {
      console.log("Connection Established to cloud");
      //update uuid with cloud
      // var ipAddr = ipaddr.parse(this.url.split(":")[1].replace(/\//g, ''));
      // console.error("ipaddr is ", ipAddr);
      // os.setIpAddr(ipAddr);
      let json_message: itf.cld_edge_init = {
        type: "init",
        uuid: process.env.UUID,
        sessionID: process.env.sessionID
      }
      cloud_ws.send(
        JSON.stringify(json_message)
      );

      //ws.send(array, { binary: true, mask: true });
    });
    cloud_ws.onerror = function (event) {
      console.error("Error in cloud client on Edge");
    }
    cloud_ws.on("close", function close() {
      console.error("connection closed to cloud");
      //reconnect
      //setTimeout(function () { init(globalCtx) }, 5000);
    });

    cloud_ws.on("message", function (message, flags) {
      // flags.binary will be set if a binary data is received.
      // flags.masked will be set if the data was masked.
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.log("socket parse error: " + data["result"]);
      }
      if (typeof data["type"] == "undefined") {
        console.error("type field is undefined");
        return;
      }
      console.log("-->Msg Rcvd: " + data["type"]);
      switch (data["type"]) {
        case "initDone":
          var step;
          let services: string[] = [];
          for (step = 1; step <= process.env.SERVICES_SUPPORT_COUNT; step++) {
            services.push(eval("process.env.SERVICE_" + step));
          }
          registerServices(services);
          break;

        case "servicesDone":
          console.log("serviceDone ipaddr is ", data.ipAddr);
          os.setIpAddr(data.ipAddr);
          //send upto 5 neighbouring devices' uuid
          getNeighbours();
          break;
        case "getNeighboursDone":
          console.log(data["neighbors"]);
          console.log(data["ipAddr"]);
          //store neighbors list
          neigh.Neighbors.getInstance().updateNeighbors(
            data["neighbors"]
          );
          resolve(true); //resolving promise after all msg exchanges
          break;
        case "cldmsg":
          //check for other msgs
          let cld_msg: itf.i_edge_rsp = data;
          if (
            typeof cld_msg["cmd_id"] != "undefined" &&
            typeof socketQueue["i_" + cld_msg["cmd_id"]] == "function"
          ) {
            let execFunc = socketQueue["i_" + cld_msg["cmd_id"]];
            execFunc(cld_msg);
            delete socketQueue["i_" + cld_msg["cmd_id"]]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
            return;
          } else {
            console.log("socketRecieveData", cld_msg.result);
          }
          break;
        default:
          console.log("Unknown Msg type received");
      }
    });
  });
}
export function cloudSendDataAmqp(data, globalCtx, onReturnFunction) {
  //return new Promise(function (resolve, reject) {
  //console.log("Cloud Send Data invoked!!!");
  socketQueueId++;
  if (typeof onReturnFunction == "function") {
    // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
    socketQueue["i_" + socketQueueId] = onReturnFunction;
  }
  let jsonData: itf.i_edge_req = {
    type: "msg",
    cmd_id: socketQueueId,
    payload: data.payload,
    task_id: data.task_id,
    ttl: data.ttl
  };
  try {
    globalCtx.amqpCloud.ch.assertQueue(globalCtx.amqpCloud.reqQ, { durable: false });
    globalCtx.amqpCloud.ch.sendToQueue(globalCtx.amqpCloud.reqQ, Buffer.from(JSON.stringify(jsonData)),
      {
        correlationId: socketQueueId.toString(),
        replyTo: globalCtx.amqpCloud.rspQ
      });
    //globalCtx.amqpCloud.ch.sendToQueue(globalCtx.amqpCloud.reqQ, Buffer.from(JSON.stringify(jsonData)));
  } catch (e) {
    console.log("Sending failed ... .disconnected failed");
  }
  //});
}

export function cloudSendData(data, onReturnFunction) {
  return new Promise(function (resolve, reject) {
    //console.log("Cloud Send Data invoked!!!");
    socketQueueId++;
    if (typeof onReturnFunction == "function") {
      // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
      socketQueue["i_" + socketQueueId] = onReturnFunction;
    }
    let jsonData: itf.i_edge_req = {
      type: "msg",
      cmd_id: socketQueueId,
      payload: data.payload,
      task_id: data.task_id,
      ttl: data.ttl
    };
    try {
      cloud_ws.send(JSON.stringify(jsonData));
    } catch (e) {
      console.log("Sending failed ... .disconnected failed");
    }
  });
}
export function getNeighbours() {
  return new Promise(function (resolve, reject) {
    //send upto 5 neighbouring devices' uuid
    let json_message: itf.cld_edge_getNeighbors = {
      type: "getNeighbours",
      uuid: process.env.UUID,
      sessionID: process.env.sessionID,
      count: 1
    };
    cloud_ws.send(
      JSON.stringify(json_message)
    );
  });
}
export function registerServices(services) {
  return new Promise(function (resolve, reject) {
    //register ~3 services
    let json_message: itf.cld_edge_services = {
      type: "services",
      uuid: process.env.UUID,
      sessionID: process.env.sessionID,
      services: services,
      gps: {
        // lat: Math.random() * 50 + 20,
        // lon: Math.random() * 50 + 20
        lat: process.env.lat,
        lon: process.env.lon
      }
    }
    cloud_ws.send(
      JSON.stringify(json_message)
    );
  });
}

