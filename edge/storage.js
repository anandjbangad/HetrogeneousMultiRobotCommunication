class Storage {
    constructor() {
        this.mongoose = require('mongoose');
        this.edgedb = this.mongoose.createConnection('mongodb://localhost/edgeDB');

        this.subCategory = new this.mongoose.Schema({
            name: String,
            typeNo: Number
        }, { _id: false });

        this.nodeListSchema = new this.mongoose.Schema({
            uuid: { type: String, index: { unique: true, dropDups: true } },
            ipAddr: { type: String },
            type: { type: String },
            description: String,
            hostname: String,
            createdOn: { type: Date, default: Date.now },
            lastUpdate: { type: Date, default: Date.now },
            isActive: { type: Boolean, default: true },
            categories: [this.subCategory],
        });

        //get model
        this.NodeList = this.edgedb.model('NodeList', this.nodeListSchema);
    }
    cleandb() {
        //return this.NodeList.collection.drop();
    }
    getModel() {
        return this.NodeList;
    }

}
var storage = new Storage();
module.exports = {
    "cleandb": storage.cleandb,
    "getModel": storage.getModel
}
