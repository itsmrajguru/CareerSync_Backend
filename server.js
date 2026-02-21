const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
require('dnscache')({
    "enable": true,
    "ttl": 300,
    "cachesize": 1000
});

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors()); // Mirror Django ALLOWED_HOSTS=['*']

app.use('/api', require('./routes/apiRoutes'));

const PORT = process.env.PORT || 8000; // Match Django default port

app.listen(PORT, () => {
    console.debug(`[Server] Active on port ${PORT}`);
});
