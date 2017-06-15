import Tesseract = require("tesseract.js");
import * as itf from "../../common/interfaces.d"
import winston = require("winston")

export function Task3(edge_req: itf.i_edge_req) {
    return new Promise(function (resolve, reject) {
        let edge_rsp: itf.i_edge_rsp = {
            cmd_id: edge_req.cmd_id,
            result: edge_req.payload + " C",
            type: "cldmsg",
            task_id: edge_req.task_id,
            ttl: edge_req.ttl - 1
        };
        resolve(edge_rsp);
    });
}
export function visionTask1(message: itf.i_edge_req, edgews) {
    var base64Image = message["payload"];
    var decodedImage = new Buffer(base64Image, "base64");
    Tesseract.recognize(decodedImage)
        .then(txtdata => {
            console.log("Recognized Text: ", txtdata.text);
            edgews.send(
                JSON.stringify({
                    cmd_id: message["cmd_id"],
                    result: txtdata.text,
                    type: "cldmsg",
                    task_id: message.task_id,
                    ttl: message.ttl - 1
                })
            );
        })
        .catch(err => {
            console.log("catch: ", err);
            edgews.send(
                JSON.stringify({
                    cmd_id: message.cmd_id,
                    result: "Error",
                    type: "cldmsg",
                    task_id: message.task_id,
                    ttl: 0
                })
            );
        })
        .finally(e => {
            //console.log('finally\n');
            //process.exit();
        });

}