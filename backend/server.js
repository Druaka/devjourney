const express = require('express');
const cors = require('cors');
const pingRoutes = require('./routes/ping.js');
const setsPtcgRoutes = require('./routes/ptcg-sets.js');
const setsTcgpRoutes = require('./routes/tcgp-sets.js');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Log the server's public IP on startup (useful for DB IP whitelisting)
async function logPublicIp() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        console.log(`Server public IP: ${data.ip} (whitelist this in your database network settings)`);
    } catch {
        console.log('Could not determine public IP');
    }
}

// Main function to setup DB then start server
async function startServer() {
    try {
        await logPublicIp();
        await require('./db.js')();

        // Use the routes
        app.use('/api/ping', pingRoutes);
        app.use('/api/tcgdex/ptcg-sets', setsPtcgRoutes);
        app.use('/api/tcgdex/tcgp-sets', setsTcgpRoutes);

        app.listen(port, () => {
            console.log(`Backend listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
