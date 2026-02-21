const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 8080;

// Branding for ZAHID KING
const AUTHOR = "ZAHID KING";

app.get('/', (req, res) => {
    res.send(`<h1>Welcome to ${AUTHOR} Session Generator</h1><p>Use /generate to get a session ID.</p>`);
});

app.get('/generate', (req, res) => {
    // Cryptographically secure 32-character ID
    const sessionId = `ZAHID-KING-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    
    res.json({
        success: true,
        owner: AUTHOR,
        session_id: sessionId,
        timestamp: new Date().toLocaleString()
    });
});

app.listen(PORT, () => {
    console.log(`[${AUTHOR}] Generator is running on port ${PORT}`);
});

