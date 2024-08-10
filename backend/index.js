const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SK);
const { db } = require('./firebase');
const { doc, getDoc, setDoc, updateDoc, increment } = require('firebase/firestore');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_SECRET_KEY, { polling: true });

let userBalances = {};
let userDepositAmounts = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!userBalances[chatId]) {
        userBalances[chatId] = 0;
    }
    bot.sendMessage(chatId, `Welcome! Your starting balance is ${userBalances[chatId]}€. Type /help to see available commands.`);
});

bot.onText(/\/balance/, (msg) => {
    const chatId = msg.chat.id;
    const balance = userBalances[chatId] || 0;
    bot.sendMessage(chatId, `Your current balance is ${balance}€.`);
});

bot.onText(/\/bet/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "How much do you want to play with?");
    bot.once('message', (msg) => {
        const amount = parseFloat(msg.text);
        if (isNaN(amount)) {
            bot.sendMessage(chatId, "Please enter a valid number.");
            return;
        }
        if (amount > userBalances[chatId]) {
            bot.sendMessage(chatId, `You don't have enough money. Your balance is ${userBalances[chatId]}€.`);
        } else {
            userBalances[chatId] -= amount;
            bot.sendMessage(chatId, `You placed a bet of ${amount}€. New balance: ${userBalances[chatId]}€.`);
        }
    });
});

bot.onText(/\/deposit/, (msg) => {
    const chatId = msg.chat.id;
    const depositOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "5€", callback_data: "5" }],
                [{ text: "10€", callback_data: "10" }],
                [{ text: "20€", callback_data: "20" }]
            ]
        }
    };
    bot.sendMessage(chatId, "How much would you like to deposit?", depositOptions);

    bot.on('callback_query', (callbackQuery) => {
        const depositAmount = parseInt(callbackQuery.data) * 100;
        const userId = callbackQuery.from.id;
        if (depositAmount) {
            userDepositAmounts[userId] = depositAmount;
            const depositLink = `https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/create-checkout-session?amount=${depositAmount / 100}&userId=${userId}`;
            bot.sendMessage(userId, `To deposit ${callbackQuery.data}€, please click this link: ${depositLink}`);
        }
    });

    bot.once('message', (msg) => {
        const customAmount = parseFloat(msg.text) * 100;
        const userId = msg.from.id;
        if (isNaN(customAmount) || customAmount <= 0) {
            bot.sendMessage(userId, "Please enter a valid amount.");
            return;
        }
        userDepositAmounts[userId] = customAmount;
        const depositLink = `https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/create-checkout-session?amount=${customAmount / 100}&userId=${userId}`;
        bot.sendMessage(userId, `To deposit ${msg.text}€, please click this link: ${depositLink}`);
    });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Available commands:\n/balance - Check your balance\n/bet - Place a bet\n/deposit - Deposit money`);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text.startsWith('/')) {
        bot.sendMessage(chatId, "I am sorry but I don't understand. Type /help to get the commands I can do.");
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Telegram Bot Backend!');
});

app.get('/create-checkout-session', async (req, res) => {
    const amount = parseInt(req.query.amount) * 100;
    const userId = req.query.userId;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Deposit Money',
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/success?amount=${amount}&userId=${userId}&source=${req.query.source || ''}`,
            cancel_url: `https://secure-fjord-35194-c6c27ccf70dc.herokuapp.com/cancel?source=${req.query.source || ''}`,
        });
        res.redirect(session.url);
    } catch (e) {
        console.error("Stripe Checkout session creation failed:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/success', async (req, res) => {
    const amount = parseInt(req.query.amount) / 100;
    const userId = req.query.userId;
    const source = req.query.source;

    try {
        if (source === 'miniapp') {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                await updateDoc(userRef, { balance: increment(amount) });
            } else {
                await setDoc(userRef, { balance: amount });
            }

            res.send(`
                <html>
                    <body>
                        <h1>Payment was successful!</h1>
                        <p>You have added ${amount}€ to your balance.</p>
                        <a href="https://miniapp-gambler.web.app/">
                            <button style="padding: 10px 20px; background-color: green; color: white; border: none; cursor: pointer;">
                                Return to Mini-App
                            </button>
                        </a>
                    </body>
                </html>
            `);
        } else {
            if (userBalances[userId] !== undefined) {
                userBalances[userId] += amount;
            } else {
                userBalances[userId] = amount;
            }

            try {
                await bot.sendMessage(userId, `Payment was successful! You have added ${amount}€ to your balance. Your new balance is ${userBalances[userId]}€.`);
                res.send(`Payment was successful! You have added ${amount}€ to your balance.`);
            } catch (error) {
                console.error(`Failed to send message to user ${userId}:`, error);
                const userRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    await updateDoc(userRef, { balance: increment(amount) });
                } else {
                    await setDoc(userRef, { balance: amount });
                }

                res.send(`
                    <html>
                        <body>
                            <h1>Payment was successful!</h1>
                            <p>However, we couldn't send you a message on Telegram.</p>
                            <p>Your new balance has been updated.</p>
                            <a href="https://miniapp-gambler.web.app/">
                                <button style="padding: 10px 20px; background-color: green; color: white; border: none; cursor: pointer;">
                                    Return to Mini-App
                                </button>
                            </a>
                        </body>
                    </html>
                `);
            }
        }
    } catch (e) {
        console.error("Error updating balance:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/cancel', (req, res) => {
    const source = req.query.source;

    if (source === 'miniapp') {
        res.send(`
            <html>
                <body>
                    <h1>Payment was canceled.</h1>
                    <a href="https://miniapp-gambler.web.app/">
                        <button style="padding: 10px 20px; background-color: red; color: white; border: none; cursor: pointer;">
                            Return to Mini-App
                        </button>
                    </a>
                </body>
            </html>
        `);
    } else {
        res.send("Payment was canceled.");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
