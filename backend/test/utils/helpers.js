const express = require('express');
const path = require('path');

function makeAppWithRoute(route, cacheModule, cacheKey, initialData = [], routeModulePath) {
  const app = express();
  cacheModule[cacheKey] = initialData;
    // routeModulePath should be a relative path to the route module from the backend cwd,
    // e.g. '../routes/ptcg-sets'. Resolve it from process.cwd() so Jest helpers can require
    // the route module regardless of this helper's file location.
    const resolved = path.resolve(__dirname, '..', routeModulePath);
    app.use(route, require(resolved));
  return app;
}

module.exports = { makeAppWithRoute };
