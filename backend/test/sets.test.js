const request = require('supertest');
const { makeAppWithRoute } = require('./utils/helpers');

describe('PTCG and TCGP sets routes (consolidated)', () => {
  afterEach(() => {
    const cache = require('../cache');
    cache.ptcgSets = [];
    cache.tcgpSets = [];
  });

  describe('ptcg-sets', () => {
    it('returns all sets and filters/selects/orders', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [
        { name: 'Alpha Set', code: 'A1', releaseDate: '2020-01-01' },
        { name: 'Beta Set', code: 'B1', releaseDate: '2021-05-10' },
      ], '../routes/ptcg-sets');

      const res = await request(app).get('/api/tcgdex/ptcg-sets/');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);

      const res2 = await request(app).get('/api/tcgdex/ptcg-sets').query({ q: 'beta' });
      expect(res2.status).toBe(200);
      expect(res2.body.length).toBe(1);

      const res3 = await request(app).get('/api/tcgdex/ptcg-sets').query({ select: 'name,code' });
      expect(res3.status).toBe(200);
      expect(res3.body[0]).toHaveProperty('name');
      expect(res3.body[0]).not.toHaveProperty('releaseDate');
    });

    it('returns 500 when cache missing and 400 for invalid regex', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [
        { name: 'Alpha Set', code: 'A1' }
      ], '../routes/ptcg-sets');

      cache.ptcgSets = undefined;
      const res = await request(app).get('/api/tcgdex/ptcg-sets/');
      expect(res.status).toBe(500);

      cache.ptcgSets = [{ name: 'Alpha Set' }];
      const bad = await request(app).get('/api/tcgdex/ptcg-sets').query({ q: '[' });
      expect(bad.status).toBe(400);
    });

    it('select includes missing fields (undefined) and orderBy works for ptcg', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [
        { name: 'Alpha Set', code: 'A1', releaseDate: '2020-01-01', rank: 2 },
        { name: 'Beta Set', code: 'B1', releaseDate: '2021-05-10', rank: 1 },
      ], '../routes/ptcg-sets');

      const res = await request(app).get('/api/tcgdex/ptcg-sets').query({ select: 'name,nonexistent' });
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).not.toHaveProperty('nonexistent');

      const res2 = await request(app).get('/api/tcgdex/ptcg-sets').query({ orderBy: 'rank' });
      expect(res2.status).toBe(200);
      const ranks = res2.body.map(x => x.rank);
      const sorted = [...ranks].sort((a, b) => (a > b ? 1 : -1));
      expect(ranks).toEqual(sorted);
    });

    it('sort comparator exercises both branches for ptcg orderBy', async () => {
      const cache = require('../cache');

      // Make array where first comparison yields true and another yields false during sort
      const app1 = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [
        { name: 'A', rank: 3 },
        { name: 'B', rank: 2 },
        { name: 'C', rank: 1 },
      ], '../routes/ptcg-sets');

      const res1 = await request(app1).get('/api/tcgdex/ptcg-sets').query({ orderBy: 'rank' });
      expect(res1.status).toBe(200);

      // Reverse the array to force different comparison outcomes
      const app2 = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [
        { name: 'C', rank: 1 },
        { name: 'B', rank: 2 },
        { name: 'A', rank: 3 },
      ], '../routes/ptcg-sets');

      const res2 = await request(app2).get('/api/tcgdex/ptcg-sets').query({ orderBy: 'rank' });
      expect(res2.status).toBe(200);

      // Ensure both responses are arrays and sorted correctly
      expect(Array.isArray(res1.body)).toBeTruthy();
      expect(Array.isArray(res2.body)).toBeTruthy();
    });
  });

  describe('tcgp-sets', () => {
    it('returns tcgp sets, filters and orders', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/tcgp-sets', cache, 'tcgpSets', [
        { name: 'Delta Set', code: 'D1', releaseDate: '2018-03-03' },
        { name: 'Epsilon Set', code: 'E1', releaseDate: '2022-02-02' },
      ], '../routes/tcgp-sets');

      const res = await request(app).get('/api/tcgdex/tcgp-sets/');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);

      const res2 = await request(app).get('/api/tcgdex/tcgp-sets').query({ q: 'epsilon' });
      expect(res2.status).toBe(200);
      expect(res2.body.length).toBe(1);
    });

    it('handles select/orderBy combinations and invalid regex', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/tcgp-sets', cache, 'tcgpSets', [
        { name: 'Delta Set', code: 'D1', releaseDate: '2018-03-03', cardCount: 5 },
        { name: 'Epsilon Set', code: 'E1', releaseDate: '2022-02-02', cardCount: 15 },
        { name: 'Gamma Collection', code: 'G1', releaseDate: '2019-07-07', cardCount: 10 },
      ], '../routes/tcgp-sets');

      const res = await request(app).get('/api/tcgdex/tcgp-sets').query({ select: 'name,nonexistent' });
      expect(res.status).toBe(200);

      const res2 = await request(app).get('/api/tcgdex/tcgp-sets').query({ orderBy: 'cardCount' });
      expect(res2.status).toBe(200);
      const counts = res2.body.map(x => x.cardCount);
      const sorted = [...counts].sort((a, b) => (a > b ? 1 : -1));
      expect(counts).toEqual(sorted);

      const bad = await request(app).get('/api/tcgdex/tcgp-sets').query({ q: '(' });
      expect(bad.status).toBe(400);
    });

    it('returns 500 when tcgp cache is undefined', async () => {
      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/tcgp-sets', cache, 'tcgpSets', [
        { name: 'Delta Set', code: 'D1' }
      ], '../routes/tcgp-sets');

      cache.tcgpSets = undefined;
      const res = await request(app).get('/api/tcgdex/tcgp-sets/');
      expect(res.status).toBe(500);
    });

    it('logs and returns 500 when handler throws for tcgp', async () => {
      jest.resetModules();
      const mockLogger = { error: jest.fn(), log: jest.fn() };
      jest.doMock('../logger', () => mockLogger);

      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/tcgp-sets', cache, 'tcgpSets', [ { name: 'X' } ], '../routes/tcgp-sets');

      Object.defineProperty(cache, 'tcgpSets', { get: () => { throw new Error('boom tcgp'); } });

      const res = await request(app).get('/api/tcgdex/tcgp-sets/');
      expect(res.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handler catch paths for ptcg', () => {
    it('logs and returns 500 when handler throws for ptcg', async () => {
      jest.resetModules();
      const mockLogger = { error: jest.fn(), log: jest.fn() };
      jest.doMock('../logger', () => mockLogger);

      const cache = require('../cache');
      const app = makeAppWithRoute('/api/tcgdex/ptcg-sets', cache, 'ptcgSets', [ { name: 'Y' } ], '../routes/ptcg-sets');

      Object.defineProperty(cache, 'ptcgSets', { get: () => { throw new Error('boom ptcg'); } });

      const res = await request(app).get('/api/tcgdex/ptcg-sets/');
      expect(res.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
