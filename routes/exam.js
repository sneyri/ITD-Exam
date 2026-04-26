const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requireAuth } = require('./middleware');

router.get('/my-results', requireAuth, async (req, res) => {
    try {
        const results = await pool.query(`
            SELECT er.*, ev.title as variant_title
            FROM exam_results er
            LEFT JOIN exam_variants ev ON er.variant_id = ev.id
            WHERE er.user_name = $1 
            ORDER BY er.created_at DESC
        `, [req.username]);

        res.json(results.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/completed-variants', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT variant_id FROM exam_results WHERE user_name = $1',
            [req.username]
        );
        res.json(result.rows.map(row => row.variant_id));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/submit', requireAuth, async (req, res) => {
    const { variant_id, answers } = req.body;
    const username = req.username;

    if (!variant_id || !answers) {
        return res.status(400).json({ error: 'Не хватает данных' });
    }

    const existing = await pool.query(
        'SELECT id FROM exam_results WHERE user_name = $1 AND variant_id = $2',
        [username, variant_id]
    );

    if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Вы уже проходили этот вариант' });
    }

    try {
        const questionsRes = await pool.query(`
            SELECT q.id, q.points, qo.id as correct_option_id
            FROM questions q
            LEFT JOIN question_options qo ON q.id = qo.question_id AND qo.is_correct = true
            WHERE q.variant_id = $1
        `, [variant_id]);

        const questions = questionsRes.rows;
        let totalScore = 0;
        let maxScore = 0;

        for (const q of questions) {
            maxScore += q.points;
            const userAnswer = answers[q.id];
            if (userAnswer && parseInt(userAnswer) === q.correct_option_id) {
                totalScore += q.points;
            }
        }

        const resultRes = await pool.query(
            'INSERT INTO exam_results (user_name, variant_id, score, max_score) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, variant_id, totalScore, maxScore]
        );

        const resultId = resultRes.rows[0].id;

        for (const q of questions) {
            const userOptionId = answers[q.id];
            let userAnswerText = '';
            let isCorrect = false;

            if (userOptionId) {
                const optionRes = await pool.query(
                    'SELECT option_text, is_correct FROM question_options WHERE id = $1',
                    [userOptionId]
                );
                if (optionRes.rows.length > 0) {
                    userAnswerText = optionRes.rows[0].option_text;
                    isCorrect = optionRes.rows[0].is_correct;
                }
            }

            await pool.query(
                'INSERT INTO user_answers (result_id, question_id, user_answer, is_correct) VALUES ($1, $2, $3, $4)',
                [resultId, q.id, userAnswerText, isCorrect]
            );
        }

        res.status(201).json({
            message: 'Экзамен сохранён',
            result_id: resultId,
            score: totalScore,
            maxScore: maxScore
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/result/:resultId', async (req, res) => {
    const { resultId } = req.params;

    try {
        const resultRes = await pool.query(`
            SELECT er.*, ev.title as variant_title
            FROM exam_results er
            LEFT JOIN exam_variants ev ON er.variant_id = ev.id
            WHERE er.id = $1
        `, [resultId]);

        if (resultRes.rows.length === 0) {
            return res.status(404).json({ error: 'Результат не найден' });
        }

        const answersRes = await pool.query(`
            SELECT ua.*, q.question_text, qo.option_text as correct_answer
            FROM user_answers ua
            JOIN questions q ON ua.question_id = q.id
            LEFT JOIN question_options qo ON q.id = qo.question_id AND qo.is_correct = true
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

module.exports = router;