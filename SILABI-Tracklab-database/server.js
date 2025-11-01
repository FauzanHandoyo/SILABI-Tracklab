const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
dotenv.config();

const pool = require('./db');
const asetRoutes = require('./src/routes/asetInventarisRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL (Vite default)
  credentials: true
}));

app.use(express.json());

app.get('/', async (req, res) => {
  res.send('SILABI Tracklab Database Server is ONLINE');
});

app.use('/api/aset', asetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

pool.connect()
    .then(() => {
        console.log('Connected to the database successfully.');
    })
    .catch((err) => {
        console.error('Database connection error:', err.stack);
    });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});