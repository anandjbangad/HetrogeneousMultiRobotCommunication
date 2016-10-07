//core.js


module.exports = function core(options) {
    var seneca = this;
    //Plugin Init. Called when plugin is used for first time
    //plugin name (i.e function name or return string) and init: 'plugin name' should be same
    seneca.add({ init: 'core' }, function (args, done) {
        // do stuff, e.g.
        console.log('connecting to db during initialization...')
        setTimeout(function () {
            console.log(' DB connected!')
            done()
        }, 1000)
    });

    this.add({ role: 'coreRequest', cmd: 'getDevicesList' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: dev1, dev2, dev3' })
    });

    this.add({ role: 'coreRequest', cmd: 'registerDevice' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: new device' })
    });

    this.add({ role: 'coreRequest', cmd: 'deleteDevice' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: device deleted' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataPoint' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: device posted a datapoint' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });

    this.add({ role: 'coreRequest', cmd: 'postDataToDevice' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });

    this.add({ role: 'coreRequest', cmd: 'getDataPoints' }, function (args, done) {
        done(null, { result: 'CORE SERVICE: data to device through MQTT or WS' })
    });

    return 'core';
}