const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home.html'));
});

router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

router.get('/admin/check', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/check.html'));
});

router.get('/variants', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/variants.html'));
});

router.get('/questions', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/questions.html'));
});

router.get('/exam', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/exam.html'));
})

router.get('/answers', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/answers.html'));
})

router.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth.html'));
})

router.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/logout.html'));
})

router.get('/result-details', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/result-details.html'));
})

router.get('/proposal', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/proposal.html'))
})

module.exports = router;