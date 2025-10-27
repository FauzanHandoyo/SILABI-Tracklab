const express = require('express');
const pool = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    res.send('SILABI Tracklab Database Server is ONLINE');
});

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
