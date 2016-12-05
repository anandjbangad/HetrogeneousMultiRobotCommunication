//var devices = require('./plugins/core/routes.js');
var rest = require('./plugins/rest/api.js');
var vision = require('./plugins/vision/api.js');

module.exports = [].concat(rest, vision);