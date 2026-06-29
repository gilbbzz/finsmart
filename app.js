const express      = require('express');
const cookieParser = require('cookie-parser');
const path         = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const passport = require('./config/passport');

const requestLogger       = require('./middleware/requestLogger');
const errorHandler        = require('./middleware/errorHandler');
const { sanitizeRequest } = require('./middleware/inputValidator');

const authRoutes        = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes    = require('./routes/categoryRoutes');
const budgetRoutes      = require('./routes/budgetRoutes');
const goalRoutes        = require('./routes/goalRoutes');
const summaryRoutes     = require('./routes/summaryRoutes');
const debtRoutes        = require('./routes/debtRoutes');
const recurringRoutes   = require('./routes/recurringRoutes');
const investmentRoutes  = require('./routes/investmentRoutes');
const healthRoutes      = require('./routes/healthRoutes');

const app = express();

try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:    ["'self'"],
        scriptSrc:     ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-hashes'", "'unsafe-inline'"],
        styleSrc:      ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc:        ["'self'", "data:", "https://lh3.googleusercontent.com"],
        connectSrc:    ["'self'", "https://cdn.jsdelivr.net"],
        fontSrc:       ["'self'", "https://cdn.jsdelivr.net"],
        objectSrc:     ["'none'"],
        frameAncestors:["'none'"],
      }
    },
    crossOriginEmbedderPolicy: false,
  }));
  console.log('\x1b[32m✓ Helmet aktif\x1b[0m');
} catch {
  console.warn('\x1b[33m⚠ helmet tidak terinstall — npm install helmet\x1b[0m');
}

try {
  const cors = require('cors');
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS`));
    },
    credentials:          true,
    methods:              ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders:       ['Content-Type','Authorization'],
    optionsSuccessStatus: 200
  }));
  console.log('\x1b[32m✓ CORS aktif\x1b[0m');
} catch {
  console.warn('\x1b[33m⚠ cors tidak terinstall — npm install cors\x1b[0m');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestLogger);
app.use(sanitizeRequest);

app.use(passport.initialize());

connectDB();

try {
  const swaggerUi   = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'FinSmart API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));
  console.log('\x1b[32m✓ Swagger UI aktif di /api-docs\x1b[0m');
} catch {
  console.warn('\x1b[33m⚠ swagger-ui-express atau swagger-jsdoc tidak terinstall\x1b[0m');
  console.warn('  Jalankan: npm install swagger-ui-express swagger-jsdoc');
}

app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/budgets',      budgetRoutes);
app.use('/api/goals',        goalRoutes);
app.use('/api/summary',      summaryRoutes);
app.use('/api/debts',        debtRoutes);
app.use('/api/recurring',    recurringRoutes);
app.use('/api/investments',  investmentRoutes);
app.use('/api/health',       healthRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` FinSmart v2.2 berjalan di http://localhost:${PORT}\x1b[0m`);
  console.log(`  Swagger UI : http://localhost:${PORT}/api-docs`);
  console.log(`  Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✓ Configured' : '⚠ Belum dikonfigurasi'}`);
});

module.exports = app;