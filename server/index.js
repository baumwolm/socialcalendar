require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'repd-calendar-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generate', require('./routes/generate'));
app.use('/refine', require('./routes/refine'));
app.use('/upload', require('./routes/upload'));
app.use('/examples', require('./routes/examples'));
app.use('/posts', require('./routes/posts'));
app.use('/auth', require('./routes/auth'));
app.use('/calendar', require('./routes/calendar'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Rep'd Calendar API running on http://localhost:${PORT}`);
});
