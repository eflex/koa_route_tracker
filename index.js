'use strict'

let mongoose = require('mongoose');
let urlParser = require("url").parse;
let detector = require("device_detect");

let timestamp = require('mongoose-timestamp');
let Schema = mongoose.Schema;

// define model
let TrackerSchema = new Schema({
  user: {
    type: String,
    default: null
  },
  ipaddress: {
    type: String
  },
  action: {
    type: String,
    default: "view"
  },
  referrer: {
    type: String
  },
  destination: {
    type: String
  },
  method: {
    type: String,
    default: "GET"
  },
  device: {
    type: String,
    default: "Desktop"
  },
  os: {
    type: String,
    default: "Desktop"
  },
  browser: {
    type: String,
    default: "Others"
  },
  status: {
    type: Number,
    default: 404
  }
});
TrackerSchema.plugin(timestamp);

function checkAction(referer, hostname) {
  let parsedReferer = urlParser(referer)
  if (hostname == parsedReferer.hostname) return "click";
  return "view";
}

function isInBlackList(toTest, blackList) {
  // remove trailing slashes
  toTest = toTest.replace(RegExp("(^/|/$)", "g"), '');

  for (let i = 0; i < blackList.length; i++) {
    let pattern = new RegExp(blackList[i], "i");
    // console.log(pattern, pattern.test(toTest), toTest)
    if (pattern.test(toTest)) return true;
  }
  return false;
}

module.exports = function(url, collection, blackList) {
  if (!url) throw new Error("Mongodb url needed to setup the tracker")
  if (!blackList) blackList = []
  collection = collection || 'userActivities';

  // connect to Mongodb
  mongoose.connect(url);
  let TrackerModel = mongoose.model("Tracker", TrackerSchema,
    collection);


  return function*(next) {
    yield * next;

    if (!isInBlackList(this.url, blackList)) {
      // set user if this.user is defined
      let user = "anonymous";
      if (this.user) {
        if (this.user.id) user = this.user.id;
        else if (this.user.email) user = this.user.email;
        else user = this.user
      }

      let userAgentHeader = this.get("user-agent") || "";
      let referrer = this.get("referer") || "";
      let method = this.method;
      let hostname = this.hostname || "";
      let ip = this.ip;
      let destination = this.originalUrl;
      let action = checkAction(referrer, hostname)
      let status = this.status || 404;

      // detec device being used
      let detectedDevice = detector(userAgentHeader);

      let newData = {
        user: user,
        ipaddress: ip,
        action: action,
        referrer: referrer,
        destination: destination,
        method: method,
        device: detectedDevice.device,
        os: detectedDevice.os,
        browser: detectedDevice.browser,
        status: status
      }

      // console.log("TRACKER NEW DATA", newData);
      TrackerModel.create(newData);
    }

  }

}
