const request = require('supertest');
const express = require('express');
const pingRoutes = require('../routes/ping');

describe('GET /api/ping', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use('/api/ping', pingRoutes);
    });

    it('responds with Pong from backend', async () => {
        const res = await request(app).get('/api/ping/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({message: 'Pong from backend'});
    });
});
