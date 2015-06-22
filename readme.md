## Koa Route Tracker
  Simple middleware for koa-router to track user activities

## Quick Start

  Installation:

```bash
$ npm install --save eflex/koa_route_tracker
```


```javascript
var router = require("koa-router")();
var routerTracker = require("koa_route_tracker")
module.exports = function() {
  router
    // middleware to define this.user that route tracker needs
    .use(getUser)
    // routerTracker(urlParser, collection, [blackList])
    .use(routerTracker("mongodb://localhost:27017/userActivities"))
    .get(...)
    .post(...)
    .put(...)
    .del(...);

  return router;
```

## ToDo

* 404 should be recorded
* 500 error should be recorded
