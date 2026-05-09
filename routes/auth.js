const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { ITDClient } = require('itd-sdk-js');
const client = new ITDClient();

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
            return res.json({ 
                verifed: false, 
                message: 'Код истек или не найден. Нажмите "Назад" и запросите новый код.' 
            });
        }

        const codes = result.rows.map(row => row.code);
        
        let posts = [];
        try {
            const lastPost = await client.getUserLatestPost(username, 10);
            if (lastPost) posts = [lastPost];
        } catch (err) {
            console.error('Ошибка получения постов от ITD:', err);
            return res.json({ 
                verifed: false, 
                message: 'Не удалось получить данные из ИТД. Сервер ИТД временно недоступен. Срочно напишите в тгк @itdtests.' 
            });
        }

        if (posts.length === 0 || !posts[0]) {
            return res.json({ 
                verifed: false, 
                message: 'Не удалось найти посты в вашем профиле ИТД. Убедитесь, что у вас есть хотя бы один пост.' 
            });
        }

        const post = posts[0];
        
        if (post?.wallRecipientId !== null && post?.wallRecipientId !== undefined) {
            return res.json({ 
                verifed: false, 
                message: 'Пост найден, но он опубликован на чужой стене. Опубликуйте код на СВОЕЙ стене.' 
            });
        }
        
        if (post?.author?.username !== username) {
            return res.json({ 
                verifed: false, 
                message: 'Пост найден, но он принадлежит другому пользователю. Опубликуйте пост от вашего аккаунта.' 
            });
        }

        let found = false;
        let matchedCode = null;

        const cleanContent = (post.content || '').replace(/\s/g, '').toLowerCase();
        
        for (const code of codes) {
            const cleanCode = code.replace(/\s/g, '').toLowerCase();
            if (cleanContent.includes(cleanCode)) {
                found = true;
                matchedCode = code;
                break;
            }
        }

        if (found) {
            await pool.query('DELETE FROM verification_codes WHERE username = $1', [username]);
            return res.json({ verifed: true });
        }

        const codesList = codes.join(', ');
        const postPreview = (post.content || '').substring(0, 100);
        
        return res.json({ 
            verifed: false, 
            message: `Код не найден в последнем посте.\n\nСодержимое последнего поста: "${postPreview}"` 
        });

    } catch (err) {
        console.error('Ошибка в /itd/verify:', err);
        res.status(500).json({ 
            verifed: false, 
            message: 'Внутренняя ошибка сервера. Попробуйте позже или сообщите в тгк @itdtests.' 
        });
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

        if (!userData?.username) {
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

router.post('/itd/check-user', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Укажите никнейм' });
    }

    try {
        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            return res.json({
                exists: true,
                registered: true,
                needCaptcha: false
            });
        }

        const userData = await client.getUserProfile(username);

        if (!userData?.username) {
            return res.json({ exists: false });
        }

        return res.json({
            exists: true,
            registered: false,
            needCaptcha: true,
            userData: {
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar
            }
        });

    } catch (err) {
        console.error('Ошибка в /itd/check-user:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/itd/verify-captcha', async (req, res) => {
    const { username, token } = req.body;

    if (!username || !token) {
        return res.status(400).json({ error: 'Не хватает данных' });
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

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (existing.rows.length > 0) {
            return res.json({
                success: true,
                registered: true
            });
        }

        const userData = await client.getUserProfile(username);

        if (!userData?.username) {
            return res.json({ success: false, error: 'Пользователь не найден в ИТД' });
        }

        res.json({
            success: true,
            registered: false,
            userData: {
                username: userData.username,
                displayName: userData.displayName,
                avatar: userData.avatar
            }
        });

    } catch (err) {
        console.error('Ошибка в /itd/verify-captcha:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;