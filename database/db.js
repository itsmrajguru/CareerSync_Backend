const mongoose=require('mongoose')

//import .env for database 
require('dotenv').config()

//creating database
const  connectDB=async()=>{
    try {
        //connect to Database
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database Connected Successfully");
    } catch (e) {
      console.log("Database error :",e.message);
      process.exit(1) //remain it always 1
    }
}

module.exports={connectDB};