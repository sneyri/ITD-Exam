const jwt = require('jsonwebtoken');

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

module.exports = { requireAuth };