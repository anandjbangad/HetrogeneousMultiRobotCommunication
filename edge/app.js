require('dotenv').config({ path: './.env' });

if (!process.env.UUID) {
    process.env.UUID = require('uuid/v4')();
    console.log("New UUID for edge is " + process.env.UUID)
}

require("./storage.js").cleandb();
require("./os").osUsage.startMonitoring();

var mdns = require('mdns');
const Chairo = require('chairo');
const Hapi = require('hapi');

var rest_routes = require('./api.js');
const server = new Hapi.Server();
server.connection({
    host: process.env.REST_HOST,
    port: process.env.REST_PORT
});

// Register plugin

server.register({ register: Chairo }, function (err) {

    // Add a Seneca action

    let id = 0;
    server.seneca.add({ generate: 'id' }, function (message, next) {
        console.log("print 11");
        return next(null, { id: ++id });
    });

    // Invoke a Seneca action

    server.seneca.act({ generate: 'id' }, function (err, result) {

        // result: { id: 1 }
    });

    // start cloud client and edge server after middleware is initialized
    var cloud_client = require("./ws/cloud_client.js"); //executing constructor
    cloud_client.init()

    //.then(cloud_client.registerServices)

    var edge_server = require("./ws/edge_server.js")(server.seneca); //executing constructor


    // Register all microservices plugins with seneca object
    server.seneca.use(require('./plugins/rest/service.js'), {});
    server.seneca.use(require('./plugins/core/service.js'), {
        "cloud_client": cloud_client,
        "counter": 0
    });
    server.seneca.use(require('./plugins/vision/service.js'), {});

    //This maps all HTTP methods against microservices
    server.route(rest_routes);

    // start the server
    server.start(function (err) {
        if (err) throw err;
        console.log('Server is running at', server.info.uri);
        require("./mDNS.js").startAnnouncements();
    });


});


function local() {
    this.add('cmd:run', function (msg, done) {
        return done(null, { tag: 'local' })
    })
}



