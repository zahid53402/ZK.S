const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// ZAHID KING Branding
const AUTHOR = "ZAHID KING";

// HTML file dikhane ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Session ID generate karne ki logic
app.get('/generate', (req, res) => {
    const sessionId = `ZAHID-KING-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    res.json({
        success: true,
        owner: AUTHOR,
        session_id: sessionId,
        timestamp: new Date().toLocaleString()
    });
});

app.listen(PORT, () => {
    console.log(`[${AUTHOR}] Generator is live on port ${PORT}`);
});
