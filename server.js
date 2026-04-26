const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

app.use(helmet());
app.disable('x-powered-by');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Слишком много запросов. Попробуйте позже.' }
});
app.use('/api/', limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', pagesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});