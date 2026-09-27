const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const readline = require('readline');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Sasuke Bot is Running!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const phoneNumber = process.env.PHONE_NUMBER || "";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./.session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        let num = phoneNumber;
        if (num) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(num);
                    console.log(`==================================================`);
                    console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
                    console.log(`==================================================`);
                } catch (err) {
                    console.log('خطأ في طلب الكود:', err);
                }
            }, 4000);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === 'ping') {
            await sock.sendMessage(remoteJid, { text: 'Pong! 👤 Sasuke Bot is active.' });
        } else if (body.toLowerCase() === '.menu' || body.toLowerCase() === 'menu') {
            let menuText = "👤 *قائمة أوامر بوت ساسكي (Sasuke Bot)*:\n\n";
            menuText += "🔹 `ping` - لاختبار استجابة البوت\n";
            menuText += "🔹 `.menu` - لعرض هذه القائمة\n";
            await sock.sendMessage(remoteJid, { text: menuText });
        }
    });
}

startBot();
