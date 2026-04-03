// Consolidated DB tests (merged)

jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(),
    connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
}));

jest.mock('../src/models/schemas', () => {
    const insertManyP = jest.fn().mockResolvedValue();
    const insertManyT = jest.fn().mockResolvedValue();
    return {
        PtcgSetModel: { insertMany: insertManyP },
        TcgpSetModel: { insertMany: insertManyT },
    };
});

// Additional targeted tests to cover default SDK/Query and fetchData error branch
describe('db targeted coverage', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
    });

    it('uses default @tcgdex/sdk and Query when not provided (constructor invoked)', async () => {
        const constructed = { value: false };

        jest.doMock('@tcgdex/sdk', () => {
            class TCGdexMock {
                constructor() { constructed.value = true; }
                set = { list: jest.fn().mockResolvedValue([]), get: jest.fn().mockResolvedValue({}) };
            }
            const Query = { create: () => ({ sort: () => ({ not: { equal: () => ({} ) }, equal: () => ({}) }) }) };
            return { default: TCGdexMock, Query, __constructed: constructed };
        });

        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() }, TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() } }));

        const connectAndSeedDB = require('../src/services/db');
        await expect(connectAndSeedDB()).resolves.toBeUndefined();

        const sdk = require('@tcgdex/sdk');
        expect(sdk.__constructed.value).toBe(true);
    });

    it('fetchData logs and returns empty sets when SDK list throws (covers catch branch)', async () => {
        jest.doMock('@tcgdex/sdk', () => {
            class TCGdexMock {
                constructor() {}
                set = { list: jest.fn().mockRejectedValue(new Error('list failed')), get: jest.fn() };
            }
            const Query = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
            return { default: TCGdexMock, Query };
        });

        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        const insertP = jest.fn().mockResolvedValue();
        const insertT = jest.fn().mockResolvedValue();
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertP }, TcgpSetModel: { insertMany: insertT } }));

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ logger: mockLogger })).resolves.toBeUndefined();

        const called = mockLogger.error.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('Error fetching data via TCGdex SDK:'));
        expect(called).toBeTruthy();
    });

    it('applySetsToCache normalizes documents and plain objects into cache (covers lines 22-23)', () => {
        jest.resetModules();
        const db = require('../src/services/db');
        const cache = require('../src/lib/cache');

        // prepare inputs: one doc-like with toObject, one plain object
        const docLike = { toObject: () => ({ id: 'd1', name: 'Doc' }) };
        const plain = { id: 'p1', name: 'Plain' };

        // clear cache first
        cache.ptcgSets = [];
        cache.tcgpSets = [];

        db.applySetsToCache([docLike], [plain]);

        expect(cache.ptcgSets[0].name).toBe('Doc');
        expect(cache.tcgpSets[0].name).toBe('Plain');
    });

    it('calls logMongoSelectionHelp when an error with name MongoServerSelectionError is thrown (covers line 66)', async () => {
        jest.resetModules();
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';

        // Simulate mongoose.connect rejecting with a MongoServerSelectionError
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockRejectedValue(Object.assign(new Error('connect fail'), { name: 'MongoServerSelectionError' })),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() }, TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() } }));

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ logger: mockLogger })).rejects.toBeDefined();

        const firstErrorMsg = mockLogger.error.mock.calls.flat().join(' ');
        expect(firstErrorMsg).toMatch(/Failed to connect to MongoDB/);
    });

    it('applySetsToCache handles toObject on both ptcg and tcgp arrays (additional branch)', () => {
        jest.resetModules();
        const db = require('../src/services/db');
        const cache = require('../src/lib/cache');

        const docA = { toObject: () => ({ id: 'a', name: 'A' }) };
        const docB = { toObject: () => ({ id: 'b', name: 'B' }) };

        cache.ptcgSets = [];
        cache.tcgpSets = [];

        db.applySetsToCache([docA], [docB]);

        expect(cache.ptcgSets[0].name).toBe('A');
        expect(cache.tcgpSets[0].name).toBe('B');
    });

    it('handles synchronous connect throwing MongoServerSelectionError (covers line 66 alternative)', async () => {
        jest.resetModules();
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';

        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockImplementation(() => { throw Object.assign(new Error('sync fail'), { name: 'MongoServerSelectionError' }); }),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() }, TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() } }));

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ logger: mockLogger })).rejects.toBeDefined();

        const allErrors = mockLogger.error.mock.calls.flat().join(' ');
        expect(allErrors).toMatch(/Failed to connect to MongoDB/);
    });

    it('covers MongoServerSelectionError thrown by dropDatabase (ensures catch branch executed)', async () => {
        jest.resetModules();
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';

        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockRejectedValue(Object.assign(new Error('drop fail'), { name: 'MongoServerSelectionError' })) } },
        }));

        jest.doMock('@tcgdex/sdk', () => {
            class TCGdexMock { constructor() {} set = { list: jest.fn().mockResolvedValue([]), get: jest.fn() } }
            const Query = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
            return { default: TCGdexMock, Query };
        });

        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() }, TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() } }));

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ logger: mockLogger })).rejects.toBeDefined();

        const allErrors = mockLogger.error.mock.calls.flat().join(' ');
        expect(allErrors).toMatch(/Failed to connect to MongoDB/);
    });

    it('handleDbSetupError helper calls logMongoSelectionHelp for MongoServerSelectionError (covers conditional line)', () => {
        jest.resetModules();
        const db = require('../src/services/db');
        const mockLogger = { error: jest.fn() };

        const err = Object.assign(new Error('selection'), { name: 'MongoServerSelectionError' });

        db.handleDbSetupError(err, mockLogger);

        const first = mockLogger.error.mock.calls[0][0];
        expect(first).toMatch(/Failed to connect to MongoDB/);
    });

    it('logMongoSelectionHelp directly logs the help message', () => {
        jest.resetModules();
        const db = require('../src/services/db');
        const mockLogger = { error: jest.fn() };

        db.logMongoSelectionHelp(mockLogger);

        expect(mockLogger.error).toHaveBeenCalled();
        const msg = mockLogger.error.mock.calls[0][0];
        expect(msg).toMatch(/Failed to connect to MongoDB/);
    });

    it('invoke handleDbSetupError without resetting modules to ensure call-site is executed', () => {
        const db = require('../src/services/db');
        const mockLogger = { error: jest.fn() };

        db.handleDbSetupError(Object.assign(new Error('e'), { name: 'MongoServerSelectionError' }), mockLogger);

        expect(mockLogger.error).toHaveBeenCalled();
    });
});

// ensure a test Mongo URI is present for the function
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devjourney_test';

const mongoose = require('mongoose');
const connectAndSeedDB = require('../src/services/db');

describe('db.connectAndSeedDB', () => {
    beforeAll(() => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
    });

    it('connects to mongoose and runs seeding flow without throwing (empty SDK results)', async () => {
        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([]),
                get: jest.fn().mockResolvedValue({}),
            },
        };

        const mockQuery = {
            create: jest.fn().mockImplementation(() => ({
                sort: () => ({
                    equal: () => ({}),
                    not: { equal: () => ({}) },
                }),
            })),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn() };

        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();
        expect(mongoose.connect).toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('calls insertMany when tcgdex returns set resumes and details', async () => {
        jest.resetModules();
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';

        // Mock mongoose and schemas explicitly for isolation
        const insertManyP = jest.fn().mockResolvedValue();
        const insertManyT = jest.fn().mockResolvedValue();
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertManyP }, TcgpSetModel: { insertMany: insertManyT } }));

        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([{ id: 's1' }]),
                get: jest.fn().mockResolvedValue({
                    id: 's1',
                    name: 'Set 1',
                    releaseDate: '2020-01-01',
                    cardCount: 10,
                    cards: [],
                }),
            },
        };

        const mockQuery = {
            create: jest.fn().mockImplementation(() => ({
                sort: () => ({
                    not: { equal: () => ({}) },
                    equal: () => ({}),
                }),
            })),
        };

        const mockLogger = { log: jest.fn(), error: jest.fn() };

        const connectAndSeedDB = require('../src/services/db');
        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();

        // retrieve the mocked schema functions to assert they were called
        const schemas = require('../src/models/schemas');
        expect(schemas.PtcgSetModel.insertMany).toHaveBeenCalled();
        expect(schemas.TcgpSetModel.insertMany).toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
    });
});

// Additional consolidated tests
describe('db extra error handling (consolidated)', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('throws when MONGODB_URI is not set', async () => {
        // Ensure env is empty
        delete process.env.MONGODB_URI;

        // Mock mongoose minimally so requiring module doesn't try to connect immediately
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        // Provide simple schemas mock
        jest.doMock('../src/models/schemas', () => ({
            PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() },
            TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() },
        }));

        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ tcgdex: { set: { list: jest.fn() } }, Query: { create: () => ({}) }, logger: { log: jest.fn(), error: jest.fn() } })).rejects.toThrow('MONGODB_URI is not set');
    });

    it('logs MongoServerSelectionError messages when connect fails', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockRejectedValue(Object.assign(new Error('connect fail'), { name: 'MongoServerSelectionError' })),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        jest.doMock('../src/models/schemas', () => ({
            PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() },
            TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() },
        }));

        const mockLogger = { log: jest.fn(), error: jest.fn() };
        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ tcgdex: { set: { list: jest.fn().mockResolvedValue([]), get: jest.fn() } }, Query: { create: () => ({}) }, logger: mockLogger })).rejects.toBeDefined();

        expect(mockLogger.error).toHaveBeenCalled();
        // Ensure a specific helpful message was emitted
        expect(mockLogger.error.mock.calls.flat().join('')).toMatch(/Failed to connect to MongoDB/);
    });

    it('logs when set.get fails during fetchSetDetails', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        const insertManyP = jest.fn().mockResolvedValue();
        const insertManyT = jest.fn().mockResolvedValue();
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertManyP }, TcgpSetModel: { insertMany: insertManyT } }));

        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([{ id: 's1' }]),
                get: jest.fn().mockRejectedValue(new Error('get failed')),
            },
        };

        const mockQuery = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
        const mockLogger = { log: jest.fn(), error: jest.fn() };

        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockLogger.error.mock.calls.flat().join('')).toMatch(/Error fetching set s1/);
    });

    it('logs when insertMany throws for PtcgSets', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        // Make insertMany reject to hit the catch branch
        const insertManyP = jest.fn().mockRejectedValue(new Error('insert fail'));
        const insertManyT = jest.fn().mockResolvedValue();
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertManyP }, TcgpSetModel: { insertMany: insertManyT } }));

        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([]),
                get: jest.fn().mockResolvedValue({}),
            },
        };

        const mockQuery = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
        const mockLogger = { log: jest.fn(), error: jest.fn() };

        const connectAndSeedDB = require('../src/services/db');

        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockLogger.error.mock.calls.flat().join('')).toMatch(/Error storing PtcgSets in MongoDB/);
    });

    it('uses default logger when none provided', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        jest.doMock('../src/models/schemas', () => ({
            PtcgSetModel: { insertMany: jest.fn().mockResolvedValue() },
            TcgpSetModel: { insertMany: jest.fn().mockResolvedValue() },
        }));

        const mockTcgdex = { set: { list: jest.fn().mockResolvedValue([]), get: jest.fn().mockResolvedValue({}) } };
        const mockQuery = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };

        const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const connectAndSeedDB = require('../src/services/db');
        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery })).resolves.toBeUndefined();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('maps card fields when set has cards (covers optional chaining map)', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        const insertManyP = jest.fn().mockResolvedValue();
        const insertManyT = jest.fn().mockResolvedValue();
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertManyP }, TcgpSetModel: { insertMany: insertManyT } }));

        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([{ id: 's1' }]),
                get: jest.fn().mockResolvedValue({
                    id: 's1', name: 'Set1', releaseDate: '2020-01-01', cardCount: 1,
                    cards: [{ id: 'c1', name: 'Card 1', image: 'img', localId: 'L1' }]
                }),
            },
        };

        const mockQuery = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
        const mockLogger = { log: jest.fn(), error: jest.fn() };

        const cache = require('../src/lib/cache');
        cache.ptcgSets = [];

        const connectAndSeedDB = require('../src/services/db');
        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();

        expect(cache.ptcgSets[0].cards[0].localId).toBe('L1');
    });

    it('logs when insertMany throws for TcgpSets', async () => {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/devjourney_test';
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockResolvedValue(),
            connection: { db: { dropDatabase: jest.fn().mockResolvedValue() } },
        }));

        const insertManyP = jest.fn().mockResolvedValue();
        const insertManyT = jest.fn().mockRejectedValue(new Error('tcgp insert fail'));
        jest.doMock('../src/models/schemas', () => ({ PtcgSetModel: { insertMany: insertManyP }, TcgpSetModel: { insertMany: insertManyT } }));

        const mockTcgdex = {
            set: {
                list: jest.fn().mockResolvedValue([]),
                get: jest.fn().mockResolvedValue({}),
            },
        };

        const mockQuery = { create: () => ({ sort: () => ({ not: { equal: () => ({}) }, equal: () => ({}) }) }) };
        const mockLogger = { log: jest.fn(), error: jest.fn() };

        const connectAndSeedDB = require('../src/services/db');
        await expect(connectAndSeedDB({ tcgdex: mockTcgdex, Query: mockQuery, logger: mockLogger })).resolves.toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockLogger.error.mock.calls.flat().join('')).toMatch(/Error storing TcgpSets in MongoDB/);
    });
});
