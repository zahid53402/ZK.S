const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require('path');
const app = express();

// Railway automatically assigns a port, so we must use process.env.PORT
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number missing" });

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    
    try {
        let conn = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["ZAHID-KING-MD", "Chrome", "1.0.0"]
        });

        if (!conn.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await conn.requestPairingCode(num);
            if (!res.headersSent) res.json({ code: code });
        }

        conn.ev.on('creds.update', saveCreds);
        conn.ev.on("connection.update", (s) => {
            if (s.connection === "open") console.log("WhatsApp Linked!");
        });
    } catch (err) {
        res.status(500).json({ error: "Server Busy" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
