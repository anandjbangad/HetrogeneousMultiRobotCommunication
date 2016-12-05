require('dotenv').config({ path: './.env' });

var mongoose = require('mongoose');
var db1 = mongoose.createConnection('mongodb://localhost/coreDB');
var Schema = mongoose.Schema;

var subCategory = new Schema({
    name: String,
    typeNo: Number
})

var nodeListSchema = new Schema({
    ipAddr: { type: String, index: { unique: true, dropDups: true } },
    type: { type: String },
    description: String,
    hostname: String,
    createdOn: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    categories: [subCategory],
});

var NodeList = db1.model('NodeList', nodeListSchema);

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
    cloud_client.init();
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
        var ad = mdns.createAdvertisement(mdns.tcp('http', 'caslab'), 4321);
        ad.start();
        //listen to caslab http servers
        var sequence = [
            mdns.rst.DNSServiceResolve(),
            'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({ families: [4] }),
            mdns.rst.makeAddressesUnique()
        ];
        var browser = mdns.createBrowser(mdns.tcp('http', 'caslab'), { resolverSequence: sequence });

        // // watch all http servers
        // var browser = mdns.createBrowser(mdns.tcp('http'));
        browser.on('serviceUp', function (service) {
            console.log("service up: ", service.addresses[0]);
            NodeList.findOneAndUpdate({ ipAddr: service.addresses[0] }, {
                ipAddr: service.addresses[0],
                description: "New device",
                hostname: service.name
            }, { upsert: true }, function (err, doc) {
                console.log(doc);
            });
            //add ipaddr and hostname to serverDB
        });
        browser.on('serviceDown', function (service) {
            console.log("service down: ", service.name);
            NodeList.remove({ hostname: service.name }, function (err) {
                console.log(err);
            })
            // remove from serverDB
        });
        browser.start();
    });


});


function local() {
    this.add('cmd:run', function (msg, done) {
        return done(null, { tag: 'local' })
    })
}



