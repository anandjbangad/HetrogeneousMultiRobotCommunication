var os = require("os-utils")

class osUsage {
    constructor() {
    }
    updateUsageVar() {
        let self = this;
        os.cpuUsage(function (v) {
            self.cpuPercent = v;
        })
        os.freemem(function (freemem) {
            self.freeMem = freemem;
        })
    }
    startMonitoring() {
        setInterval(this.updateUsageVar, process.env.osInterval);
    }
}
var myOsUsage = new osUsage();
module.exports = {
    "osUsage": myOsUsage
}