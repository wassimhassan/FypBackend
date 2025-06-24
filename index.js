const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/auth', authRoutes);

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🟩 ✅ MongoDB connection successful!");
    
    app.listen(PORT, () => {
      console.log(`🟢 ✅ Server is running on port ${PORT}`);
      console.log(`🔗 API is ready at: http://localhost:${PORT}/api/auth`);
    });
  })
  .catch((err) => {
    console.error("🟥 ❌ MongoDB connection failed!");
    console.error("📄 Error:", err.message);
  });
