'use strict'

var mongoose = require('mongoose');
var urlParser = require("url").parse;
var detector = require("device_detect");

var timestamp = require('mongoose-timestamp');
var Schema = mongoose.Schema;

// define model
var TrackerSchema = new Schema({
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
  var parsedReferer = urlParser(referer)
  if (hostname == parsedReferer.hostname) return "click";
  return "view";
}

function isInBlackList(toTest, blackList) {
  // remove trailing slashes
  toTest = toTest.replace(RegExp("(^/|/$)", "g"), '');

  for (var i = 0; i < blackList.length; i++) {
    var pattern = new RegExp(blackList[i], "i");
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
  var TrackerModel = mongoose.model("Tracker", TrackerSchema,
    collection);


  return function*(next) {
    yield * next;

    if (!isInBlackList(this.url, blackList)) {
      // set user if this.user is defined
      var user = "anonymous";
      if (this.user) {
        if (this.user.id) user = this.user.id;
        else if (this.user.email) user = this.user.email;
        else user = this.user
      }

      var userAgentHeader = this.get("user-agent") || "";
      var referrer = this.get("referer") || "";
      var method = this.method;
      var hostname = this.hostname || "";
      var ip = this.request.header['x-forwarded-for'];
      var destination = this.originalUrl;
      var action = checkAction(referrer, hostname)
      var status = this.status || 404;

      // detec device being used
      var detectedDevice = detector(userAgentHeader);

      var newData = {
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
