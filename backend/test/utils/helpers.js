const express = require('express');
const path = require('path');

function setTestMongoUri() {
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devjourney_test';
}

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

function createMockTcgdex({ listRes = [], getRes = {} } = {}) {
  return {
    set: {
      list: jest.fn().mockResolvedValue(listRes),
      get: jest.fn().mockResolvedValue(getRes),
    },
  };
}

function createMockQuery() {
  return {
    create: jest.fn().mockImplementation(() => ({
      sort: () => ({
        not: { equal: () => ({}) },
        equal: () => ({}),
      }),
    })),
  };
}

module.exports = { setTestMongoUri, makeAppWithRoute, createMockTcgdex, createMockQuery };
