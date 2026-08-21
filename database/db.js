require('dotenv').config()
const mongoose=require('mongoose')

//creating database (or we are just connecting to a empty sheet called database)

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected Successfully");
    } catch (e) {
        console.log("Database connection Error",e);
        process.exit(1);
    }

}