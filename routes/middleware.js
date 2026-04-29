const jwt = require('jsonwebtoken');
const pool = require('../db');

function requireAuth(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Токен недействителен' });
    }
}

async function requireAdmin(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.username = decoded.username;
        
        const result = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM admins WHERE adminname = $1)',
            [req.username]
        );

        if (!result.rows[0].exists) {
            return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Токен недействителен' });
    }
}

module.exports = { requireAuth, requireAdmin };