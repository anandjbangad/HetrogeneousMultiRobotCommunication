import osUtils = require("os-utils");
import ipaddr = require('ipaddr.js');
import winston = require("winston")


let ipAddr;
let cpuPercent: number;
let freeMem: number;

const updateUsageVar = () => {
  osUtils.cpuUsage((value: number): void => {
    cpuPercent = value;
  });
  osUtils.freemem((freemem) => {
    freeMem = freemem;
  });
}
export function startOSMonitoring() {
  winston.info("started monitoring os params!")
  cpuPercent = 0;
  freeMem = 0;
  updateUsageVar();
  setInterval(updateUsageVar, process.env.osUtilsInterval);
}

export function getIpAddr(): String {
  return ipAddr.toString();
}
export function getCPU() {
  return new Promise(function (resolve, reject) {
    osUtils.cpuUsage((value: number): void => {
      resolve(value);
    });
  });
}
export function getCPUNow() {
  return cpuPercent;
}
export function getFreeRam() {
  return osUtils.freememPercentage();
}
export function setIpAddr(ip) {
  ipAddr = ipaddr.process(ip);
}