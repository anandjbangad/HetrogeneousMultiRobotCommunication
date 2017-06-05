import osUtils = require("os-utils");
import ipaddr = require('ipaddr.js');

var ipAddr;
export var cpuPercent;
export var freeMem: number;

const updateUsageVar = () => {
  let self = this;
  osUtils.cpuUsage((value: Number): void => {
    this.cpuPercent = value;
  });
  osUtils.freemem((freemem) => {
    this.freeMem = freemem;
  });
}
export function startMonitoring() {
  this.cpuPercent = 0;
  this.freeMem = 0;
  //setInterval(updateUsageVar, process.env.osUtilsInterval);
}

export function getIpAddr(): String {
  return ipAddr.toString();
}
export function getCPU() {
  return new Promise(function (resolve, reject) {
    osUtils.cpuUsage((value: Number): void => {
      resolve(value);
    });
  });
}
export function getFreeRam() {
  return new Promise((resolve, reject) => {
    resolve(osUtils.freememPercentage());
  });
}
export function setIpAddr(ip) {
  ipAddr = ipaddr.process(ip);
}