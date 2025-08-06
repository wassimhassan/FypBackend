// index.js
require('dotenv').config();              // ← loads .env

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');

const authRoutes = require('./routes/authRoutes'); // path => routes/auth.js
const profileRoutes = require('./routes/profileRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const reviewRoutes = require("./routes/reviewRoutes");
const careerRoutes = require('./routes/careerRoutes');
const universityRoutes = require('./routes/universityRoutes');
const courseRoutes = require('./routes/courseRoutes');


const app = express();

/* ------------ middleware ------------ */
const allowedOrigins = [
  process.env.FRONTEND_URL,       // 🆕 Vercel URL from your .env  e.g. https://fyp-frontend-o18zi5qpz-wassim-hassans-projects.vercel.app
  "http://localhost:3000",        // React-scripts dev server
  "http://localhost:5173"         // Vite dev server (keep if you still use it)
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true            // if you ever send cookies
  })
);
app.use(express.json());       // parses application/json
app.use(morgan('dev'));        // tiny request logger

/* ------------- routes --------------- */
app.get('/', (_req, res) => res.send('Backend is running! 🚀'));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/courses', courseRoutes);

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



  