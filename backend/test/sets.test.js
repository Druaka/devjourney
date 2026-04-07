const request = require('supertest');
const express = require('express');

const ptcgRoutes = require('../src/routes/ptcg-sets');
const tcgpRoutes = require('../src/routes/tcgp-sets');
const cache = require('../src/lib/cache');

describe('Sets routes', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use('/api/ptcg-sets', ptcgRoutes);
        app.use('/api/tcgp-sets', tcgpRoutes);
    });

    beforeEach(() => {
        // reset caches
        cache.ptcgSets = [
            { name: 'Alpha Set', code: 'ALP', year: 2020 },
            { name: 'Beta Set', code: 'BET', year: 2019 },
            { name: 'Gamma Collection', code: 'GAM', year: 2021 }
        ];
        cache.tcgpSets = JSON.parse(JSON.stringify(cache.ptcgSets));
    });

    const endpoints = [
        { path: '/api/ptcg-sets', key: 'ptcgSets' },
        { path: '/api/tcgp-sets', key: 'tcgpSets' }
    ];

    endpoints.forEach(({ path, key }) => {
        describe(path, () => {
            it('returns all sets when no query', async () => {
                const res = await request(app).get(path + '/');
                expect(res.status).toBe(200);
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(3);
            });

            it('filters by q (regex, case-insensitive)', async () => {
                const res = await request(app).get(path + '/').query({ q: 'alpha' });
                expect(res.status).toBe(200);
                expect(res.body.length).toBe(1);
                expect(res.body[0].name).toBe('Alpha Set');
            });

            it('returns 400 for invalid regex in q', async () => {
                const res = await request(app).get(path + '/').query({ q: '[' });
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('selects only requested fields', async () => {
                const res = await request(app).get(path + '/').query({ select: 'name,code' });
                expect(res.status).toBe(200);
                expect(res.body[0]).toHaveProperty('name');
                expect(res.body[0]).toHaveProperty('code');
                expect(res.body[0]).not.toHaveProperty('year');
            });

            it('orders by given field (ascending)', async () => {
                const res = await request(app).get(path + '/').query({ orderBy: 'name' });
                expect(res.status).toBe(200);
                const names = res.body.map(s => s.name);
                const sorted = [...names].sort((a, b) => (a > b ? 1 : -1));
                expect(names).toEqual(sorted);
            });

            it('returns 500 when cache is not available', async () => {
                const original = cache[key];
                cache[key] = null;
                const res = await request(app).get(path + '/');
                expect(res.status).toBe(500);
                expect(res.body).toHaveProperty('error');
                cache[key] = original;
            });
        });
    });
});
