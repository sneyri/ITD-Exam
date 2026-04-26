const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requireAuth } = require('./middleware');

const ADMINS = ['sneyri', 'aero'];

function requireAdmin(req, res, next) {
    if (!ADMINS.includes(req.username)) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
}

router.use(requireAuth);

router.post('/checkAdmin', async (req, res) => {
    const { username } = req.body;

    try {
        const result = await pool.query('SELECT EXISTS(SELECT 1 FROM admins WHERE adminName = $1)', [username])

        if (result.rows[0].exists) {
            res.json({ isAdmin: true });
        } else {
            res.json({ isAdmin: false });
        }
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/results', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT er.*, ev.title as variant_title
            FROM exam_results er
            LEFT JOIN exam_variants ev ON er.variant_id = ev.id
            ORDER BY er.created_at DESC
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;