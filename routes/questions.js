const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/get', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM questions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/variant/:variantId', async (req, res) => {
    const { variantId } = req.params;

    try {
        const result = await pool.query('SELECT * FROM questions WHERE variant_id = $1', [variantId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { question_text, correct_answer, points, variant_id } = req.body;
    if (!question_text || !correct_answer || !variant_id) {
        return res.status(400).json({ error: 'Заполните все поля (включая variant_id)' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO questions (question_text, correct_answer, points, variant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [question_text, correct_answer, points || 1, variant_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }
        res.json({ message: 'Вопрос удалён', id: parseInt(id) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { question_text, correct_answer, points, variant_id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE questions 
             SET question_text = $1, correct_answer = $2, points = $3, variant_id = $4 
             WHERE id = $5 
             RETURNING *`,
            [question_text, correct_answer, points, variant_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;