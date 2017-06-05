const path = require('path');
// console.log(path.join(__dirname, '../.env'));
// const replace = require('replace-in-file');
// const options = {
//   files: path.join(__dirname, '../.env'),
//   from: [/^lat.*\n/gm,
//     /^lon.*\n/gm,
//     //    /^EDGE_PORT.*\n/gm,
//     /^sessionID.*\n/gm
//   ],
//   to: ['lat=' + (Math.random() * 10 + 20) + '\n',
//   'lon=' + (Math.random() * 10 + 20) + '\n',
//   //  'EDGE_PORT=' + Math.floor(Math.random() * 30 + 9082) + '\n',
//   'sessionID=' + Math.floor(Math.random() * 1000) + '\n'
//   ],
//   allowEmptyPaths: false,
//   encoding: 'utf8',
// };
// try {
//   let changedFiles = replace.sync(options);
//   console.log('Modified files:', changedFiles.join(', '));
// }
// catch (error) {
//   console.error('Error occurred:', error);
// }

import { config } from "dotenv";
//config({ path: "../.env" });
config({ path: path.join(__dirname, '../.env') });

//const easyMonitor = require("easy-monitor");
//easyMonitor("edgeNode");

if (!process.env.UUID) {
  process.env.UUID = require("uuid/v4")();
  console.log("New UUID for edge is " + process.env.UUID);
}

import { cleandb } from "./storage.js";
cleandb();
import { startMonitoring } from "./os.js";
startMonitoring();
import { startCharting } from "./charts/server"

import mdns = require("mdns");
import Chairo = require("chairo");
import Hapi = require("hapi");
import { edge_init } from "./ws/edge_server.js"

//import rest_routes = require("./api.js");

const server = new Hapi.Server();
server.connection({
  host: process.env.REST_HOST,
  port: process.env.REST_PORT
});
import { startAnnouncements } from "./mDNS.js";
import rest_service = require("./plugins/rest/service.js");
import core_service = require("./plugins/core/service.js");
import offload_service = require("./plugins/offload/service.js");
import rest_api = require('./plugins/rest/api.js');
import vision_api = require('./plugins/vision/api.js');
import vision_service = require("./plugins/vision/service.js");
import neighbor_service = require("./neighbors.js");
import cloud_client = require("./ws/cloud_client.js"); //executing constructor

var globalCtx: any = {};

// Register plugin
server.register({ register: Chairo }, function (err) {
  // Add a Seneca action

  let id = 0;
  server.seneca.add({ generate: "id" }, function (message, next) {

    return next(null, { id: ++id });
  });

  // Invoke a Seneca action

  server.seneca.act({ generate: "id" }, function (err, result) {
    // result: { id: 1 }
  });

  //var edge_server = require("./ws/edge_server.js").edge_init(server.seneca); //executing constructor

  // Register all microservices plugins with seneca object
  server.seneca.use(rest_service.rest, {});
  globalCtx.counter = 0;
  globalCtx.seneca = server.seneca
  globalCtx.cloudInitDone = false;
  server.seneca.use(core_service.core, globalCtx);
  server.seneca.use(offload_service.offload, globalCtx);
  server.seneca.use(vision_service.vision, globalCtx);
  server.seneca.use(neighbor_service.neighbors, globalCtx);

  //This maps all HTTP methods against microservices
  //server.route(rest_routes);
  server.route(rest_api);
  server.route(vision_api);

  // start the server
  server.start(function (err) {
    if (err) throw err;
    console.log("Server is running at", server.info.uri);
    startAnnouncements();

    // start cloud client and edge server after middleware is initialized
    try {
      cloud_client.init(globalCtx);
    } catch (e) {
      console.log(e);
    }
    //.then(cloud_client.registerServices)
    edge_init(globalCtx.seneca);

    startCharting();

  });
});

function local() {
  this.add("cmd:run", function (msg, done) {
    return done(null, { tag: "local" });
  });
}
