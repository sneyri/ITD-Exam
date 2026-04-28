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
            const options = await pool.query(
                'SELECT id, option_text, is_correct FROM question_options WHERE question_id = $1 ORDER BY sort_order',
                [q.id]
            );
            q.options = options.rows;
        }
        
        res.json(questions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { question_text, points, variant_id, options, image_url } = req.body;

    if (!question_text || !variant_id) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            'INSERT INTO questions (question_text, points, variant_id, image_url) VALUES ($1, $2, $3, $4) RETURNING id',
            [question_text, points || 1, variant_id, image_url || null]
        );

        const questionId = result.rows[0].id;

        if (options && options.length > 0) {
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
        console.error(err);
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

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { question_text, points, variant_id, options } = req.body;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE questions SET question_text = $1, points = $2, variant_id = $3 WHERE id = $4',
            [question_text, points || 1, variant_id, id]
        );
        
        await client.query('DELETE FROM question_options WHERE question_id = $1', [id]);
        
        if (options && options.length > 0) {
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