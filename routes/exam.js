const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/my-results', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id обязателен' });
    }

    try {
        const results = await pool.query(`
            SELECT er.*, ev.variant as variant_number 
            FROM exam_results er
            LEFT JOIN exam_variants ev ON er.variant_id = ev.id
            WHERE er.user_id = $1 
            ORDER BY er.created_at DESC
        `, [user_id]);

        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/result/:resultId', async (req, res) => {
    const { resultId } = req.params;

    try {
        const resultRes = await pool.query('SELECT * FROM exam_results WHERE id = $1', [resultId]);
        if (resultRes.rows.length === 0) {
            return res.status(404).json({ error: 'Результат не найден' });
        }

        const answersRes = await pool.query(`
            SELECT ua.*, q.question_text, q.correct_answer, q.points 
            FROM user_answers ua
            JOIN questions q ON ua.question_id = q.id
            WHERE ua.result_id = $1
        `, [resultId]);

        res.json({
            result: resultRes.rows[0],
            answers: answersRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/result/:resultId', async (req, res) => {
    const { resultId } = req.params;
    const { status, admin_comment, answers_review, score, max_score } = req.body;

    try {
        await pool.query(
            'UPDATE exam_results SET status = $1, admin_comment = $2, score = $3, max_score = $4 WHERE id = $5',
            [status, admin_comment || null, score || 0, max_score || 0, resultId]
        );

        if (answers_review && Array.isArray(answers_review)) {
            for (const item of answers_review) {
                await pool.query(
                    'UPDATE user_answers SET is_correct = $1, points_awarded = $2, reviewed = true WHERE id = $3 AND result_id = $4',
                    [item.is_correct, item.points_awarded || 0, item.user_answer_id, resultId]
                );
            }
        }

        res.json({ message: 'Обновлено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/completed-variants', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id обязателен' });
    }

    try {
        const result = await pool.query(
            'SELECT DISTINCT variant_id FROM exam_results WHERE user_id = $1',
            [user_id]
        );
        res.json(result.rows.map(row => row.variant_id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/submit', async (req, res) => {
    const { user_id, variant_id, answers } = req.body;

    if (!user_id || !variant_id || !answers) {
        return res.status(400).json({ error: 'Не хватает данных' });
    }

    const existing = await pool.query(
        'SELECT id FROM exam_results WHERE user_id = $1 AND variant_id = $2',
        [user_id, variant_id]
    );

    if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Вы уже проходили этот вариант' });
    }

    try {
        const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [user_id]);
        const username = userRes.rows[0]?.username || 'Аноним';

        const questionsRes = await pool.query('SELECT id, points, correct_answer FROM questions WHERE variant_id = $1', [variant_id]);
        const questions = questionsRes.rows;

        let totalScore = 0;
        let maxScore = 0;

        for (const q of questions) {
            maxScore += q.points;
            const userAnswer = (answers[q.id] || '').trim().toLowerCase();
            const correctAnswer = q.correct_answer.trim().toLowerCase();
            if (userAnswer === correctAnswer) {
                totalScore += q.points;
            }
        }

        const resultRes = await pool.query(
            'INSERT INTO exam_results (user_name, variant_id, status, score, max_score, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [username, variant_id, 'in progress', totalScore, maxScore, user_id]
        );
        const resultId = resultRes.rows[0].id;

        for (const [questionId, userAnswer] of Object.entries(answers)) {
            const qId = parseInt(questionId);
            if (isNaN(qId)) continue;

            await pool.query(
                'INSERT INTO user_answers (result_id, question_id, user_answer) VALUES ($1, $2, $3)',
                [resultId, qId, userAnswer || '']
            );
        }

        res.status(201).json({ message: 'Экзамен сохранён', result_id: resultId, score: totalScore, maxScore: maxScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;