import sys = require('util');
//var app = require('http').createServer(handler);
//var io = require('socket.io').listen(app);
//var fs = require('fs');

var exec = require('child_process').exec;
var child;

'use strict';
import winston = require("winston")
const Hapi = require('hapi');
const Path = require("path");

// Create a server with a host and port
const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                //relativeTo: Path.join(__dirname, 'public')
                relativeTo: __dirname
            }
        }
    }
});

server.connection({
    host: '0.0.0.0',
    port: 8000
});
const io = require('socket.io').listen(server.listener);
// server.listener.io = io;
// server.io = io;



import * as myOS from "../common/utils/os"
import * as amqpStats from "../common/utils/ms_stats"
import { getCldMsgLatency, getCldTopics } from "../ws/cloud_client"
import { noOfActiveCtx } from "../ws/edge_server"
import { getProcessedMsgCount } from "../plugins/offload/service"

// declare module "*!text" {
//     const content: string;
//     export default content;
// }
// import indexFile from "./index.html!text";

// If all goes well when you open the browser, load the index.html file
// function handler(req, res) {
//     fs.readFile(__dirname + '/index.html', function (err, data) {
//         if (err) {
//             // If no error, send an error message 500
//             console.log(err);
//             res.writeHead(500);
//             return res.end('Error loading index.html');
//         }
//         res.writeHead(200);
//         res.end(data);
//     });
// }
export function startCharting() {
    server.register(require('inert'), (err) => {

        if (err) {
            throw err;
        }

        server.route({
            method: 'GET',
            path: '/socket.io.js',
            handler: {
                file: '../../../node_modules/socket.io-client/socket.io.js'
            }
        });
        server.route({
            method: 'GET',
            path: '/styles.css',
            handler: function (request, reply) {
                reply.file('style.css');
            }
        });
        server.route({
            method: 'GET',
            path: '/',
            handler: {
                file: './index.html'
            }
        });
        server.route({
            method: 'GET',
            path: '/client.js',
            handler: function (request, reply) {
                reply.file('client.js');
            }
        });

        server.start((err) => {

            if (err) {
                throw err;
            }

            winston.info('Charting Server running at:', server.info.uri);
        });


        io.sockets.on('connection', function (socket) {
            setInterval(function () {
                child = exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    } else {
                        Promise.all([myOS.getCPU(), myOS.getFreeRam()]).then(values => {
                            var date = new Date().getTime();
                            var temp = parseFloat(stdout) / 1000;
                            socket.emit('temperatureUpdate', date, temp);
                            socket.emit('cpuMem', date, {
                                cpu: values[0],
                                freeMem: values[1]
                            });
                            socket.emit('freemem', date, values[1]);
                            //socket.emit('message', date, (typeof getCldTopics() === 'undefined') ? 0 : getCldTopics().msgCount);
                            socket.emit('activeCtx', date, {
                                edge: noOfActiveCtx(),
                                cloud: getCldTopics().activeCtx
                            });
                            socket.emit('cld_latency', date, {
                                avg10sec: getCldMsgLatency()[0],
                                avg: getCldMsgLatency()[1]
                            });
                            socket.emit('processed_msgs', date, getProcessedMsgCount());
                        })
                    }
                });
            }, 3000);
        });
    });
    // Listen on port 8000
    //app.listen(8000);
    // When we open the browser establish a connection to socket.io.
    // Every 5 seconds to send the graph a new value.


}
// Load Descriptor
// CPU jobs queue length
// CPU utilization
// Job resource requirement
// Context switch rate
// % of CPU idle time
// Amount of unfinished work at node

// Performance indexes
// Mean response time of distributed system
// Job mean execution time
// Mean job wait time
// SD of job wait time