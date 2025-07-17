// index.js
require('dotenv').config();              // ← loads .env

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');

const authRoutes = require('./routes/authRoutes'); // path => routes/auth.js
const profileRoutes = require('./routes/profileRoutes');

const app = express();

/* ------------ middleware ------------ */
app.use(
  cors({
    origin: [
      "http://localhost:3000",    // CRA dev server
      "http://localhost:5173"     // (keep Vite if you still use it elsewhere)
    ],
    credentials: true            // if you ever send cookies
  })
);
app.use(express.json());       // parses application/json
app.use(morgan('dev'));        // tiny request logger

/* ------------- routes --------------- */
app.get('/', (_req, res) => res.send('Backend is running! 🚀'));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

/* ---------- 404 fallback ------------ */
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

/* ------ global error handler -------- */
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal server error' });
});

/* ----- database & server boot ------- */
const PORT     = process.env.PORT      || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () =>
      console.log(`✅  Server listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1);
  });

