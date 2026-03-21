const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: true //changed for local server run otherwise false
    },
    verificationToken: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    },
    date_joined: {
        type: Date,
        default: Date.now
    }
});

/* as a good practice we are hashing as well as comparing
entered password with the saved password in the model itself
...
we could do this in controller but as a good practice 
always deal with only req and res in the controller */

/*CONCEPT :
We save plain password to the user object in memory.
Before mongoose saves it to MongoDB, pre('save') intercepts it,
hashes the password, and THEN saves the hashed version to DB.

Plain password never reaches the database.

'this' refers to the current user document (in memory)
that is about to be saved.
*/

userSchema.pre('save',async function (){
    if(!this.isModified('password')){
        return;
    }
    const salt=await bcrypt.genSalt(10);
    this.password=await bcrypt.hash(this.password,salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//creating a model
const userModel=mongoose.model('User',userSchema)
module.exports =userModel
