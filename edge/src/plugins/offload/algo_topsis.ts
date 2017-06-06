import neigh = require("../../neighbors.js");
import { getCldTopics } from "../../ws/cloud_client"
import * as itf from "../../../../common/interfaces.d"
import * as os from "../../../../common/utils/os"
import * as amqpStats from "../../../../common/utils/ms_stats"
import math = require('mathjs');
import Debug = require('debug');
let debug = Debug('topsis');


var lastMsgSentTo: number = 0;
//debug = function () { }
export function algoTopsis() {
    const m_alternatives = 2 + neigh.Neighbors.getInstance().getAllNeighbor().length;
    const n_criterias = 3;
    var dataset = math.matrix(math.zeros([n_criterias, m_alternatives]));
    //fill first 2 colms
    dataset.forEach(function (value, index, matrix) {
        switch (index[1]) {
            case 0: //local
                switch (index[0]) {
                    case 0: //memory
                        dataset.subset(math.index(index[0], index[1]), os.getFreeRam());
                        break;
                    case 1: //cpu
                        dataset.subset(math.index(index[0], index[1]), os.getCPUNow());
                        break;
                    case 2: //queued msgs
                        dataset.subset(math.index(index[0], index[1]), amqpStats.getQueueStats("d_task1_req").messages || 1);
                        break;
                    default:
                        debug("Unknown criteria in topsis algorithm for local");
                }
                break;
            case 1: //cloud
                let cldTopicRsp: itf.cld_publish_topics = getCldTopics();
                switch (index[0]) {
                    case 0: //memory
                        dataset.subset(math.index(index[0], index[1]), cldTopicRsp.freemem);
                        break;
                    case 1: //cpu
                        dataset.subset(math.index(index[0], index[1]), cldTopicRsp.cpu);
                        break;
                    case 2: //messages
                        dataset.subset(math.index(index[0], index[1]), cldTopicRsp.msgCount.messages || 1);
                        break;
                    default:
                        debug("Unknown criteria in topsis algorithm for cloud");
                }
                break;
            default: //neigh
                switch (index[0]) {
                    case 0: //memory
                        dataset.subset(math.index(index[0], index[1]), neigh.Neighbors.getInstance().getAllNeighbor()[index[1] - 1].amqpNeigh.topicsUpdateMsg.freemem);
                        break;
                    case 1: //cpu
                        dataset.subset(math.index(index[0], index[1]), neigh.Neighbors.getInstance().getAllNeighbor()[index[1] - 1].amqpNeigh.topicsUpdateMsg.cpu);
                        break;
                    case 2:
                        dataset.subset(math.index(index[0], index[1]), neigh.Neighbors.getInstance().getAllNeighbor()[index[1] - 1].amqpNeigh.topicsUpdateMsg.msgCount.messages || 1);
                        break;
                    default:
                        debug("Unknown criteria in topsis algorithm for neighbor");
                }
                break;
        }
        // //neighbors
        // let votes = math.squeeze(matrix.subset(math.index(index[0], index[1], math.range(0, 3))));

        // weights.subset(math.index(index[0], index[1]), math.sum(votes) / votes.size()[0]);
    });

    //fill other colms
    // var dataset = math.matrix([
    //     [[6, 2, 4], [5, 2, 2], [1, 1, 1]],      //criteria X
    //     [[8, 8, 5], [6, 2, 4], [3, 2, 4]],  //criteria X
    //     [[4, 2, 3], [9, 9, 3], [9, 9, 9]],  //criteria X
    //     [[4, 5, 6], [2, 1, 3], [10, 10, 7]]  //criteria X
    // ]);
    // debug("Dataset is");
    print(dataset);
    // math.size() ==> rows, cols, ...
    var weights = math.zeros(dataset.size()[0], dataset.size()[1]);
    //weights(nxm)
    var criterions = weights.clone();

    var sumMinMaxDiff = math.zeros(weights.size()[1], 2); //cols =2 fixed
    // sumMinMaxDiff(mx2)
    //var minMaxDiff = sumMinMaxDiff.clone();

    var final = math.zeros(sumMinMaxDiff.size()[0]); // cols = 2 fixed
    //final(1xm)

    // dataset.forEach(function (value, index, matrix) {
    //     debug('value:', value, 'index:', index);
    //     let votes = math.squeeze(matrix.subset(math.index(index[0], index[1], math.range(0, 3))));

    //     weights.subset(math.index(index[0], index[1]), math.sum(votes) / votes.size()[0]);
    // });
    debug("Weights is");
    weights = dataset.clone();
    print(weights);
    weights.forEach(function (value, index, matrix) {
        let rowSum = math.sum(matrix.subset(
            math.index(index[0], math.range(0, m_alternatives))
        ));
        criterions.subset(math.index(index[0], index[1]), Math.pow(value, 2) / rowSum);
    });
    debug("Criterions is");
    print(criterions);
    for (let n = 0; n != n_criterias; n++) {
        let votes = math.squeeze(criterions.subset(math.index(n, math.range(0, m_alternatives))));
        //print(votes);
        let minVal = 0, maxVal = 0;
        //for each alternative
        for (let m = 0; m != m_alternatives; m++) {
            var value = votes.subset(math.index(m));
            //votes.forEach(function (value, index, matrix) {
            //debug(Math.pow(value - math.min(votes), 2));
            sumMinMaxDiff.subset(math.index(m, 0), Math.pow(value - math.min(votes), 2) + sumMinMaxDiff.subset(math.index(m, 0)));
            //minVal += Math.pow(value - math.min(matrix), 2);
            sumMinMaxDiff.subset(math.index(m, 1), Math.pow(math.max(votes) - value, 2) + sumMinMaxDiff.subset(math.index(m, 1)));
            //maxVal += Math.pow(math.max(matrix) - value, 2);
        }
        //sumMinMaxDiff.subset(math.index(n, 0), minVal);
        //sumMinMaxDiff.subset(math.index(n, 1), maxVal);
    }
    debug("sumMinMaxDiff is");
    print(sumMinMaxDiff);
    var minMaxDiff = sumMinMaxDiff.map(function (value, index, matrix) {
        return Math.sqrt(value);
    })

    for (let m = 0; m != m_alternatives; ++m) {
        let votes = math.squeeze(minMaxDiff.subset(math.index(m, math.range(0, 2))));
        //debug(m);
        final.subset(math.index(m), votes.subset(math.index(0)) / math.sum(votes));
    }
    debug("Final is");
    print(final);
    let maxVal = 0; //doubt
    let maxIdx = 0;
    final.forEach(function (value, index, matrix) {
        if (value > maxVal) {
            maxIdx = index[0];
        }
    });
    return maxIdx;

}
/**
     * Helper function to output a value in the console. Value will be formatted.
     * @param {*} value
     */
function print(value) {
    var precision = 14;
    console.log(math.format(value, precision));
}