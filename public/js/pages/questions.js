const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/variant/:variantId', async (req, res) => {
    const { variantId } = req.params;

    try {
        const questions = await pool.query(
            'SELECT * FROM questions WHERE variant_id = $1 ORDER BY id',
            [variantId]
        );
        
        for (const q of questions.rows) {
            if (q.question_type === 'choice') {
                const options = await pool.query(
                    'SELECT id, option_text, is_correct FROM question_options WHERE question_id = $1 ORDER BY sort_order',
                    [q.id]
                );
                q.options = options.rows;
            }
        }
        
        res.json(questions.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { question_text, points, variant_id, question_type, options } = req.body;
    
    if (!question_text || !variant_id) {
        return res.status(400).json({ error: 'Заполните обязательные поля' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'INSERT INTO questions (question_text, points, variant_id, question_type) VALUES ($1, $2, $3, $4) RETURNING id',
            [question_text, points || 1, variant_id, question_type || 'choice']
        );
        
        const questionId = result.rows[0].id;
        
        if (question_type === 'choice' && options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await client.query(
                    'INSERT INTO question_options (question_id, option_text, is_correct, sort_order) VALUES ($1, $2, $3, $4)',
                    [questionId, options[i].option_text, options[i].is_correct, i]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json({ id: questionId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { question_text, points, question_type, options } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE questions SET question_text = $1, points = $2, question_type = $3 WHERE id = $4',
            [question_text, points || 1, question_type || 'choice', id]
        );
        
        await client.query('DELETE FROM question_options WHERE question_id = $1', [id]);
        
        if (question_type === 'choice' && options && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await client.query(
                    'INSERT INTO question_options (question_id, option_text, is_correct, sort_order) VALUES ($1, $2, $3, $4)',
                    [id, options[i].option_text, options[i].is_correct, i]
                );
            }
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Обновлено' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM questions WHERE id = $1', [id]);
        res.json({ message: 'Вопрос удалён' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const question = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
        if (question.rows.length === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }
        
        const options = await pool.query(
            'SELECT id, option_text, is_correct FROM question_options WHERE question_id = $1 ORDER BY sort_order',
            [id]
        );
        
        res.json({
            ...question.rows[0],
            options: options.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;