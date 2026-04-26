const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home.html'));
});

router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

router.get('/variants', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/variants.html'));
});

router.get('/exam', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/exam.html'));
});

router.get('/answers', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/answers.html'));
});

router.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth.html'));
});

router.get('/result-details', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/result-details.html'));
});

module.exports = router;