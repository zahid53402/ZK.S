const express = require('express');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Please provide a phone number" });

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    
    try {
        let conn = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!conn.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await conn.requestPairingCode(num);
            if (!res.headersSent) {
                res.json({ code: code });
            }
        }
        
        conn.ev.on('creds.update', saveCreds);
        conn.ev.on("connection.update", async (s) => {
            const { connection } = s;
            if (connection === "open") {
                console.log("Connected to WhatsApp!");
                // Yahan aap apna session ID generate kar ke user ko bhej sakte hain
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Service Busy" });
    }
});

app.listen(PORT, () => console.log(`ZAHID KING Server live on ${PORT}`));
