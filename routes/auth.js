const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');


const dotenv = require('dotenv');
dotenv.config();

const { ITDClient } = require('itd-sdk-js');
const client = new ITDClient();

router.post('/itd/generateCode', async (req, res) => {
    const { username } = req.body;

    const Letters = ['Жопа', 'НовкиПи', 'Попа)', 'ЫаИа', 'НуЩа', 'Мастика Лох', 'Гидрант', 'Мезинчик'];
    const radnomIndex = Math.floor(Math.random() * Letters.length);
    let verificationCode = `${Letters[radnomIndex]}`;

    await pool.query('DELETE FROM verification_codes WHERE username = $1', [username]);

    await pool.query(
        'INSERT INTO verification_codes (username, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'10 minutes\')',
        [username, verificationCode]
    );

    res.json({ verifCode: verificationCode });
});

router.post('/itd/verify', async (req, res) => {
    try {
        const { username } = req.body;

        const result = await pool.query(
            'SELECT code FROM verification_codes WHERE username = $1 AND expires_at > NOW()',
            [username]
        );

        if (result.rows.length === 0) {
            return res.json({ verifed: false, message: 'Код истек или не найден' });
        }

        const code = result.rows[0].code;

        const post = await client.getUserLatestPost(username, 10);

        let found = false;

        if (post?.content?.includes(code)) {
            found = true;
        }

        if (!found && post?.originalPost?.content?.includes(code)) {
            found = true;
        }

        if (found) {
            await pool.query('DELETE FROM verification_codes WHERE username = $1', [username]);

            const token = jwt.sign(
                { username: username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });

            res.json({ verifed: true });
        } else {
            res.json({ verifed: false, message: 'Пост с кодом не найден' });
        }
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ verifed: false, message: err.message });
    }
});

router.post('/itd/check', async (req, res) => {
    const { username } = req.body;

    try {
        const userData = await client.getUserProfile(username);

        if (!userData?.username || !userData?.avatar) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            data: userData,
        });
    } catch (err) {
        res.json({ exists: false });
    }
});

router.get('/me', async (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ username: decoded.username });
    } catch (err) {
        res.status(401).json({ error: 'Токен недействителен' });
    }
});     

module.exports = router;