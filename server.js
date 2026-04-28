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
    "https://careersyncplatform.vercel.app",
    "https://careersyncc.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
].filter(Boolean);


app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

//cookie-parser for recieving token from req
app.use(cookieParser())
app.use(express.json())


//Database
const { connectDB } = require('./database/db')
connectDB()


//routes
const { authRouter } = require('./routes/AuthRoutes/authRoutes')
const { studentProfileRouter } = require('./routes/StudentRoutes/studentProfileRoutes')
const { companyProfileRouter } = require('./routes/CompanyRoutes/companyProfileRoutes')
const { jobsRouter } = require('./routes/JobsRoutes/jobs.routes')
const { externalJobsRouter } = require('./routes/JobsRoutes/externalJobsRoutes')
const { applicationRouter } = require('./routes/ApplicationRoutes/applicationRoutes')
const { adminRouter } = require('./routes/AdminRoutes/adminRoutes')
const { notificationRouter } = require('./routes/NotificationRoutes/notificationRoutes')

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/students', studentProfileRouter)
app.use('/api/v1/companies', companyProfileRouter)
app.use('/api/v1/jobs', jobsRouter)
app.use('/api/v1/external-jobs', externalJobsRouter)
app.use('/api/v1/applications', applicationRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/notifications', notificationRouter)

app.get('/', (req, res) => {
    res.send("<h1><b><strong>CarrerSync Platform's Backend is running...</strong></b></h1>")
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