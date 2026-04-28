const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { ITDClient } = require('itd-sdk-js');
const client = new ITDClient();

router.post('/itd/generateCode', async (req, res) => {
    const { username } = req.body;

    let verificationCode = `ТПИ-${Math.floor(Math.random() * 10000)}`;

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

        if (!found && post?.originalPost?.content?.includes(code)) {
            found = true;
        }

        if (found) {
            await pool.query('DELETE FROM verification_codes WHERE username = $1', [username]);

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
        const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);

        if (!userData?.username || !userData?.avatar) {
            return res.json({ exists: false });
        }

        if (result.rows.length !== 0) {
            return res.json({ registered: true, exists: true });
        }

        res.json({
            exists: true,
            data: userData,
            registered: false,
        });
    } catch (err) {
        res.json({ exists: false });
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
    const { username, password } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (user.rows.length === 0) {
        return res.json({ success: false, message: 'Пользователь не найден' });
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
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true });
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