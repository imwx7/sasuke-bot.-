const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
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

    if (!sock.authState.creds.registered) {
        let num = phoneNumber;
        if (!num) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (text) => new Promise((resolve) => rl.question(text, resolve));
            num = await question("رقم الواتساب: ");
            rl.close();
        }
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(num.trim());
                console.log(`\n========================================`);
                console.log(`🔑 كود الربط الخاص بك هو: ${code}`);
                console.log(`========================================\n`);
            } catch (err) {
                console.log("خطأ في طلب الكود:", err);
            }
        }, 4000);
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
