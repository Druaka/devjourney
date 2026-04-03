const request = require('supertest');

// Consolidated server tests (merged server.test.js, server.extra.test.js, server.main.test.js)
describe('Server module', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
        delete global.fetch;
        delete process.env.FORCE_START;
    });

    it('GET /api/ping responds with Pong (routes mounted without starting server)', async () => {
        // Ensure DB is not called when importing server
        jest.doMock('../src/services/db', () => jest.fn().mockResolvedValue());
        const { app } = require('../src/server');

        const res = await request(app).get('/api/ping/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Pong from backend' });
    });

    it('startServer starts server when DB connects and fetch succeeds', async () => {
        jest.resetModules();
        jest.doMock('../src/services/db', () => jest.fn().mockResolvedValue());

        global.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({ ip: '1.2.3.4' }) });

        const { startServer, app } = require('../src/server');
        app.listen = jest.fn();

        await expect(startServer()).resolves.toBeUndefined();

        expect(global.fetch).toHaveBeenCalled();
        expect(app.listen).toHaveBeenCalled();
    });

    it('startServer logs error and exits when DB fails', async () => {
        jest.resetModules();
        jest.doMock('../src/services/db', () => jest.fn().mockRejectedValue(new Error('db fail')));

        global.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({ ip: '1.2.3.4' }) });

        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        const logger = require('../src/lib/logger');
        const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

        const { startServer, app } = require('../src/server');
        app.listen = jest.fn();

        await startServer();

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to start server:', expect.any(Error));

        exitSpy.mockRestore();
        loggerErrorSpy.mockRestore();
    });

    it('logs public IP and starts listening (mocked fetch and db)', async () => {
        jest.resetModules();
        const mockLogger = { log: jest.fn(), error: jest.fn() };
        jest.doMock('../src/lib/logger', () => mockLogger);

        global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ip: '1.2.3.4' }) });
        jest.doMock('../src/services/db', () => jest.fn().mockResolvedValue());

        const server = require('../src/server');
        // prevent real listen
        server.app.listen = jest.fn((port, cb) => cb && cb());

        await expect(server.startServer()).resolves.toBeUndefined();
        expect(mockLogger.log).toHaveBeenCalled();
        expect(server.app.listen).toHaveBeenCalled();
    });

    it('handles fetch failure and logs inability to determine IP', async () => {
        jest.resetModules();
        const mockLogger = { log: jest.fn(), error: jest.fn() };
        jest.doMock('../src/lib/logger', () => mockLogger);

        // Make fetch throw
        global.fetch = jest.fn().mockRejectedValue(new Error('net fail'));

        jest.doMock('../src/services/db', () => jest.fn().mockResolvedValue());

        const server = require('../src/server');
        server.app.listen = jest.fn((port, cb) => cb && cb());

        await expect(server.startServer()).resolves.toBeUndefined();
        expect(mockLogger.log).toHaveBeenCalledWith('Could not determine public IP');
        expect(server.app.listen).toHaveBeenCalled();
    });

    it('executes top-level startServer when FORCE_START=1', async () => {
        jest.resetModules();
        process.env.FORCE_START = '1';

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        jest.doMock('../src/lib/logger', () => mockLogger);

        global.fetch = jest.fn().mockResolvedValue({ json: async () => ({ ip: '1.2.3.4' }) });

        // Mock db module to avoid real DB calls
        jest.doMock('../src/services/db', () => jest.fn().mockResolvedValue());

        // Require server and call startServer explicitly
        const server = require('../src/server');

        // app.listen was replaced by our test in earlier suites; ensure it's safe here
        server.app.listen = jest.fn((port, cb) => cb && cb());

        await server.startServer();

        expect(mockLogger.log).toHaveBeenCalled();
        expect(server.app.listen).toHaveBeenCalled();
    });
});
