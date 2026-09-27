const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const app = express();
const PORT = process.env.PORT || 3000;
let globalClient = null;

app.get('/', (r, s) => s.send('👑 بوت ساسكي شغال! افتح /request-code'));
app.get('/request-code', async (req, res) => {
    if (!globalClient) return res.send('⏳ بيحمل البوت، ثواني...');
    if (globalClient.authState.creds.registered) return res.send('✅ البوت مربوط بالفعل!');
    try {
        const num = (process.env.BOT_NUMBER || '201274934730').replace(/[^0-9]/g, '');
        const code = await globalClient.requestPairingCode(num);
        console.log('🔑 كود الاقتران:', code);
        res.send(`<h1>🔑 كود الربط الخاص بك هو: <span style="color:red">${code}</span></h1>`);
    } catch (e) {
        res.send('❌ حدث خطأ: ' + e.message);
    }
});
app.listen(PORT, '0.0.0.0', () => console.log('🚀 السيرفر شغال على البورت: ' + PORT));

const OWNER_NUMBER = '201274934730';
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;
const SLAP_STICKER_URL = 'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif';
const MENU_IMAGE_URL = 'https://i.ibb.co/3kWy9Ym/sasuke.jpg';

const BAD_WORDS = [
    'كسم', 'سكس', 'احا', 'شرموط', 'شرموطه', 'منيوك', 'كس', 'طيز',
    'زبر', 'قحبة', 'عرص', 'خول', 'امك', 'نيك', 'بورن', 'porn', 'sex'
];

const MENU_USER = `منور يا قلبي

👑『 بوت القائد اسلام 』👑

╭─ • ────────── • ─╮
│ 📜.قوانين - القوانين
│ 🎮.العاب - قايمة الالعاب
│ 🛠️.ادوات - قايمة الادوات
│ 🧠.معلومات - معلومات البوت
│ 👑.المطور - القائد
╰─ • ────────── • ─╯
تصميم : القائد اسلام 👑
اي حاجة تحت امرك❤`;

const MENU_ADMIN = `منور يا قائد

👑『 بوت القائد اسلام 』👑

╭─ • ────────── • ─╮
│ 📜.قوانين - القوانين
│ 🎮.العاب - قايمة الالعاب
│ 🛠️.ادوات - قايمة الادوات
│ ⚙️.ادارة - قايمة الادارة
│ 🧠.معلومات - معلومات البوت
│ 👑.المطور - القائد
╰─ • ────────── • ─╯
تصميم : القائد اسلام 👑
اي حاجة تحت امرك❤`;

const MENU_AL3AB = `🎮『 قايمة الألعاب 』🎮
╭─ • ────────── • ─╮
│ 💣.قنبلة
│ 🕵️.حرامي - مين الحرامي
│ 🔫.روليت - روليت روسي
│ ❌.اكس او
│ 💥.تفجير - فجر الجروب
│ 🎲.نرد
│ 🪜.سلم
│ 👋.صفع - صفع عضو
╰─ • ────────── • ─╯`;

const MENU_ADWAT = `🛠️『 قايمة الأدوات 』🛠️
╭─ • ────────── • ─╮
│ 🎨.ملصق - تحويل لصورة/ملصق
│ 🌐.ترجمة
│ 🌤️.طقس
╰─ • ────────── • ─╯`;

const MENU_EDARA = `⚙️『 قايمة الإدارة 』⚙️
╭─ • ────────── • ─╮
│ 🛑.طرد - طرد عضو
│ 🔒.قفل - قفل الجروب
│ ✅.قبول الكل - قبول جميع طلبات الانضمام
│ ✅.قبول [الرقم] - قبول رقم محدد
│ ⬆️.رفع - ترقية لمشرف (للقائد فقط)
│ ⬇️.خفض - تنزيل لعضو (للقائد فقط)
╰─ • ────────── • ─╯`;

const MENU_QAWANEEN = `📜『 قوانين الجروب 』📜
╭─ • ────────── • ─╮
│ 1- ممنوع الخاص والرخامة
│ 2- ممنوع اللينكات = بان نهائي
│ 3- ممنوع الشتائم والألفاظ الإباحية = طرد
│ 4- الاحترام فوق كل حاجة
│ 5- احترام القائد اسلام 👑
╰─ • ────────── • ─╯`;

const messages = [
    "*`♡ يا مُقلب القلوب ثبّت قلبي على دينك.`*",
    "*`♡ سبحان الله وبحمده، سبحان الله العظيم.`*",
];

let isEnabled = true;
let bombGame = {};

async function startBot() {
    try { fs.rmSync('/tmp/session', { recursive: true, force: true }); } catch (e) {}
    fs.mkdirSync('/tmp/session', { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState('/tmp/session');
    const { version } = await fetchLatestBaileysVersion();
    const client = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });
    globalClient = client;

    if (!client.authState.creds.registered) {
        console.log('⏳ جاري تجهيز كود الاقتران...');
        await new Promise(r => setTimeout(r, 6000));
        try {
            const code = await client.requestPairingCode(OWNER_NUMBER);
            console.log(`\n🔑 كود الاقتران الجديد: \x1b[32m${code}\x1b[0m\n`);
        } catch (e) {
            console.log('❌ فشل طلب الكود:', e.message);
        }
    }

    client.ev.on('creds.update', saveCreds);
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(() => startBot(), 3000);
        } else if (connection === 'open') {
            console.log('👑 بوت ساسكي (القائد اسلام) جاهز 🔥');
        }
    });

    async function sendAutoDua() {
        if (!isEnabled) return;
        try {
            const chats = await client.groupFetchAllParticipating();
            const msg = messages[Math.floor(Math.random() * messages.length)];
            for (let id in chats) await client.sendMessage(id, { text: msg });
        } catch (e) {}
    }
    async function sendSalatNabi() {
        if (!isEnabled) return;
        try {
            const chats = await client.groupFetchAllParticipating();
            for (let id in chats) await client.sendMessage(id, { text: "*`❤️ صلي على النبي ﷺ ❤️`*" });
        } catch (e) {}
    }
    setInterval(sendAutoDua, 3600000);
    setInterval(sendSalatNabi, 600000);

    client.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) return;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
        const text = body.trim();
        const lowerText = text.toLowerCase();
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNum = sender.split('@')[0];
        const isOwner = sender.replace(/[^0-9]/g, '') === OWNER_NUMBER;

        let isAdmin = false;
        try {
            const groupMetadata = await client.groupMetadata(from);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            isAdmin = participant ? (participant.admin !== null) : false;
        } catch (e) {}

        const getTargetUser = () => {
            const contextInfo = msg.message.extendedTextMessage?.contextInfo;
            if (contextInfo?.participant) return contextInfo.participant;
            if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) return contextInfo.mentionedJid[0];
            return null;
        };

        const isSticker = !!msg.message.stickerMessage;
        const containsBadWord = BAD_WORDS.some(word => lowerText.includes(word));
        if (containsBadWord || isSticker) {
            if (!isOwner) {
                try {
                    await client.sendMessage(from, { delete: msg.key });
                    await client.groupParticipantsUpdate(from, [sender], 'remove');
                    return await client.sendMessage(from, {
                        text: `🚫 *تم طرد العضو @${senderNum} وحذف الرسالة بسبب مخالفة القوانين.*`,
                        mentions: [sender]
                    });
                } catch (e) {}
            }
        }

        if (['تلقائي', '.تلقائي', 'ايقاف', '.ايقاف'].includes(text)) {
            if (!isOwner) return await client.sendMessage(from, { text: '👑 الأمر ده للقائد إسلام بس' }, { quoted: msg });
            isEnabled = !isEnabled;
            return await client.sendMessage(from, { text: isEnabled ? "✅ *تم تشغيل الإرسال التلقائي يا قائد 👑*" : "⛔ *تم إيقاف الإرسال التلقائي*" }, { quoted: msg });
        }

        if (text.startsWith('.رفع')) {
            if (!isOwner) return await client.sendMessage(from, { text: '👑 الأمر ده خاص بالقائد إسلام فقط!' }, { quoted: msg });
            const target = getTargetUser();
            if (!target) return await client.sendMessage(from, { text: '⚠️ رد على رسالة العضو أو منشن له!' }, { quoted: msg });
            try {
                await client.groupParticipantsUpdate(from, [target], 'promote');
                return await client.sendMessage(from, { text: `✅ *تمت ترقية @${target.split('@')[0]} إلى مشرف*`, mentions: [target] }, { quoted: msg });
            } catch (e) { return await client.sendMessage(from, { text: '❌ البوت لازم يكون مشرف!' }, { quoted: msg }); }
        }

        if (text.startsWith('.خفض')) {
            if (!isOwner) return await client.sendMessage(from, { text: '👑 الأمر ده خاص بالقائد إسلام فقط!' }, { quoted: msg });
            const target = getTargetUser();
            if (!target) return await client.sendMessage(from, { text: '⚠️ رد على رسالة المشرف أو منشن له!' }, { quoted: msg });
            try {
                await client.groupParticipantsUpdate(from, [target], 'demote');
                return await client.sendMessage(from, { text: `📉 *تم تنزيل @${target.split('@')[0]} إلى عضو*`, mentions: [target] }, { quoted: msg });
            } catch (e) { return await client.sendMessage(from, { text: '❌ البوت لازم يكون مشرف!' }, { quoted: msg }); }
        }

        if (text.startsWith('.قبول') || text.startsWith('قبول')) {
            if (!isAdmin && !isOwner) return await client.sendMessage(from, { text: '⚠️ هذا الأمر للمشرفين والقائد فقط!' }, { quoted: msg });
            const args = text.split(' ').slice(1);
            const param = args.join('').trim();
            try {
                const requests = await client.groupRequestParticipantsList(from);
                if (!requests || requests.length === 0) return await client.sendMessage(from, { text: 'ℹ️ لا توجد طلبات معلقة.' }, { quoted: msg });
                if (param === 'الكل' || param === 'كل') {
                    const jids = requests.map(r => r.jid);
                    await client.groupRequestParticipantsUpdate(from, jids, 'approve');
                    return await client.sendMessage(from, { text: `✅ *تم قبول جميع الطلبات (${jids.length})*` }, { quoted: msg });
                } else if (param.length > 0) {
                    const targetNum = param.replace(/[^0-9]/g, '');
                    const targetReq = requests.find(r => r.jid.includes(targetNum));
                    if (!targetReq) return await client.sendMessage(from, { text: `❌ لم أجد طلب للرقم: *${targetNum}*` }, { quoted: msg });
                    await client.groupRequestParticipantsUpdate(from, [targetReq.jid], 'approve');
                    return await client.sendMessage(from, { text: `✅ *تم قبول @${targetNum}*`, mentions: [targetReq.jid] }, { quoted: msg });
                }
            } catch (e) { return await client.sendMessage(from, { text: '❌ البوت لازم يكون مشرف!' }, { quoted: msg }); }
        }

        if (['.ساسكي', 'ساسكي', '.قايمة', 'قايمة'].includes(lowerText)) {
            const selectedMenu = (isAdmin || isOwner) ? MENU_ADMIN : MENU_USER;
            return await client.sendMessage(from, { image: { url: MENU_IMAGE_URL }, caption: selectedMenu }, { quoted: msg });
        }

        if (text === '.العاب') return await client.sendMessage(from, { text: MENU_AL3AB }, { quoted: msg });
        if (text === '.ادوات') return await client.sendMessage(from, { text: MENU_ADWAT }, { quoted: msg });
        if (text === '.ادارة') {
            if (!isAdmin && !isOwner) return await client.sendMessage(from, { text: '⚠️ قائمة الإدارة للمشرفين فقط!' }, { quoted: msg });
            return await client.sendMessage(from, { text: MENU_EDARA }, { quoted: msg });
        }
        if (text === '.قوانين') return await client.sendMessage(from, { text: MENU_QAWANEEN }, { quoted: msg });
        if (text === '.معلومات') return await client.sendMessage(from, { text: `🤖 بوت ساسكي 👑\n⏰ شغال 24 ساعة` }, { quoted: msg });
        if (text === '.المطور') return await client.sendMessage(from, { text: `👑 القائد اسلام @${OWNER_NUMBER}`, mentions: [OWNER_JID] }, { quoted: msg });

        if (lowerText.includes('ازيك يا ساسكي')) return await client.sendMessage(from, { text: `الحمدلله يا قلب البوت ❤️` }, { quoted: msg });
        if (lowerText === 'يا ساسكي') return await client.sendMessage(from, { text: `نعم يا غالي! اكتب *.ساسكي* 🤖` }, { quoted: msg });

        if (text.startsWith('.صفع')) {
            const target = getTargetUser();
            if (!target) return await client.sendMessage(from, { text: '⚠️ رد على رسالة الشخص أو منشن له!' }, { quoted: msg });
            try {
                await client.sendMessage(from, { text: `👋 @${senderNum} يصفع @${target.split('@')[0]}!`, mentions: [sender, target] }, { quoted: msg });
                const sticker = new Sticker(SLAP_STICKER_URL, { pack: 'بوت ساسكي 👑', author: 'صفع 💥', type: StickerTypes.FULL });
                const buffer = await sticker.toBuffer();
                await client.sendMessage(from, { sticker: buffer });
            } catch (e) { await client.sendMessage(from, { text: '👋 💥 (تم الصفع!)' }, { quoted: msg }); }
            return;
        }

        if (text === '.قنبلة') {
            bombGame[from] = true;
            return await client.sendMessage(from, { text: `💣 القنبلة اتزرعت @${senderNum} معاك 10 ثواني .فك`, mentions: [sender] }, { quoted: msg });
        }
        if (text === '.فك' && bombGame[from]) {
            bombGame[from] = false;
            return await client.sendMessage(from, { text: `😎 @${senderNum} فكهاا بطل 💪`, mentions: [sender] }, { quoted: msg });
        }
        if (text === '.نرد') return await client.sendMessage(from, { text: `🎲 @${senderNum} طلعلك *${Math.floor(Math.random() * 6) + 1}*`, mentions: [sender] }, { quoted: msg });
        if (text === '.سلم') return await client.sendMessage(from, { text: `🪜 @${senderNum} طلعلك *${Math.floor(Math.random() * 6) + 1}*`, mentions: [sender] }, { quoted: msg });
        if (text === '.روليت') {
            let r = Math.random() > 0.5 ? 'طاخ 💥 مت 😂💀' : 'تك 🔫 عشت';
            return await client.sendMessage(from, { text: `🔫 روليت روسي @${senderNum} -> ${r}`, mentions: [sender] }, { quoted: msg });
        }
        if (text === '.حرامي' || text === '.مين الحرامي') {
            const groupMetadata = await client.groupMetadata(from);
            const random = groupMetadata.participants[Math.floor(Math.random() * groupMetadata.participants.length)];
            return await client.sendMessage(from, { text: `🕵️ الحرامي هو @${random.id.split('@')[0]} 😂🔪`, mentions: [random.id] }, { quoted: msg });
        }
        if (text === '.تفجير') return await client.sendMessage(from, { text: `💥 بووووم @${senderNum} فجر الجروب 😂💣`, mentions: [sender] }, { quoted: msg });
    });
}
startBot();
