const config = require('./config');
const yts = require('yt-search');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function handleCommand(client, msg) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
    const isCmd = body.startsWith(config.PREFIX);
    const command = isCmd ? body.slice(config.PREFIX.length).split(' ')[0].toLowerCase() : "";
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(" ");

    // --- GROUP ADMIN CHECK ---
    const groupMetadata = isGroup ? await client.groupMetadata(from) : null;
    const participants = isGroup ? groupMetadata.participants : [];
    const admins = isGroup ? participants.filter(p => p.admin).map(p => p.id) : [];
    const isBotAdmin = isGroup ? admins.includes(client.user.id.split(':')[0] + '@s.whatsapp.net') : false;
    const isOwner = sender.includes(config.OWNER_NUMBER);
    const isAdmin = admins.includes(sender);

    // --- AUTO STATUS SEEN ---
    if (from === 'status@broadcast') { await client.readMessages([msg.key]); }

    if (!isCmd) return;

    switch (command) {
        // ================= GENERAL =================
        case 'menu':
            let menuTxt = `╭════〘 *Zᴀʜɪᴅ Kɪɴɢ MD* 〙════⊷❍\n┃✯│ *Owner:* ${config.OWNER_NAME}\n╰══════════════════⊷❍\n\n` +
                          `*Group Commands:* .kick, .add, .promote, .demote, .mute, .unmute, .tagall, .hidetag\n` +
                          `*Download:* .song, .video, .play\n*Utility:* .s, .alive, .ping`;
            await client.sendMessage(from, { image: { url: config.IMAGE }, caption: menuTxt }, { quoted: msg });
            await client.sendMessage(from, { audio: { url: config.SONG_URL }, mimetype: 'audio/mp4', ptt: true });
            break;

        // ================= GROUP MANAGEMENT =================
        case 'kick':
            if (!isGroup) return;
            if (!isAdmin && !isOwner) return client.sendMessage(from, { text: "❌ Admins Only!" });
            if (!isBotAdmin) return client.sendMessage(from, { text: "❌ Make me Admin first!" });
            let users = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
            if (!users) return client.sendMessage(from, { text: "Tag someone to kick!" });
            await client.groupParticipantsUpdate(from, [users], "remove");
            await client.sendMessage(from, { text: "✅ User Kicked!" });
            break;

        case 'add':
            if (!isGroup) return;
            if (!isAdmin && !isOwner) return;
            if (!text) return client.sendMessage(from, { text: "Provide number: .add 92304..." });
            await client.groupParticipantsUpdate(from, [text + "@s.whatsapp.net"], "add");
            break;

        case 'promote':
            if (!isGroup || !isAdmin) return;
            let userP = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0];
            await client.groupParticipantsUpdate(from, [userP], "promote");
            await client.sendMessage(from, { text: "✅ Promoted to Admin!" });
            break;

        case 'mute':
            if (!isGroup || !isAdmin) return;
            await client.groupSettingUpdate(from, 'announcement');
            await client.sendMessage(from, { text: "🔒 Group Muted!" });
            break;

        case 'unmute':
            if (!isGroup || !isAdmin) return;
            await client.groupSettingUpdate(from, 'not_announcement');
            await client.sendMessage(from, { text: "🔓 Group Unmuted!" });
            break;

        case 'tagall':
            if (!isGroup || !isAdmin) return;
            let tag = `*📣 Tag All By Zahid King*\n\n${text ? text : ''}\n\n`;
            for (let mem of participants) { tag += ` @${mem.id.split('@')[0]}\n`; }
            await client.sendMessage(from, { text: tag, mentions: participants.map(a => a.id) });
            break;

        // ================= DOWNLOADER =================
        case 'song':
            if (!text) return client.sendMessage(from, { text: "Song name?" });
            const search = await yts(text);
            const vid = search.videos[0];
            await client.sendMessage(from, { audio: { url: `https://api.dreaded.site/api/ytdl/video?url=${vid.url}` }, mimetype: 'audio/mp4' }, { quoted: msg });
            break;
    }
}

module.exports = { handleCommand };
// ================= OWNER & SETTINGS =================
case 'block':
    if (!isOwner) return client.sendMessage(from, { text: "❌ Owner Only!" });
    let blockUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || text + "@s.whatsapp.net";
    await client.updateBlockStatus(blockUser, "block");
    await client.sendMessage(from, { text: "✅ User Blocked!" });
    break;

case 'unblock':
    if (!isOwner) return;
    let unblockUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid[0] || text + "@s.whatsapp.net";
    await client.updateBlockStatus(unblockUser, "unblock");
    await client.sendMessage(from, { text: "✅ User Unblocked!" });
    break;

case 'setname':
    if (!isOwner) return;
    await client.updateProfileName(text);
    await client.sendMessage(from, { text: `✅ Bot name changed to: ${text}` });
    break;

case 'jid':
    await client.sendMessage(from, { text: `📍 Your JID: ${from}` });
    break;

// ================= SEARCH COMMANDS =================
case 'img':
case 'image':
    if (!text) return client.sendMessage(from, { text: "What should I search?" });
    await client.sendMessage(from, { text: "Searching images... 🔍" });
    // This uses a public API for images
    let imgSearch = `https://api.fdci.se/sosmed/rep.php?gambar=${text}`;
    await client.sendMessage(from, { image: { url: imgSearch }, caption: `Result for: ${text}` });
    break;

case 'yts':
case 'find':
    if (!text) return client.sendMessage(from, { text: "Provide a search term!" });
    let searchResult = await yts(text);
    let list = searchResult.videos.slice(0, 5);
    let resultTxt = `🔎 *Search Results for:* ${text}\n\n`;
    list.forEach((v, i) => {
        resultTxt += `${i+1}. *${v.title}*\n🔗 ${v.url}\n⏱️ ${v.timestamp}\n\n`;
    });
    await client.sendMessage(from, { text: resultTxt });
    break;

// ================= CONVERTERS =================
case 'mp3':
    // If you reply to a video with .mp3, it converts it
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.videoMessage) {
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4' }, { quoted: msg });
    } else {
        await client.sendMessage(from, { text: "Reply to a video with .mp3" });
    }
    break;
    