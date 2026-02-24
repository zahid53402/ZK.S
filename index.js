const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs-extra');
const chalk = require('chalk');
const yts = require('yt-search');

// --- آپ کی فراہم کردہ ڈیٹیلز ---
const config = {
    name: "Zᴀʜɪᴅ Kɪɴɢ",
    owner: "923044154575",
    prefix: ".",
    pic: "https://i.ibb.co/LdFF4pSF/temp.jpg",
    song: "https://files.catbox.moe/5kkxwz.mpeg",
    group: "https://chat.whatsapp.com/LwcrjuLxfTj9WP1AoWXZeS?mode=gi_t"
};

async function startZahidBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.macOS("Desktop")
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const type = Object.keys(msg.message)[0];
            const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : (type === 'imageMessage') ? msg.message.imageMessage.caption : '';
            const isCmd = body.startsWith(config.prefix);
            const command = isCmd ? body.slice(config.prefix.length).split(' ')[0].toLowerCase() : "";
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(" ");
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;

            // --- 🛡️ ANTI-LINK SYSTEM ---
            if (isGroup && body.includes("chat.whatsapp.com")) {
                const groupMetadata = await client.groupMetadata(from);
                const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                if (!admins.includes(sender)) {
                    await client.sendMessage(from, { delete: msg.key });
                    await client.sendMessage(from, { text: "🚫 *Links are not allowed!* Zahid King Bot has removed it." });
                }
            }

            // --- 👁️ AUTO STATUS SEEN ---
            if (from === 'status@broadcast') {
                await client.readMessages([msg.key]);
            }

            if (!isCmd) return;

            // --- 🎮 COMMANDS ---
            switch (command) {
                case 'menu':
                    let menu = `╭════〘 *${config.name}* 〙════⊷❍\n┃✯│ *Owner:* ${config.owner}\n╰══════════════════⊷❍\n\n` +
                               `🛡️ *Security:* Anti-Link Active\n🎵 *Song:* .song [name]\n👥 *Group:* .kick, .add, .mute, .unmute\n\n> Powered by Zahid King`;
                    await client.sendMessage(from, { image: { url: config.pic }, caption: menu }, { quoted: msg });
                    // مینو کے ساتھ آپ کا آڈیو پلے ہوگا
                    await client.sendMessage(from, { audio: { url: config.song }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
                    break;

                case 'song':
                    if (!text) return reply("Please provide a song name!");
                    const search = await yts(text);
                    const vid = search.videos[0];
                    await client.sendMessage(from, { text: `🎧 *Zahid King MD* is downloading: ${vid.title}...` });
                    await client.sendMessage(from, { 
                        audio: { url: `https://api.dreaded.site/api/ytdl/video?url=${vid.url}` }, 
                        mimetype: 'audio/mp4' 
                    }, { quoted: msg });
                    break;

                case 'kick':
                    if (!isGroup) return;
                    let users = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
                    await client.groupParticipantsUpdate(from, [users], "remove");
                    await client.sendMessage(from, { text: "✅ Member Kicked by Zahid King." });
                    break;

                case 'mute':
                    if (!isGroup) return;
                    await client.groupSettingUpdate(from, 'announcement');
                    await client.sendMessage(from, { text: "🔒 Group Muted Successfully!" });
                    break;

                case 'unmute':
                    if (!isGroup) return;
                    await client.groupSettingUpdate(from, 'not_announcement');
                    await client.sendMessage(from, { text: "🔓 Group Unmuted Successfully!" });
                    break;

                case 'alive':
                    await client.sendMessage(from, { text: "Yes Boss! Zᴀʜɪᴅ Kɪɴɢ MD is active and ready. 🚀" });
                    break;
            }

        } catch (e) { console.log(e); }
    });

    // --- ⚠️ ANTI-DELETE SYSTEM ---
    client.ev.on('message.delete', async (m) => {
        const from = m.key.remoteJid;
        await client.sendMessage(from, { text: "⚠️ *Anti-Delete Detected!* Someone just deleted a message." });
    });

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log(chalk.green('✅ Zahid King Bot Connected!'));
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) startZahidBot();
        }
    });
}

startZahidBot();
