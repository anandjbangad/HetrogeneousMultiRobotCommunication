//rest.js


module.exports = function rest(options) {
    var seneca = this;
    //Plugin Init. Called when plugin is used for first time
    //plugin name (i.e function name or return string) and init: 'plugin name' should be same
    seneca.add({ init: 'rest' }, function (args, done) {
        // do stuff, e.g.
        console.log('connecting to db during initialization...')
        setTimeout(function () {
            console.log(' DB connected!')
            done()
        }, 1000)
    });

    this.add({ role: 'restRequest', cmd: 'getDevicesList' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'getDevicesList' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'dev1, dev2, dev3' })
    });

    this.add({ role: 'restRequest', cmd: 'registerDevice' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'registerDevice' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'new device' })
    });

    this.add({ role: 'restRequest', cmd: 'deleteDevice' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'deleteDevice' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'device deleted' })
    });

    this.add({ role: 'restRequest', cmd: 'postDataPoint' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'postDataPoint' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'device posted a datapoint' })
    });

    this.add({ role: 'restRequest', cmd: 'postDataToDevice' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'data to device through MQTT or WS' })
    });

    this.add({ role: 'restRequest', cmd: 'postDataToDevice' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'data to device through MQTT or WS' })
    });

    this.add({ role: 'restRequest', cmd: 'getDataPoints' }, function (args, done) {
        seneca.act({ role: 'coreRequest', cmd: 'getDataPoints' }, function (err, reply) {
            console.log(reply.result);
        })
        done(null, { result: 'data to device through MQTT or WS' })
    });

    return 'rest';
}