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
    .use(getUser) // middleware to define this.user that route tracker needs
    .use(routerTracker("mongodb://localhost:27017/userActivities"))
    .get(...)
    .post(...)
    .put(...)
    .del(...);

  return router;
```
