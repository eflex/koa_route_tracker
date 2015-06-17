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
  }
});
TrackerSchema.plugin(timestamp);

function checkAction(referer, hostname) {
  var parsedReferer = urlParser(referer)
  if (hostname == parsedReferer.hostname) return "click";
  return "view";
}

module.exports = function(url, collection) {
  if (!url) throw new Error("Mongodb url needed to setup the tracker")
  collection = collection || 'userActivities';

  // connect to Mongodb
  mongoose.connect(url);
  var TrackerModel = mongoose.model("Tracker", TrackerSchema, collection);
  return function*(next) {
    // set user if this.user is defined
    var user = "anonymous";
    if (this.user) {
      if (this.user.id) user = this.user.id;
      else if (this.user.email) user = this.user.email;
      else user = this.user
    }

    var referrer = this.get("referer") || "";
    var method = this.method;
    var hostname = this.hostname || "";
    var ip = this.ip;
    var destination = this.originalUrl;
    var action = checkAction(referrer, hostname)

    var newData = {
      user: user,
      ipaddress: ip,
      action: action,
      referrer: referrer,
      destination: destination,
      method: method
    }

    // console.log("TRACKER NEW DATA", newData);
    TrackerModel.create(newData);
    yield * next;
  }

}
