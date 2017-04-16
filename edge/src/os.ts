import os = require("os-utils");

export let cpuPercent: Number;
export let freeMem: Number;

export function updateUsageVar() {
  let self = this;
  os.cpuUsage((value: Number): void => {
    this.cpuPercent = value;
  });
  os.freemem(function (freemem) {
    self.freeMem = freemem;
  });
}
export function startMonitoring() {
  setInterval(this.updateUsageVar, process.env.osInterval);
}
