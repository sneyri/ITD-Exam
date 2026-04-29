const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requireAdmin } = require('./middleware');

router.use(requireAdmin);

router.post('/checkAdmin', async (req, res) => {
    const { username } = req.body;

    try {
        const result = await pool.query('SELECT EXISTS(SELECT 1 FROM admins WHERE adminname = $1)', [username])

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