const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_variants ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_variants ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/active', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_variants WHERE is_active = true ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM exam_variants WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Вариант не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    
    try {
        await pool.query('UPDATE exam_variants SET is_active = $1 WHERE id = $2', [is_active, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Название обязательно' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO exam_variants (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM questions WHERE variant_id = $1', [id]);
        await pool.query('DELETE FROM exam_variants WHERE id = $1', [id]);
        res.json({ message: 'Вариант удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;