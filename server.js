const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

const questionsRoutes = require('./routes/questions');
const variantsRoutes = require('./routes/variants');
const pagesRoutes = require('./routes/pages');
const examRoutes = require('./routes/exam');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

app.use('/api/upload', uploadRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/exam', examRoutes);
app.use('/', pagesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {}); 