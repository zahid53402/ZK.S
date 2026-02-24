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
const yts = require('yt-search');

const config = {
    name: "Zᴀʜɪᴅ Kɪɴɢ",
    owner: "923044154575",
    prefix: ".",
    pic: "https://i.ibb.co/LdFF4pSF/temp.jpg",
    song: "https://files.catbox.moe/5kkxwz.mpeg"
};

async function startZahidBot() {
    // --- 🔑 سخت سیشن ہینڈلر ---
    try {
        if (process.env.SESSION_ID) {
            console.log(chalk.yellow('🔎 Checking SESSION_ID from Railway...'));
            const sessionDir = './session';
            if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
            
            // سیشن آئی ڈی سے فالتو الفاظ صاف کرنا
            let credsData = process.env.SESSION_ID;
            if (credsData.includes('ZAHID_KING_MD_')) {
                credsData = credsData.split('ZAHID_KING_MD_')[1];
            }
            
            // Base64 کو دوبارہ فائل میں بدلنا
            const decoded = Buffer.from(credsData, 'base64').toString('utf-8');
            fs.writeFileSync(`${sessionDir}/creds.json`, decoded);
            console.log(chalk.green('✅ Session File Fixed and Loaded!'));
        }
    } catch (err) {
        console.log(chalk.red('❌ Session decoding failed: ' + err.message));
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true, // اگر سیشن فیل ہوا تو کم از کم QR تو دکھائے گا
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) console.log(chalk.magenta('⚠️ Session ID not working, please scan this QR!'));
        
        if (connection === 'open') {
            console.log(chalk.green('🚀 Zahid King MD is now ONLINE!'));
            client.sendMessage(config.owner + "@s.whatsapp.net", { text: "Zahid King MD Connected Successfully! ✅" });
        }
        
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) startZahidBot();
        }
    });

    // --- سادہ کمانڈ ہینڈلر ---
    client.ev.on('messages.upsert', async (chatUpdate) => {
        const msg = chatUpdate.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (body === config.prefix + "alive") {
            await client.sendMessage(from, { text: "Zahid King MD is Active! 🚀" });
        }
        
        if (body === config.prefix + "menu") {
            await client.sendMessage(from, { 
                image: { url: config.pic }, 
                caption: `👑 *${config.name}* \n\n.alive\n.song\n.kick` 
            });
        }
    });
}

startZahidBot();
