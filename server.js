const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

process.env.PGCLIENTENCODING = 'UTF8';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    client_encoding: 'utf8'
});

app.post('/api/questions', async (req, res) => {
    const { question_text, correct_answer, points } = req.body; 

    if (!question_text || !correct_answer) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO questions (question_text, correct_answer, points) VALUES ($1, $2, $3) RETURNING *',
            [question_text, correct_answer, points]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/questions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }
        res.json({ message: 'Вопрос удалён', id: parseInt(id) });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
})

app.get('/api/questions/get', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM questions');

        res.status(200).json(result.rows);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/admin', (reg, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}/`);
    console.log(`Админка: http://localhost:${PORT}/admin`);
});