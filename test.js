var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db1 = mongoose.createConnection('mongodb://localhost/coreDB');
var Schema = mongoose.Schema;

// mongoose.connection.db.dropDatabase(function (err, result) {
//     console.log("Database cleaned");
// });
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

//NodeList is a Model (~Document)
var NodeList = db1.model('NodeList', nodeListSchema);

NodeList.collection.drop();
//newNode is instance of model i.e actual document
var newNode = new NodeList({
    ipAddr: "123.121.123",
    deviceId: 123,
    description: "Some description",
    type: "Sid",
    hostname: "myhostname",
    categories: {
        name: "myName",
        typeNo: 12
    }
});
//always save actual document
newNode.save(function (err, result) {
    if (err) throw err;
    console.log("New Node Saved");
}).then(function (doc) {
    NodeList.findOneAndUpdate({
        type: 'Sidd'
    }, { type: "Siddharth" }, { upsert: false }, function (err, doc) {
        if (err) console.log(err);
        return console.log("succesfully saved 1");
    });
}).then(function (doc) {
    NodeList.findOneAndUpdate({
        type: 'Sid'
    }, { $set: { type: "Siddharth" } }, { upsert: false }, function (err, doc) {
        if (err) console.log(err);
        return console.log("succesfully saved 2");
    });
})



