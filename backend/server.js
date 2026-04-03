const express = require('express');
const cors = require('cors');
const pingRoutes = require('./routes/ping.js');
const setsPtcgRoutes = require('./routes/ptcg-sets.js');
const setsTcgpRoutes = require('./routes/tcgp-sets.js');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
const logger = require('./logger');

// Log the server's public IP on startup (useful for DB IP whitelisting)
async function logPublicIp() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        logger.log(`Server public IP: ${data.ip} (whitelist this in your database network settings)`);
    } catch {
        logger.log('Could not determine public IP');
    }
}

// Mount routes so the app is usable in tests without starting the server
app.use('/api/ping', pingRoutes);
app.use('/api/tcgdex/ptcg-sets', setsPtcgRoutes);
app.use('/api/tcgdex/tcgp-sets', setsTcgpRoutes);

// Main function to setup DB then start server
async function startServer() {
    try {
        await logPublicIp();
        await require('./db.js')();

        app.listen(port, () => {
            logger.log(`Backend listening at http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

module.exports = { app, startServer };

// Allow forcing the server to start (useful for tests).
if (require.main === module || process.env.FORCE_START === '1') {
    startServer();
}
