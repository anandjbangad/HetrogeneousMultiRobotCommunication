import path = require('path');
import fs = require("fs");
import * as itf from "../../common/interfaces.d"
import MA = require('moving-average');


var ma = MA(5 * 1000); // 5sec
export const taskInit = (global) => {
    this.globalCtx = {};
    this.globalCtx = global;
}

var delay_bw_images = 3000;
export function task2(globalCtx) {
    console.log(this);
    setInterval(() => {
        let edge_req: itf.e_edge_req = {
            task_id: 1,
            type: "devmsg",
            payload: "",
        }
        globalCtx.amqp.ch.sendToQueue('d_task1_req', Buffer.from(JSON.stringify(edge_req)));
        globalCtx.req_count++;
    }, 50)
}
export const onRsp = (json_message) => {
    ma.push(Date.now(), Math.random() * 500);
    //console.log(" [x] Received %s", msg.content.toString());
    let message: itf.e_edge_rsp = JSON.parse(json_message.content);
    console.log('moving average now is', ma.movingAverage());
    console.log("Device Client:", ++this.globalCtx.rsp_count, "/", this.globalCtx.req_count, message.result);
}
export const getMovingAverage = () => {
    return ma.movingAverage();
}
export function task1(ws) {
    let genObj = walkSync(path.join(__dirname, '../../dataset'));
    genObj.next();
    let interval = setInterval(() => {
        let val = genObj.next();

        if (val.done) {
            clearInterval(interval);
        } else {
            console.log(val.value);
            fs.readFile(val.value, function (err, original_data) {
                var base64Image = original_data.toString('base64');
                //getDecodedText(base64Image);
                let json_message: itf.e_edge_req = {
                    type: "devmsg",
                    payload: base64Image,
                    task_id: 1
                };
                ws.send(JSON.stringify(json_message));
            });
        }
    }, delay_bw_images);
    console.log("Connection Established");
}

var walkSync = function* (dir) {

    if (dir[dir.length - 1] != '/') dir = dir.concat('/')

    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);

    for (let file of files) {
        if (fs.statSync(dir + file).isDirectory()) {
            yield* walkSync(dir + file + '/');
        }
        else {
            yield (dir + file);
        }
    }
};