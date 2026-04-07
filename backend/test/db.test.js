jest.useRealTimers();

describe('services/db exports', () => {
    beforeEach(() => {
        jest.resetModules();
        // ensure a clean env for each test
        delete process.env.MONGODB_URI;
    });

    it('logMongoSelectionHelp logs helpful message', () => {
        const db = require('../src/services/db');
        const logger = { error: jest.fn() };
        db.logMongoSelectionHelp(logger);
        expect(logger.error).toHaveBeenCalled();
        expect(logger.error.mock.calls[0][0]).toEqual(expect.stringContaining('Failed to connect to MongoDB'));
    });

    it('applySetsToCache normalizes documents with toObject', () => {
        const mockCache = {};
        jest.doMock('../src/lib/cache', () => mockCache, { virtual: false });
        const db = require('../src/services/db');

        const ptcgSets = [
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B', toObject: () => ({ id: 'b', name: 'B' }) }
        ];
        const tcgpSets = [
            { id: 'c', toObject: () => ({ id: 'c' }) }
        ];

        db.applySetsToCache(ptcgSets, tcgpSets);

        expect(mockCache.ptcgSets).toHaveLength(2);
        expect(mockCache.ptcgSets[0]).toEqual({ id: 'a', name: 'A' });
        expect(mockCache.ptcgSets[1]).toEqual({ id: 'b', name: 'B' });
        expect(mockCache.tcgpSets).toHaveLength(1);
        expect(mockCache.tcgpSets[0]).toEqual({ id: 'c' });
    });

    it('handleDbSetupError logs selection help for MongoServerSelectionError and logs error', () => {
        const db = require('../src/services/db');
        const logger = { error: jest.fn() };
        const err = { name: 'MongoServerSelectionError', message: 'no hosts found' };
        db.handleDbSetupError(err, logger);
        // logMongoSelectionHelp should have invoked logger.error with help text
        expect(logger.error).toHaveBeenCalled();
        // ensure final error log includes the message
        const calls = logger.error.mock.calls.map(c => c.join(' '));
        expect(calls.some(c => c.includes('Failed to connect to MongoDB'))).toBe(true);
        expect(calls.some(c => c.includes('Error during DB setup:')) || calls.some(c => c.includes('no hosts found'))).toBe(true);
    });

    it('connectAndSeedDB throws when MONGODB_URI is not set', async () => {
        const db = require('../src/services/db');
        await expect(db()).rejects.toThrow('MONGODB_URI is not set');
    });

    it('connectAndSeedDB delegates MongoServerSelectionError to handler and rethrows', async () => {
        // mock mongoose to throw a MongoServerSelectionError on connect
        const mockError = new Error('server selection failed');
        mockError.name = 'MongoServerSelectionError';

        jest.doMock('mongoose', () => {
            class Schema {
                constructor(def) { this.definition = def; }
            }
            const mockModel = () => ({ bulkWrite: jest.fn(() => Promise.resolve()) });
            return {
                Schema,
                model: jest.fn(mockModel),
                connect: jest.fn(() => Promise.reject(mockError)),
            };
        }, { virtual: false });

        // inject a logger so we can assert logging
        const logger = { log: jest.fn(), error: jest.fn() };

        // ensure MONGODB_URI is set so the function proceeds to connect
        process.env.MONGODB_URI = 'mongodb://localhost:27017/fake';

        // require the module after mocking mongoose
        const db = require('../src/services/db');

        await expect(db({ tcgdex: {}, Query: {}, logger })).rejects.toThrow();
        expect(logger.error).toHaveBeenCalled();
    });

    it('connectAndSeedDB seeds data and updates cache on success', async () => {
        jest.resetModules();
        // mock mongoose connect to succeed
        jest.doMock('mongoose', () => ({
            connect: jest.fn(() => Promise.resolve()),
        }), { virtual: false });

        // mock throttled-queue to run immediately
        jest.doMock('throttled-queue', () => () => (fn) => Promise.resolve(fn()), { virtual: false });

        // mock models to provide bulkWrite spies
        const ptcgBulk = jest.fn(() => Promise.resolve());
        const tcgpBulk = jest.fn(() => Promise.resolve());
        jest.doMock('../src/models/schemas', () => ({
            PtcgSetModel: { bulkWrite: ptcgBulk },
            TcgpSetModel: { bulkWrite: tcgpBulk },
        }), { virtual: false });

        // real cache module to observe changes
        const cache = require('../src/lib/cache');

        const fakeSets = [{ id: 's1', name: 'Set 1', cards: [] }];
        const fakeTcgdex = {
            set: {
                list: jest.fn(async () => [{ id: 's1' }]),
                get: jest.fn(async (id) => ({ id: 's1', name: 'Set 1', releaseDate: '2020-01-01', cardCount: 10, logo: null, serie: {}, cards: [] }))
            }
        };

        const Query = {
            create: () => ({ sort: () => ({ not: { equal: () => {} }, equal: () => {} }) })
        };

        const logger = { log: jest.fn(), error: jest.fn() };
        process.env.MONGODB_URI = 'mongodb://localhost:27017/fake';

        const db = require('../src/services/db');

        await expect(db({ tcgdex: fakeTcgdex, Query, logger })).resolves.toBeUndefined();

        expect(ptcgBulk).toHaveBeenCalled();
        expect(tcgpBulk).toHaveBeenCalled();
        expect(cache.ptcgSets).toHaveLength(1);
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Idempotent seeding complete'));
    });

    it('connectAndSeedDB handles TCGdex SDK failures gracefully', async () => {
        jest.resetModules();
        jest.doMock('mongoose', () => ({ connect: jest.fn(() => Promise.resolve()) }), { virtual: false });
        jest.doMock('throttled-queue', () => () => (fn) => Promise.resolve(fn()), { virtual: false });

        // ensure bulkWrite spies to ensure they are not called
        const ptcgBulk = jest.fn(() => Promise.resolve());
        const tcgpBulk = jest.fn(() => Promise.resolve());
        jest.doMock('../src/models/schemas', () => ({
            PtcgSetModel: { bulkWrite: ptcgBulk },
            TcgpSetModel: { bulkWrite: tcgpBulk },
        }), { virtual: false });

        const cache = require('../src/lib/cache');

        const fakeTcgdex = {
            set: {
                list: jest.fn(() => { throw new Error('sdk failure'); }),
            }
        };
        const Query = { create: () => ({ sort: () => ({ not: { equal: () => {} }, equal: () => {} }) }) };
        const logger = { log: jest.fn(), error: jest.fn() };
        process.env.MONGODB_URI = 'mongodb://localhost:27017/fake';

        const db = require('../src/services/db');

        // should throw because fetchData will return empty arrays but code continues; connectAndSeedDB should complete without throwing
        await expect(db({ tcgdex: fakeTcgdex, Query, logger })).resolves.toBeUndefined();

        // bulkWrite should not have been called due to empty sets
        expect(ptcgBulk).not.toHaveBeenCalled();
        expect(tcgpBulk).not.toHaveBeenCalled();
        expect(cache.ptcgSets).toEqual([]);
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error fetching data via TCGdex SDK:'), expect.any(Error));
    });
});
