'use strict'

var mongoose = require('mongoose');
var urlParser = require("url").parse;

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
      var ip = this.ip;
      var destination = this.originalUrl;
      var action = checkAction(referrer, hostname)
      var status = this.status || 404;


      // Patterns to detect
      var crawler = new RegExp(
        "(googlebot)|(mediapartners)|(adsbot)|(msnbot)|(bingbot)|(Yo(u)?daoBot)|(Ya)(andex|DirectBot)|(baiduspider)|(duckduckbot)|(slurp)|(blekkobot)|(scribdbot)|(asterias)|(DoCoMo)|(Sogou)|(ichiro)|(moget)|(NaverBot)|(MJ12bot)",
        "i");
      var ios = new RegExp("\\biPhone.*Mobile|\\biPod|\\biPad", "i")

      // detect device
      var device = "Desktop";
      if (/(mobi)/i.test(userAgentHeader)) {
        device = "Phone";
      } else if (/(tablet)|(iPad)/i.test(userAgentHeader)) {
        device = "Tablet";
      } else if (crawler.test(userAgentHeader)) {
        device = "Robot"
      }

      // detect os
      var os = "Others";
      if (/Android/i.test(userAgentHeader)) {
        os = "Android"
      } else if (ios.test(userAgentHeader)) {
        os = "IOS"
      } else if (/(Mac_PowerPC)|(Macintosh)/i.test(userAgentHeader)) {
        os = "Mas OS"
      } else if (/(Linux)|(X11)/i.test(userAgentHeader)) {
        os = "Linux/Unix"
      } else if (/(Windows)|(Win)/i.test(userAgentHeader)) {
        os = "Windows"
      }

      var newData = {
        user: user,
        ipaddress: ip,
        action: action,
        referrer: referrer,
        destination: destination,
        method: method,
        device: device,
        os: os,
        status: status
      }

      // console.log("TRACKER NEW DATA", newData);
      TrackerModel.create(newData);
    }

  }

}
