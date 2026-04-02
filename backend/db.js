require('dotenv').config();

const mongoose = require('mongoose');
const TCGdex = require('@tcgdex/sdk').default;
const throttledQueue = require('throttled-queue');
const {TcgpSetModel, PtcgSetModel} = require('./schemas');
const {Query} = require("@tcgdex/sdk");
const uri = process.env.MONGODB_URI;

// Instantiate the SDK with your preferred language
const tcgdex = new TCGdex('en');
const throttle = throttledQueue(500, 10);

// Import the cache module
const cache = require('./cache');

async function connectAndSeedDB() {
    try {
        await mongoose.connect(uri, {});
        console.log('Connected to MongoDB');

        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped');

        const {ptcgSets, tcgpSets} = await fetchData();

        await storePtcgSets(ptcgSets);
        await storeTcgpSets(tcgpSets);

        // Store in memory
        cache.ptcgSets = ptcgSets.map(set => set.toObject ? set.toObject() : set);
        cache.tcgpSets = tcgpSets.map(set => set.toObject ? set.toObject() : set);

        console.log('Database seeding complete');
    } catch (err) {
        console.error('Error during DB setup:', err);
        throw err;
    }
}

async function fetchData() {
    try {
        // Fetch all Pokémon TCG sets
        const ptcgQuery = Query.create().sort("releaseDate", "DESC").not.equal("serie.id", "tcgp");
        const ptcgSetResumes = await tcgdex.set.list(ptcgQuery);
        const ptcgSets = await fetchSetDetails(ptcgSetResumes);

        // Fetch all Pokémon Trading Card Game Pocket sets
        const tcgpQuery = Query.create().sort("releaseDate", "DESC").equal("serie.id", "tcgp");
        const tcgpSetResumes = await tcgdex.set.list(tcgpQuery);
        const tcgpSets = await fetchSetDetails(tcgpSetResumes);

        return {ptcgSets, tcgpSets};
    } catch (error) {
        console.error('Error fetching data via TCGdex SDK:', error);
        return {ptcgSets: [], tcgpSets: []};
    }
}

async function fetchSetDetails(setResumes) {
    console.log(`Fetched ${setResumes.length} set resumes`);
    console.log('Fetching full set details');
    const sets = [];
    for (const setResume of setResumes) {
        await throttle(async () => {
            try {
                const set = await tcgdex.set.get(setResume.id);
                // Strip circular references by selecting only the necessary fields
                const safeSet = {
                    id: set.id,
                    name: set.name,
                    releaseDate: set.releaseDate,
                    cardCount: set.cardCount,
                    logo: set.logo,
                    serie: set.serie,
                    cards: set.cards?.map(card => ({
                        id: card.id,
                        name: card.name,
                        image: card.image,
                        localId: card.localId
                    }))
                };
                sets.push(safeSet);
            } catch (error) {
                console.error(`Error fetching set ${setResume.id}:`, error);
            }
        });
    }
    return sets;
}

async function storePtcgSets(ptcgSets) {
    try {
        await PtcgSetModel.insertMany(ptcgSets);
        console.log('PtcgSets successfully stored in MongoDB');
    } catch (error) {
        console.error('Error storing PtcgSets in MongoDB:', error);
    }
}

async function storeTcgpSets(tcgpSets) {
    try {
        await TcgpSetModel.insertMany(tcgpSets);
        console.log('TcgpSets successfully stored in MongoDB');
    } catch (error) {
        console.error('Error storing TcgpSets in MongoDB:', error);
    }
}

module.exports = connectAndSeedDB;
