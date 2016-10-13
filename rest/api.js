const Chairo = require('chairo');
const Hapi = require('hapi');

var rest_routes = require('./routes');
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8080
});

// Register plugin

server.register({ register: Chairo }, function (err) {

    // Add a Seneca action

    let id = 0;
    server.seneca.add({ generate: 'id' }, function (message, next) {
        console.log("print 1");
        return next(null, { id: ++id });
    });

    // Invoke a Seneca action

    server.seneca.act({ generate: 'id' }, function (err, result) {

        // result: { id: 1 }
    });

    // Register all microservices plugins with seneca object
    server.seneca.use(require('../rest/plugin_rest.js'), {});
    server.seneca.use(require('../core/plugin_core.js'), {});

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
