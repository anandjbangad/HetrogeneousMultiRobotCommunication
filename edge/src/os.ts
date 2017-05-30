import os = require("os-utils");
import ipaddr = require('ipaddr.js');

var ipAddr;
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

export function getIpAddr(): String {
  return ipAddr.toString();
}
export function setIpAddr(ip) {
  ipAddr = ipaddr.process(ip);
}