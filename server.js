const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://challenges.cloudflare.com"
                ],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "http:"],
                frameSrc: ["'self'", "https://challenges.cloudflare.com"],
                connectSrc: ["'self'", "https://challenges.cloudflare.com"]
            }
        }
    })
);

app.disable('x-powered-by');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много попыток входа. Подождите 15 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const checkLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 6,
    message: { error: 'Слишком частые запросы. Подождите минуту.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const codeGenLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 2,
    message: { error: 'Слишком много кодов. Подождите 10 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много проверок. Подождите 5 минут.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Слишком много регистраций. Попробуйте позже.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { error: 'Слишком много запросов. Подождите минуту.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const submitExamLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Слишком много отправок. Подождите час.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/itd/check', checkLimiter);
app.use('/api/auth/itd/generateCode', codeGenLimiter);
app.use('/api/auth/itd/verify', verifyLimiter);
app.use('/api/auth/itd/login', loginLimiter);
app.use('/api/auth/itd/register', registerLimiter);

app.use('/api', apiLimiter);

app.use('/api/exam/submit', submitExamLimiter);

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