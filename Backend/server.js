const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// --- START CORS CONFIGURATION ---
// Add your future Vercel URL here
const whitelist = [
  'http://localhost:5173', // Vite default, or 3000 for CRA
  'http://localhost:3000',
  'https://lexiassist-zeta.vercel.app' // We will add this in Part 5
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      // !origin allows REST tools and server-to-server
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions)); // Use the new options
// --- END CORS CONFIGURATION ---

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/hearings', require('./routes/hearings'));

// Database connection
mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log('MongoDB connected'))
 .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
