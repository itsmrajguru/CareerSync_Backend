require('dotenv').config()
const jwt = require('jsonwebtoken');

const protect=async(req,res,next)=>{
    //extracting the authHeader from the req.headers.authorization
    const authHeader=req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({
          success: false,
          message: 'No token Provided.Please Login'
        });
    }
    //extracting token by spiltting authHeader
    const token=authHeader.split(' ')[1];
    try {
        //function 1:VERIFY TOKEN
        const decoded=jwt.verify(token,process.env.JWT_SECRET)

        //function 2:SET req.user
        req.user=decoded
        next() //got to next middlewar or comtroller
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalid or expired. Please login again.'
        });
    }
}

module.exports={protect}
