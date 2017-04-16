import ping = require('ping');

export class gps {
    lat: Number;
    lon: Number;
    constructor(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    toString() {
        return "lat:" + this.lat + " lon:" + this.lon;
    }
}
export class Neighbor {
    gps: gps;
    ipAddr: String;
    services: String[];

    constructor(gps, ipAddr) {
        this.gps = gps;
        this.ipAddr = ipAddr;
    }
    toString() {
        return 'Neighbour with ' + this.gps.toString() + " " + this.ipAddr;
    }
    setServices(services) {

        this.services = services;
    }
}
export class Neighbors {
    private static instance: Neighbors;
    neighbors: Neighbor[];

    private constructor() { }

    static getInstance() {
        if (!Neighbors.instance) {
            Neighbors.instance = new Neighbors();
        }
        return Neighbors.instance;
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
    public updateNeighbors(updatedNeighbors) {
        this.neighbors = [];
        updatedNeighbors.forEach(function (item, index, array) {
            //this.neighbors.push(new Neighbor(new gps(item.lat, item.lon)), item.ipAddr) TODO
        });
    }
    toString() {
        var str;
        this.neighbors.forEach(function (item, index, array) {
            str += item.ipAddr + " ";
        })
        return str;
    }
    startHeartbeat() {
        setInterval(this.checkNeighborsNow, process.env.peerHeartbeatInterval);
    }
}