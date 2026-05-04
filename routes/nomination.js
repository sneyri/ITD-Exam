const express = require('express');
const pool = require('../db');
const router = express.Router();
const { requireAuth } = require('./middleware');

router.get('/vote/:voteId', requireAuth, async (req, res) => {
    const { voteId } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM nomination_votes WHERE nominee = $1',
            [voteId]
        );
        res.json({ votes: parseInt(result.rows[0].count) });
    } catch(error) {
        console.error('Database error:', error);
        res.json({ votes: 0 });
    }
});

router.get('/user-votes', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT nominee, nomination_name FROM nomination_votes WHERE username = $1',
            [req.username]
        );
        res.json(result.rows);
    } catch(error) {
        console.error('Database error:', error);
        res.json([]);
    }
});

router.post('/vote', requireAuth, async (req, res) => {
    const { id, nominationName } = req.body;
    
    if (!id || !nominationName) {
        return res.status(400).json({ error: 'ID и название номинации обязательны' });
    }
    
    try {
        const checkResult = await pool.query(
            'SELECT * FROM nomination_votes WHERE username = $1 AND nomination_name = $2',
            [req.username, nominationName]
        );
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Вы уже голосовали в этой номинации',
                votedFor: checkResult.rows[0].nominee
            });
        }
        
        await pool.query(
            'INSERT INTO nomination_votes(nominee, username, nomination_name) VALUES($1, $2, $3)',
            [id, req.username, nominationName]
        );
        
        const voteCount = await pool.query(
            'SELECT COUNT(*) as count FROM nomination_votes WHERE nominee = $1',
            [id]
        );
        
        res.json({ 
            status: true, 
            message: 'Голос учтен',
            votesCount: parseInt(voteCount.rows[0].count)
        });
    } catch(err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router; 