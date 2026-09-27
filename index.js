const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('👑 بوت ساسكي شغال بنجاح 🔥');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

async function startBot() {
    // استخدام مجلد مؤقت آمن لبيئة Render
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.BOT_NUMBER;
        if (phoneNumber) {
            setTimeout(async () => {
                let code = await sock.requestPairingCode(phoneNumber);
                console.log(`🔑 كود الاقتران الخاص بك هو: ${code}`);
            }, 3000);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ');
            
            if (reason !== DisconnectReason.loggedOut) {
                startBot(); // إعادة الاتصال تلقائياً بدون انهيار السيرفر
            } else {
                console.log('Client logged out. Please delete session folder and restart.');
            }
        } else if (connection === 'open') {
            console.log('👑 بوت ساسكي جاهز 🔥');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // استقبال الرسائل والرد داخل المجموعات فقط
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const m = messages[0];
            if (!m.message) return;
            
            const from = m.key.remoteJid;
            
            // التأكد أن الرسالة داخل مجموعة فقط
            if (!from.endsWith('@g.us')) return;

            const messageType = Object.keys(m.message)[0];
            let text = '';
            
            if (messageType === 'conversation') {
                text = m.message.conversation;
            } else if (messageType === 'extendedTextMessage') {
                text = m.message.extendedTextMessage.text;
            }

            if (!text) return;

            // الرد عند كتابة ساسكي أو .ساسكي
            if (text.trim() === 'ساسكي' || text.trim() === '.ساسكي') {
                await sock.sendMessage(from, { text: 'أهلاً بك يا غالي! أنا بوت ساسكي جاهز لخدمتك في المجموعة 👑🔥' }, { quoted: m });
            }
        } catch (error) {
            console.log('Error handling message: ', error);
        }
    });
}

startBot();
