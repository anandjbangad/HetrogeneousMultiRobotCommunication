var ping = require('ping');

class gps {
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    toString() {
        return "lat:" + this.lat + " lon:" + this.lon;
    }
}
class Neighbor {
    constructor(gps, ipAddr) {
        this.gps = gps;
        this.ipAddr = ipAddr;
    }
    toString() {
        return 'Neighbour with ' + this.gps.toString() + " " + ipAddr;
    }
    setServices(services) {
        this.services = services;
    }
}
class Neighbors {
    constructor(neighbors) {
        this.neighbors = neighbors;
    }
    addNeighbor(neighbor) {
        this.neighbors.push(neighbor);
    }
    removeNeighbor(neighbor) {
        this.neighbors.splice(this.neighbors.indexOf(neighbor), 1);
    }
    checkNeighborsNow() {
        //ping each neighbor and update lastUpdate time
        this.neighbors.forEach(function (item, index, array) {
            ping.promise.probe(this.ipAddr, { timeout: process.env.pingTimeout })
                .then(function (res) {
                    console.log(res);
                    //if res is unreachable call removeNeighbor(item)
                })
        })
    }
    updateNeighbors(updatedNeighbors) {
        this.neighbors = [];
        updatedNeighbors.forEach(function (item, index, array) {
            this.neighbors.push(new Neighbor(new gps(item.lat, item.lon)), item.ipAddr)
        })
    }
    toString() {
        var str;
        this.neighbors.forEach(function (item, index, array) {
            str += item.ipAddr + " ";
        })
        return str;
    }
    startHeartbeat() {
        setInterval(checkNeighborsNow, process.env.peerHeartbeatInterval);
    }

}

module.exports = {
    "neighbors": new Neighbors([]), //object
    "Neighbor": Neighbor,   //class
    "gps": gps  //class
} 
