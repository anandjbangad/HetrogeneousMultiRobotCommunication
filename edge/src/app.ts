import { config } from "dotenv";
config({ path: "../.env" });

const easyMonitor = require("easy-monitor");
//easyMonitor("edgeNode");

if (!process.env.UUID) {
  process.env.UUID = require("uuid/v4")();
  console.log("New UUID for edge is " + process.env.UUID);
}

import { cleandb } from "./storage.js";
cleandb();
import { startMonitoring } from "./os.js";
startMonitoring();

import mdns = require("mdns");
import Chairo = require("chairo");
import Hapi = require("hapi");

//import rest_routes = require("./api.js");

const server = new Hapi.Server();
server.connection({
  host: process.env.REST_HOST,
  port: process.env.REST_PORT
});
import { startAnnouncements } from "./mDNS.js";
import rest_service = require("./plugins/rest/service.js");
import core_service = require("./plugins/core/service.js");
import rest_api = require('./plugins/rest/api.js');
import vision_api = require('./plugins/vision/api.js');
import vision_service = require("./plugins/vision/service.js");
import cloud_client = require("./ws/cloud_client.js"); //executing constructor

// Register plugin
server.register({ register: Chairo }, function (err) {
  // Add a Seneca action

  let id = 0;
  server.seneca.add({ generate: "id" }, function (message, next) {
    console.log("print 11");
    return next(null, { id: ++id });
  });

  // Invoke a Seneca action

  server.seneca.act({ generate: "id" }, function (err, result) {
    // result: { id: 1 }
  });

  // start cloud client and edge server after middleware is initialized

  cloud_client.init();

  //.then(cloud_client.registerServices)

  var edge_server = require("./ws/edge_server.js")(server.seneca); //executing constructor

  // Register all microservices plugins with seneca object
  server.seneca.use(rest_service, {});
  server.seneca.use(core_service, {
    cloud_client: cloud_client,
    counter: 0
  });
  server.seneca.use(vision_service, {});

  //This maps all HTTP methods against microservices
  //server.route(rest_routes);
  server.route(rest_api);
  server.route(vision_api);

  // start the server
  server.start(function (err) {
    if (err) throw err;
    console.log("Server is running at", server.info.uri);
    startAnnouncements();

  });
});

function local() {
  this.add("cmd:run", function (msg, done) {
    return done(null, { tag: "local" });
  });
}
