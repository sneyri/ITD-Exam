const express = require('express');
const pool = require('../db');
const router = express.Router();

async function isAdmin(req, res, next) {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ error: 'Не авторизован' });
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows[0]?.is_admin !== true) {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
}

router.get('/users', isAdmin, async (req, res) => {
    const { search } = req.query;
    let query = 'SELECT id, username, is_admin FROM users';
    const params = [];
    
    if (search) {
        const isNumber = /^\d+$/.test(search);
        if (isNumber) {
            query += ' WHERE id = $1';
            params.push(parseInt(search));
        } else {
            query += ' WHERE username ILIKE $1';
            params.push(`%${search}%`);
        }
    }
    
    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
});

router.post('/users/:id/make-admin', isAdmin, async (req, res) => {
    const { id } = req.params;
    await pool.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
});

router.post('/users/:id/remove-admin', isAdmin, async (req, res) => {
    const { id } = req.params;
    await pool.query('UPDATE users SET is_admin = FALSE WHERE id = $1', [id]);
    res.json({ success: true });
});

router.get('/check', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = `
        SELECT er.*, ev.variant as variant_number 
        FROM exam_results er
        LEFT JOIN exam_variants ev ON er.variant_id = ev.id
        WHERE er.status = 'in progress'
    `;
    const params = [];
    if (search) {
        query += ` AND (er.user_name ILIKE $${params.length + 1} OR er.id::text ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
    }
    query += ` ORDER BY er.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ rows: result.rows, page, limit });
});

module.exports = router;