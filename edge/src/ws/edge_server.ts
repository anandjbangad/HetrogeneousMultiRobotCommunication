import { Neighbors } from "../neighbors"
import * as itf from '../../../common/interfaces.d'
let myNeighbors = Neighbors.getInstance();
interface deviceClient {
  ipAddr: string;
  port: number;
}
let clientList: deviceClient[];
export function edge_server(seneca) {
  console.log("Edge port is " + process.env.EDGE_PORT);
  var jwt = require("jsonwebtoken");
  var WebSocketServer = require("ws").Server,
    wss = new WebSocketServer({
      port: process.env.EDGE_PORT
    });

  wss.on("connection", function connection(ws) {
    //console.log(ws.upgradeReq.url);
    switch (ws.upgradeReq.url.split("/").slice(-1)[0]) {
      case 'client':
        process.stdout.write("Client Connected");
        //check if client exist in clientList then only push new client
        //clientList.push({ ipAddr: ws._socket.remoteAddress, port: ws._socket.remotePort })
        break;
      case 'edge_server':
        process.stdout.write("Server Connected");
        //update ws of ipAddr neighbor
        //Neighbors.getInstance().updateNeighborWs(ws._socket.remoteAddress, ws);
        break;
      default:
        console.error("Unknow entity connected to edge server");
    }
    console.log(" from ", ws.upgradeReq.url.split("/").slice(1)[0], ws._socket.remotePort);
    ws.on("message", function incoming(json_message) {

      console.log('---->New Msg/Req received on EDGE Server');
      let message: any = JSON.parse(json_message);
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
      seneca.act({ role: "offloadRequest", cmd: "taskScheduler" }, msg, function (
        err,
        reply: itf.i_edge_rsp
      ) {
        //console.error("got reply on edge_server..ready to send" + reply.result);
        // if future seperate internal and external rsp
        let json_message: itf.i_edge_rsp = {
          result: reply.result,
          type: "result",
          task_id: reply.task_id,
          ttl: reply.ttl,
          cmd_id: reply.cmd_id
        };
        ws.send(JSON.stringify(json_message));
      });
    });
  });
};
interface NeighborNode {
  ipAddr: string;
  ws: Object;
}
var neighborList: NeighborNode[];