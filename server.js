//Har Har Mahadev

require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser=require('cookie-parser')

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
app.use(
    cors({
        origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://127.0.0.1:5173"],
        methods:['GET','POST','PUT','PATCH'],
        credentials:true
    })
)

//cookie-parser for recieving token from req
app.use(cookieParser())
app.use(express.json())


//Database
const { connectDB } = require('./database/db')
connectDB()


//routes
const{authRouter}=require('./routes/auth.routes')
const{jobsRouter}=require('./routes/jobs.routes')
const{userProfileRouter}=require('./routes/userProfile.routes')
const{resumeUploadRouter}=require('./routes/resumeUpload.routes')
app.use('/api/auth',authRouter)
app.use('/api/jobs',jobsRouter)
app.use('/api/userProfile',userProfileRouter)
app.use('/api/resumeUpload',resumeUploadRouter)

app.get('/', (req, res) => {
    res.send("<h1><b><strong>Hey Welcome to Carrer-Sync Platform</strong></b></h1>")
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log(`Server Started at http://localhost:${PORT}`);
})

