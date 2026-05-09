const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requireAuth } = require('./middleware');

router.get('/my-votes', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT nomination_name, nominee FROM nomination_votes WHERE username = $1',
            [req.username]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/vote', requireAuth, async (req, res) => {
    try {
        const { nominee, nominationName } = req.body;
        const username = req.username;

        if (!nominee || !nominationName) {
            console.log('Missing data:', { nominee, nominationName });
            return res.status(400).json({ error: 'Не указан nominee или nominationName' });
        }

        const check = await pool.query(
            'SELECT id FROM nomination_votes WHERE nomination_name = $1 AND username = $2',
            [nominationName, username]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Вы уже голосовали' });
        }

        await pool.query(
            'INSERT INTO nomination_votes (nominee, username, nomination_name) VALUES ($1, $2, $3)',
            [nominee, username, nominationName]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;