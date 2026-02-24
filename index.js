const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const chalk = require('chalk');

async function startZahidBot() {
    const sessionDir = './session';
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

    // سیشن آئی ڈی کو فائل میں بدلنا
    if (process.env.SESSION_ID && !fs.existsSync(`${sessionDir}/creds.json`)) {
        try {
            let data = process.env.SESSION_ID.replace(/ZAHID_KING_MD_/g, "");
            fs.writeFileSync(`${sessionDir}/creds.json`, Buffer.from(data, 'base64').toString());
            console.log(chalk.green('✅ Session ID Converted!'));
        } catch (e) {
            console.log(chalk.red('❌ Invalid Session ID Format!'));
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: browser: ["Zahid King MD", "Safari", "3.0.0"]
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) console.log(chalk.yellow('⚠️ Session Expired! Please Scan New QR or Update Session ID.'));

        if (connection === 'open') {
            console.log(chalk.green('🚀 ZAHID KING MD IS CONNECTED!'));
            client.sendMessage(client.user.id, { text: ' Zahid King MD Connected Successfully! ✅' });
        }

        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.red('🔄 Connection lost, reconnecting...'));
                startZahidBot();
            } else {
                console.log(chalk.red('❌ Logged out! Please delete session folder and scan again.'));
            }
        }
    });
}

startZahidBot();

