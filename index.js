const express = require('express');
const app = express();
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require('path');

// Replit Networking کے مطابق پورٹ سیٹنگ
const PORT = process.env.PORT || 80; 

app.use(express.static('public'));

// ہوم پیج روٹ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Number is required" });

    const { state, saveCreds } = await useMultiFileAuthState(`./temp/${num}`);
    
    try {
        const zkConn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
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
                await delay(5000); // کریڈٹ فائل بننے کا انتظار
                const sessionPath = `./temp/${num}/creds.json`;
                if (fs.existsSync(sessionPath)) {
                    const session = fs.readFileSync(sessionPath);
                    const b64 = Buffer.from(session).toString("base64");
                    const sessionId = "ZAHID_KING_MD_" + b64;
                    
                    await zkConn.sendMessage(zkConn.user.id, { text: sessionId });
                    await zkConn.sendMessage(zkConn.user.id, { text: "👑 *SUCCESS!* Your Session ID is above. Copy it for deployment. Powered by Zahid King." });
                    
                    await delay(2000);
                    fs.removeSync(`./temp/${num}`);
                }
            }
        });

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ error: "Server Error" });
    }
});

// Replit کے لیے ہوسٹ 0.0.0.0 لازمی ہے
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
👑 ZAHID KING MD SESSION GENERATOR 👑
🚀 Live on Port: ${PORT}
🔗 Ready for Pairing Code requests
    `);
});
