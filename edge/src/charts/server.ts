
//var app = require('http').createServer(handler);
//var io = require('socket.io').listen(app);
//var fs = require('fs');
var sys = require('util');
var exec = require('child_process').exec;
var child;

'use strict';

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
    host: 'localhost',
    port: 8000
});
const io = require('socket.io').listen(server.listener);
server.listener.io = io;
server.io = io;



import * as myOS from "../os"
import * as mqStats from "../utils/ms_stats"
import { getCldMsgLatency } from "../ws/cloud_client"
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
                file: '../../node_modules/socket.io-client/socket.io.js'
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
            handler: function (request, reply) {
                reply.file('index.html');
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

            console.log('Server running at:', server.info.uri);
        });


        io.sockets.on('connection', function (socket) {
            setInterval(function () {
                child = exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    } else {
                        Promise.all([myOS.getCPU(), myOS.getFreeRam(), mqStats.getQueueStats('c_task1_req')]).then(values => {
                            // You must send time (X axis) and a temperature value (Y axis)
                            var date = new Date().getTime();
                            var temp = parseFloat(stdout) / 1000;
                            socket.emit('temperatureUpdate', date, temp);
                            socket.emit('cpu', date, values[0]);
                            socket.emit('freemem', date, values[1]);
                            socket.emit('messages', date, values[2]);
                            socket.emit('cld_latency', date, getCldMsgLatency());
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