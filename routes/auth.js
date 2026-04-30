const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { ITDClient } = require('itd-sdk-js');
const client = new ITDClient({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    }
});

router.post('/itd/generateCode', async (req, res) => {
    const { username } = req.body;

    const verificationCode = `ТПИ-${Math.floor(Math.random() * 10000)}`;

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

        const codes = result.rows.map(row => row.code);

        const post = await client.getUserLatestPost(username, 10);

        let found = false;

        for (const code of codes) {
            if (post?.content?.includes(code) || post?.originalPost?.content?.includes(code)) {
                found = true;
                break;
            }
        }

        if (found) {
            await pool.query('DELETE FROM verification_codes WHERE username = $1', [username]);
            return res.json({ verifed: true });
        }

        res.json({ verifed: false, message: 'Пост с кодом не найден' });
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ verifed: false, message: err.message });
    }
});

router.post('/itd/check', async (req, res) => {
    const { username } = req.body;
    const token = req.body['cf-turnstile-response'];

    if (!token) {
        return res.status(400).json({ error: 'Проверка не пройдена' });
    }

    try {
        const verify = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token
            }
        );

        if (!verify.data.success) {
            return res.status(403).json({ error: 'Боты не проходят' });
        }

        const userData = await client.getUserProfile(username);

        if (!userData?.username || !userData?.avatar) {
            return res.json({ exists: false });
        }

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        res.json({
            exists: true,
            data: userData,
            registered: existing.rows.length > 0
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/itd/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            return res.json({ success: false, message: 'Пользователь уже зарегистрирован' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await pool.query('INSERT INTO users(username, password_hash) VALUES ($1, $2)', [username, password_hash]);

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/itd/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Заполните все поля' });
        }

        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length === 0) {
            return res.json({ success: false, message: 'Пользователь не найден' });
        }

        if (!user.rows[0].password_hash) {
            return res.json({ success: false, message: 'Пароль не установлен' });
        }

        const valid = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!valid) {
            return res.json({ success: false, message: 'Неверный пароль' });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка в /itd/login:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
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