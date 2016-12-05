//vision.js

var fs = require('fs');
var Tesseract = require('tesseract.js')

module.exports = function vision(options) {
    var seneca = this;
    //Plugin Init. Called when plugin is used for first time
    //plugin name (i.e function name or return string) and init: 'plugin name' should be same
    seneca.add({ init: 'vision' }, function(msg, done) {
        // do stuff, e.g.
        console.log('connecting to db during initialization...')
        setTimeout(function() {
            console.log(' vision api init done!')
            done()
        }, 1000)
    });

    this.add({ role: 'visionRequest', cmd: 'visionTask1' }, function(message, done) {
        //execute vision task locally
        //console.log("visionTask: " + message.msg);
        console.log("test............");

        //console.log('CLOUD Server: %s', data['json_data']);
        var base64Image = message.msg;
        var decodedImage = new Buffer(base64Image, 'base64');
        //fs.writeFile('image_decoded.png', decodedImage, function (err) { });
        Tesseract.recognize(decodedImage)
            .then(txtdata => {
                console.log('Recognized Text: ', txtdata.text);
                done(null, { result: txtdata.text })
            })
            .catch(err => {
                console.log('catch: ', err);
                done(null, { result: "Error!!!" })
            })
            .finally(e => {
                //console.log('finally\n');
                //process.exit();
            });
        //done(null, { result: 'result for ' + message.msg.replace(/^\D+/g, '') }) //message.msg is image/text
    });

    return 'vision';
}