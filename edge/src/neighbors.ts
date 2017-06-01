import ping = require('ping');
import WebSocket = require('ws');
import ipaddr = require('ipaddr.js');
import * as itf from "../../common/interfaces.d"
//import amqp = require('amqplib/callback_api');
import amqp = require('amqplib');


export class gps {
    lat: Number;
    lon: Number;
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    toString() {
        return "lat:" + this.lat + " lon:" + this.lon;
    }
}

export class Neighbor {
    gps: gps;
    ipAddr: String;
    services: String[];
    neighws: any;
    static seneca: any;
    socketQueueId: number;
    socketQueue: any;
    amqpNeigh: any;

    constructor(gps, ipAddr) {
        this.amqpNeigh = {};
        //establish rabbitmq connection
        amqp.connect('amqp://' + ipaddr.process(ipAddr))
            .then((conn) => {
                this.amqpNeigh.Conn = conn;
                return conn.createChannel();
            })
            .then((ch) => {
                this.amqpNeigh.ch = ch;
                this.amqpNeigh.reqQ = 'd_task1_req';

                return ch.assertQueue(this.amqpNeigh.reqQ, { durable: false });
            })
            .then((q) => {
                this.amqpNeigh.reqQ = q.queue;
                return this.amqpNeigh.ch.assertQueue(process.env.UUID + '_neigh', { durable: false });
            })
            .then((q) => {
                this.amqpNeigh.rspQ = q.queue;
                this.amqpNeigh.ch.consume(this.amqpNeigh.rspQ, (msg) => {
                    console.log("neigh recvd: [x] %s", msg.content.toString());
                    //check correlation-id from map
                    let neigh_msg: itf.i_edge_rsp = JSON.parse(msg.content);
                    if (
                        typeof msg.properties.correlationId != "undefined" &&
                        typeof this.socketQueue["i_" + msg.properties.correlationId] == "function"
                    ) {
                        let execFunc = this.socketQueue["i_" + msg.properties.correlationId];
                        execFunc(neigh_msg);
                        delete this.socketQueue["i_" + msg.properties.correlationId]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
                        return;
                    } else {
                        console.log("socketRecieveData", neigh_msg.result);
                    }
                }, { noAck: true });
                //pubsub
                this.amqpNeigh.exchange = {}
                this.amqpNeigh.exchange.name = "os_env";
                return this.amqpNeigh.ch.assertExchange(this.amqpNeigh.exchange.name, 'fanout', { durable: false });
            })
            .then((q) => {
                return this.amqpNeigh.ch.assertQueue('', { exclusive: true });
            })
            .then((q) => {
                this.amqpNeigh.exchange.Q = q.queue;
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                this.amqpNeigh.ch.bindQueue(q.queue, this.amqpNeigh.exchange.name, '');
            })
            .then((q) => {
                this.amqpNeigh.ch.consume(this.amqpNeigh.exchange.Q, function (msg) {
                    console.log("pubsub: [x] %s", msg.content.toString());
                }, { noAck: true });
            })
            .catch((err) => {
                console.log(err);
            });
        this.socketQueueId = 0;
        this.socketQueue = {};
        this.gps = gps;
        this.ipAddr = ipAddr;
        this.neighwsOpenHandler = this.neighwsOpenHandler.bind(this);
        //this.neighborSendData = this.neighborSendData.bind(this);
        this.neighwsMsgHandler = this.neighwsMsgHandler.bind(this);
        //check if this ipAddr is already in neighors array
        //only add neighbor if its absent in array
        //this.neighws = new WebSocket('ws://' + ipAddr + ':' + process.env.EDGE_PORT + '/edge_server');
        // this.neighws = new WebSocket('ws://' + ipaddr.process(ipAddr) + ':' + process.env.EDGE_PORT + '/edge_server');
        // //this.neighws.on('open', this.neighwsOpenHandler);
        // this.neighws.on('open', function open() {
        //     this.neighws = this;
        // });
        // this.neighws.on('message', this.neighwsMsgHandler);
    }
    createAmqpConnection(err, conn) {

    }
    neighwsOpenHandler(ipAddr) {
        //console.log("I am a edge node send msg", this.neighws.upgradeReq.url);
        //this.neighws.send('I am a edge Node');
        console.log("Connection established with edge node " + this.ipAddr);
        // this.neighborSendData(1, function () {
        //     console.log("everything done");
        // })
    }
    neighwsMsgHandler(message, flags) {
        let data: itf.i_edge_rsp = JSON.parse(message);
        // only resuts msg will be coming here
        //console.log("**Result Message received from neighbor:");
        if (
            typeof data["cmd_id"] != "undefined" &&
            typeof this.socketQueue["i_" + data["cmd_id"]] == "function"
        ) {
            let execFunc = this.socketQueue["i_" + data["cmd_id"]];
            execFunc(data);
            delete this.socketQueue["i_" + data["cmd_id"]]; // to free up memory.. and it is IMPORTANT thanks  Le Droid for the reminder
            return;
        } else {
            console.error("Error inside neighbor socket logic!!");;
        }
        //process t
        //don't offload to any other node since ttl=1 assumed

        // this.seneca.act(
        //     { role: "visionRequest", cmd: "visionTask1" },
        //     message,
        //     function (err, reply) {
        //         //message.msg is image/txt
        //         //console.log(reply.result);
        //         this.neighws.send(reply);
        //     }
        // );
    }
    toString() {
        return 'Neighbour with ' + this.gps.toString() + " " + this.ipAddr;
    }
    setServices(services) {

        this.services = services;
    }
    neighborSendDataAmqp(data: itf.i_edge_req, onReturnFunction) {
        //console.log("Neighbor Send Data invoked!!! to ");
        this.socketQueueId++;
        if (typeof onReturnFunction == "function") {
            // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
            this.socketQueue["i_" + this.socketQueueId] = onReturnFunction;
        }
        let jsonData: itf.i_edge_req = {
            type: "neighmsg",
            cmd_id: this.socketQueueId,
            payload: data.payload,
            ttl: data.ttl,
            task_id: data.task_id
        };

        try {
            this.amqpNeigh.ch.sendToQueue('d_task1_req', Buffer.from(JSON.stringify(jsonData)),
                {
                    correlationId: this.socketQueueId.toString(),
                    replyTo: this.amqpNeigh.rspQ
                });
        } catch (e) {
            console.error("Sending failed ... .disconnected failed");
        }
    }
    neighborSendData(data: itf.i_edge_req, onReturnFunction) {
        //console.log("Neighbor Send Data invoked!!! to ");
        this.socketQueueId++;
        if (typeof onReturnFunction == "function") {
            // the 'i_' prefix is a good way to force string indices, believe me you'll want that in case your server side doesn't care and mixes both like PHP might do
            this.socketQueue["i_" + this.socketQueueId] = onReturnFunction;
        }
        let jsonData: itf.i_edge_req = {
            type: "neighmsg",
            cmd_id: this.socketQueueId,
            payload: data.payload,
            ttl: data.ttl,
            task_id: data.task_id
        };

        try {
            this.amqpNeigh.ch.assertQueue(this.amqpNeigh.reqQ, { durable: false });
            this.amqpNeigh.ch.sendToQueue(this.amqpNeigh.reqQ, Buffer.from(JSON.stringify(jsonData)),
                {
                    correlationId: this.socketQueueId.toString(),
                    replyTo: this.amqpNeigh.rspQ
                });
        } catch (e) {
            console.error("Sending failed ... .disconnected failed");
        }
    }
}
export function neighbors(globalCtx) {
    Neighbor.seneca = this;
}
export class Neighbors {
    private static instance: Neighbors;
    neighbors: Neighbor[];

    private constructor() {
        this.neighbors = [];
    }

    static getInstance() {
        if (!Neighbors.instance) {
            Neighbors.instance = new Neighbors();
        }
        return Neighbors.instance;
    }
    addNeighbor(lat, lon, ipAddr: string) {
        this.neighbors.push(new Neighbor(new gps(lat, lon), ipAddr));
    }
    public getAllNeighbor(): Neighbor[] | null {
        return this.neighbors;
    }

    public updateNeighbors(updatedNeighbors) {
        updatedNeighbors.forEach(function (item, index, array) {
            if (!item.ipAddr.includes())
                this.addNeighbor(item.lat, item.lon, item.ipAddr);
        }, this);
    }
    removeNeighbor(neighbor) {
        this.neighbors.splice(this.neighbors.indexOf(neighbor), 1);
    }
    checkNeighborsNow() {
        //ping each neighbor and update lastUpdate time
        this.neighbors.forEach(function (item, index, array) {
            ping.promise.probe(this.ipAddr, { timeout: process.env.pingTimeout })
                .then(function (res) {
                    console.log(res);
                    //if res is unreachable call removeNeighbor(item)
                })
        })
    }
    getNeighbor(ipAddr: string): Neighbor | null {
        this.neighbors.forEach(function (item, index, array) {
            if (item.ipAddr === ipAddr) {
                return item;
            }
        }, this);
        return null;
    }
    public updateNeighborWs(ipAddr: string, neighws) {
        let neighbor = this.getNeighbor(ipAddr);
        if (neighbor !== null) {
            neighbor.neighws = neighws;
            //update last update time
        }
    }
    toString() {
        var str;
        this.neighbors.forEach(function (item, index, array) {
            str += item.ipAddr + " ";
        })
        return str;
    }
    startHeartbeat() {
        setInterval(this.checkNeighborsNow, process.env.peerHeartbeatInterval);
    }
}
/// <reference path="./ws/edge_server.ts" />