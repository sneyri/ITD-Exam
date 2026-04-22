const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Доступ запрещен. Войдите в систему.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Неверный или просроченный токен.' });
    }
};

async function isAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Нужен токен' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.is_admin === true) {
            req.user = decoded; 
            next();
        } else {
            res.status(403).json({ error: 'У вас нет прав администратора' });
        }
    } catch (err) {
        return res.status(403).json({ error: 'Токен невалиден или просрочен' });
    }
}

module.exports = { verifyToken, isAdmin };