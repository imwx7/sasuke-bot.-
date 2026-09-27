hereconst { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const express = require('express');
const pino = require('pino');
const readline = require("readline");

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Sasuke Bot is Running!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// رقم هاتفك إذا أردت وضعه هنا أو عبر متغير البيئة (اختياري، أو سيطلبه منك في السجلات)
const phoneNumber = process.env.PHONE_NUMBER || ""; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./.session');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // إذا لم يكن متصلاً، قم بطلب الرمز برقم الهاتف تلقائياً
    if (!sock.authState.creds.registered) {
        let num = phoneNumber;
        if (!num) {
            // هنا يطلب منك إدخال الرقم في السجلات إذا لم تقم بتحديده
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (text) => new Promise((resolve) => rl.question(text, resolve));
            num = await question("الرجاء إدخال رقم هاتف الواتساب مع رمز الدولة (مثال 9665xxxxxxxx): ");
            rl.close();
        }
        
        setTimeout(async () => {
            let code = await sock.requestPairingCode(num.trim());
            console.log(`\n========================================`);
            console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
            console.log(`========================================\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (body.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: 'Pong! 👤 Sasuke Bot is active.' });
        }
    });
}

startBot();
