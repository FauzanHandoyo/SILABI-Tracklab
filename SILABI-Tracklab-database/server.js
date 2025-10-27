// ...existing code...
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const pool = require('./db');
const asetRoutes = require('./src/routes/asetInventarisRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', async (req, res) => {
  res.send('SILABI Tracklab Database Server is ONLINE');
});

app.use('/api/aset', asetRoutes);

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
// ...existing code...