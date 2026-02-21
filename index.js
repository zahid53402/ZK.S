const express = require('express');
const app = express();
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");

const PORT = process.env.PORT || 3000;

// یہ لائن 'public' فولڈر کو ایکٹو کرتی ہے
app.use(express.static('public'));

app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number is required" });

    const { state, saveCreds } = await useMultiFileAuthState(`./temp/${num}`);
    
    try {
        const zkConn = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Zahid King MD", "Chrome", "1.0.0"]
        });

        if (!zkConn.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await zkConn.requestPairingCode(num);
            if (!res.headersSent) {
                res.json({ code: code });
            }
        }

        zkConn.ev.on('creds.update', saveCreds);
        zkConn.ev.on("connection.update", async (s) => {
            const { connection } = s;
            if (connection == "open") {
                const session = fs.readFileSync(`./temp/${num}/creds.json`);
                const b64 = Buffer.from(session).toString("base64");
                const sessionId = "ZAHID_KING_MD_" + b64;
                
                await zkConn.sendMessage(zkConn.user.id, { text: sessionId });
                await delay(2000);
                fs.removeSync(`./temp/${num}`);
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => console.log(`Generator Live on http://localhost:${PORT}`));
