const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM proposals ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { ProposalInputText } = req.body;

    if (ProposalInputText.length === 0)
        return res.status(400).json({ error: 'Текст не должен быть пустым' });

    if (ProposalInputText.length < 10 || ProposalInputText.length > 100) {
        return res.status(400).json({ error: 'Текст должен быть от 10 до 100 символов' })
    };

    try {
        const result = await pool.query('INSERT INTO proposals(text) VALUES($1)', [ProposalInputText]);
        res.status(201).json({ message: 'Предложение отправлено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;