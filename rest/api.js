const Chairo = require('chairo');
const Hapi = require('hapi');

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

    server.seneca.use(require('../rest/plugin_rest.js'), {});
    server.seneca.use(require('../core/plugin_core.js'), {});


    // server.route({
    //     method: 'GET',
    //     path: '/devices',
    //     handler: function (request, reply) {
    //         // Invoke a Seneca action using the request decoration
    //         request.seneca.act({ role: 'restRequest', cmd: 'getDevicesList' }, function (err, result) {
    //             if (err) {
    //                 return reply(err);
    //             }
    //             return reply(result);
    //         });
    //     }
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/devices',
    //     handler: { act: 'role:restRequest, cmd:registerDevice' } // will hit the registerDevice pattern using funky jsonic syntax
    // });

    // server.route({
    //     method: 'DELETE',
    //     path: '/devices',
    //     handler: { // will hit the math pattern using full js object representation
    //         act: {
    //             role: 'restRequest',
    //             cmd: 'deleteDevice'
    //         }
    //     }
    // });

    // // seneca route with some sugar
    // server.route({
    //     method: 'POST',
    //     path: '/devices/{deviceId}',
    //     handler: function (request, reply) {
    //         return reply.act({ role: 'restRequest', cmd: 'postDataPoint'});
    //     }
    // });

    // // seneca route with no magic
    // server.route({
    //     method: 'POST',
    //     path: '/devices/{deviceId}/publish',
    //     handler: function (request, reply) {
    //         server.seneca.act({ role: 'restRequest', cmd: 'postDataToDevice' }, (err, result) => {
    //             if (err)
    //                 return console.error(err);

    //             reply(null, result);
    //         })
    //     }
    // });

var rest_routes = require('./routes');
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
