//Har Har Mahadev

require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const chalk = require('chalk');
const boxen = require('boxen');

/* dnscache is a short-term memory for the server.
It remembers the IP address of external systems (like MongoDB Atlas),
so the server does not need to look up the IP address on every request.
This reduces unnecessary delay and improves performance under high traffic.
The IP is remembered for 300 seconds (5 minutes), after which it looks up again.*/

require('dnscache')({
    "enable": true,
    "ttl": 300, //time to live -> 300sec =>5 min
    "cachesize": 1000  //means can remember to upto 1000 diffrent IP addresss
});

//cors for cross-origin platforms
const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://careersyncplatform.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

//cookie-parser for recieving token from req
app.use(cookieParser())
app.use(express.json())


//Database
const { connectDB } = require('./database/db')
connectDB()


//routes
const { authRouter } = require('./routes/auth.routes')
const { jobsRouter } = require('./routes/jobs.routes')
const { userProfileRouter } = require('./routes/userProfile.routes')
const { resumeUploadRouter } = require('./routes/resumeUpload.routes')
app.use('/api/auth', authRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/userProfile', userProfileRouter)
app.use('/api/resumeUpload', resumeUploadRouter)

app.get('/', (req, res) => {
    res.send("<h1><b><strong>Hey Welcome to Carrer-Sync Platform</strong></b></h1>")
})

const PORT = process.env.PORT || 8000
// app.listen(PORT, () => {
//     console.log(`Server Started at http://localhost:${PORT}`);
// })


app.listen(PORT, () => {
    const message = chalk.green.bold(`Server Started at http://localhost:${PORT}`);
    const box = boxen(message, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
        textAlignment: 'center'
    });
    console.log(box);
});