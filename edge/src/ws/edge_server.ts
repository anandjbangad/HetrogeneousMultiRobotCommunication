import { Neighbors } from "../neighbors"
import * as itf from '../../../common/interfaces.d'
import * as os from '../../../common/utils/os'
import * as amqpStats from '../../../common/utils/ms_stats'
import amqp = require('amqplib');
import Debug = require('debug');
let debug = Debug('edgeServer');


let myNeighbors = Neighbors.getInstance();
let amqpLocal: any = {};
interface deviceClient {
  ipAddr: string;
  port: number;
}
let clientList: deviceClient[];
var msg_count = 0;
function onMessage(seneca, json_message) {
  console.log('---->New Msg/Req received on EDGE Server AMQP', ++msg_count);
  let message: any = JSON.parse(json_message.content);
  let msg: itf.i_edge_req;
  if (typeof (message["cmd_id"]) === "undefined") {
    msg = {
      payload: message.payload,
      cmd_id: 0,
      type: message.type,
      ttl: 1,
      task_id: message.task_id
    };
  } else {
    msg = {
      payload: message.payload,
      cmd_id: message.cmd_id,
      type: message.type,
      ttl: message.ttl,
      task_id: message.task_id
    };
  }
  seneca.act({ role: "offloadRequest", cmd: "taskScheduler" }, msg, (
    err,
    reply: itf.i_edge_rsp
  ) => {
    //console.error("got reply on edge_server..ready to send" + reply.result);
    // if future seperate internal and external rsp
    let json_message_out: itf.i_edge_rsp = {
      result: reply.result,
      type: "result",
      task_id: reply.task_id,
      ttl: reply.ttl,
      cmd_id: reply.cmd_id
    };
    if (typeof json_message.properties.replyTo !== 'undefined') {
      amqpLocal.ch.sendToQueue(json_message.properties.replyTo, Buffer.from(JSON.stringify(json_message_out)), {
        correlationId: json_message.properties.correlationId
      });
    } else {
      amqpLocal.ch.sendToQueue('d_task1_rsp', Buffer.from(JSON.stringify(json_message_out)));
    }
  });
}
export function establishRMBLocalConnection() {
  return new Promise(function (resolve, reject) {
    amqp.connect('amqp://localhost')
      .then((conn) => {
        return conn.createChannel();
      })
      .then((ch) => {
        amqpLocal.ch = ch;
        debug("RMQ local connection established");
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      })
  });
}
export function edgeStartConsuming(seneca) {
  debug("starting consuming traffic!")
  //var jwt = require("jsonwebtoken");

  //start consuming rabbitmq server
  amqpLocal.ch.assertQueue('d_task1_rsp', { durable: false })
    .then(() => {
      var q = 'd_task1_req';
      return amqpLocal.ch.assertQueue(q, { durable: false });
    }).then((q) => {
      amqpLocal.ch.consume(q.queue, (msg) => {
        //console.log(" [x] Received %s", msg.content.toString());
        onMessage(seneca, msg);
      }, { noAck: true })
    })
    .catch((err) => {
      console.log(err);
    })
};
export function startPublishingLocalTopics() {
  debug("starting publishing on local topics");
  var ex = "os_env";
  amqpLocal.ch.assertExchange(ex, 'fanout', { durable: false });
  setInterval(() => {
    let msg: itf.cld_publish_topics = {
      cpu: os.getCPUNow(),
      freemem: os.getFreeRam(),
      msgCount: amqpStats.getQueueStats('d_task1_req').messages
    }
    //ch.publish(ex, '', msg);
    amqpLocal.ch.publish(ex, '', new Buffer(JSON.stringify(msg)));
    debug("Local Topic Publish %o", msg);
  }, process.env.localTopicPublishPeriod);
}
interface NeighborNode {
  ipAddr: string;
  ws: Object;
}
var neighborList: NeighborNode[];