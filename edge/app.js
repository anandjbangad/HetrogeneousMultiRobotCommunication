require('dotenv').config({ path: './.env' });

const Chairo = require('chairo');
const Hapi = require('hapi');

var rest_routes = require('./rest/routes');
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
    cloud_client.init();
    var edge_server = require("./ws/edge_server.js")(server.seneca); //executing constructor


    // Register all microservices plugins with seneca object
    server.seneca.use(require('./rest/plugin_rest.js'), {});
    server.seneca.use(require('./core/plugin_core.js'), {
        "cloud_client": cloud_client,
        "counter": 0
    });

    //This maps all HTTP methods against microservices
    server.route(rest_routes);

    // start the server
    server.start(function (err) {
        if (err) throw err;
        console.log('Server is running at', server.info.uri);
    });


});


function local() {
    this.add('cmd:run', function (msg, done) {
        return done(null, { tag: 'local' })
    })
}



