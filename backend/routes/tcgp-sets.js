const express = require('express');
const router = express.Router();
const cache = require('../cache');

router.get('/', (req, res) => {
    try {
        const {q, orderBy, select} = req.query;
        // Validate cache availability
        if (!Array.isArray(cache.tcgpSets)) {
            return res.status(500).json({ error: 'Sets cache not available' });
        }

        let results = cache.tcgpSets;

        if (q) {
            let regex;
            try {
                regex = new RegExp(q, 'i');
            } catch (err) {
                return res.status(400).json({ error: 'Invalid query regex' });
            }
            results = results.filter(set => regex.test(set.name));
        }

        if (select) {
            const fields = select.split(',');
            results = results.map(set =>
                fields.reduce((obj, key) => {
                    obj[key] = set[key];
                    return obj;
                }, {})
            );
        }

        if (orderBy) {
            results = results.sort((a, b) => (a[orderBy] > b[orderBy] ? 1 : -1));
        }

        res.json(results);
    } catch (error) {
        const logger = require('../logger');
        logger.error('Error fetching sets data:', error);
        res.status(500).json({error: 'Failed to fetch sets data'});
    }
});

module.exports = router;
