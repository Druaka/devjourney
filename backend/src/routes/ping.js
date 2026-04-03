const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.json({message: 'Pong from backend'});
});

module.exports = router;
