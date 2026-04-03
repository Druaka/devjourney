const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    id: String,
    localId: String,
    name: String,
    image: String,
    category: String,
    illustrator: String,
    rarity: String,
    variants: {
        normal: Boolean,
        reverse: Boolean,
        holo: Boolean,
        firstEdition: Boolean,
    },
    set: {
        id: String,
        name: String,
        logo: String,
        symbol: String,
        cardCount: {
            official: Number,
            total: Number,
        },
    },
    hp: Number,
    types: [String],
    evolveFrom: String,
    description: String,
    stage: String,
    attacks: [{
        cost: [String],
        name: String,
        effect: String,
        damage: Number,
    }],
    weaknesses: [{
        type: String,
        value: String,
    }],
    retreat: Number,
    regulationMark: String,
    legal: {
        standard: Boolean,
        expanded: Boolean,
    },
});

const setSchema = new mongoose.Schema({
    id: String,
    name: String,
    logo: String,
    symbol: String,
    cardCount: {
        official: Number,
        total: Number,
        reverse: Number,
        holo: Number,
        firstEd: Number,
    },
    serie: {
        id: String,
        name: String,
    },
    tcgOnline: String,
    releaseDate: String,
    legal: {
        standard: Boolean,
        expanded: Boolean,
    },
    cards: [cardSchema],
});

const PtcgSetModel = mongoose.model('PtcgSet', setSchema);
const TcgpSetModel = mongoose.model('TcgpSet', setSchema);

module.exports = {
    PtcgSetModel,
    TcgpSetModel,
};
