const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_variants ORDER BY variant');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/check', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM exam_results WHERE status = 'in progress' ORDER BY created_at");
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

router.post('/', async (req, res) => {
    const maxResult = await pool.query('SELECT COALESCE(MAX(variant), 0) as max FROM exam_variants');
    const nextNumber = maxResult.rows[0].max + 1;
    const result = await pool.query(
        'INSERT INTO exam_variants (variant) VALUES ($1) RETURNING *',
        [nextNumber]
    );
    res.status(201).json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM questions WHERE variant_id = $1', [id]);

        await pool.query('DELETE FROM exam_variants WHERE id = $1', [id]);

        res.json({ message: 'Вариант и все его вопросы удалены' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;