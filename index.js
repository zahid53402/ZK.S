const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/session', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    
    const client = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["ZAHID KING", "Chrome", "1.0.0"]
    });

    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // QR code ko web page par dikhane ke liye image mein convert karna
            const qrImage = await QRCode.toDataURL(qr);
            res.send(`<html><body style="background:#000; color:#fff; text-align:center; font-family:sans-serif;">
                <h1>ZAHID KING SESSION GENERATOR</h1>
                <img src="${qrImage}" style="border:10px solid white; border-radius:10px; margin-top:20px;" />
                <p>Scan this QR with your WhatsApp Linked Devices</p>
                <footer style="margin-top:50px;">Created by: ZAHID KING</footer>
            </body></html>`);
        }

        if (connection === "open") {
            const sessionData = fs.readFileSync("./session/creds.json");
            const sessionId = Buffer.from(sessionData).toString("base64");

            const msg = `🌟 *ZAHID KING SESSION ID* 🌟\n\nID: ZAHID-KING~${sessionId}\n\n*Owner:* ZAHID KING\n*GitHub:* github.com/zahid53402`;
            
            await client.sendMessage(client.user.id, { text: msg });
            console.log("Session Sent!");
            // Yahan aap redirect bhi kar sakte hain success page par
        }
    });

    client.ev.on("creds.update", saveCreds);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

