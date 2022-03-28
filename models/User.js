// to generate a random token for resetPasswordToken 
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        required : [true, "Please provide a username"] // error msg will be given in case user did not provide a username
    },
    email : {
        type : String,
        required : [true, "Please provide an email"],
        unique : true,
        match : [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email"
        ],
    },
    password : {
        type : String,
        required : [true, "Please add a password"],
        minlength : 6,
        // when ever we write a query for the user, password will be sent only when specified ( select helps in doing that)
        select: false  
    },
    resetPasswordToken : String,
    resetPasswordExpire : Date
});


// we are writing this so that in the case when we are reseting the password or creating a new user we don't need to deal with encrypting the password
UserSchema.pre("save", async function(next){
    // checking whether password is already encrypted or not
    if(!this.isModified("password")){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    // encrypting the password
    // this refers to User object
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

// creating a method that will check password is matched or not
UserSchema.methods.matchPasswords = async function(password){
    // this will refer to the user with which we are calling this function
    return await bcrypt.compare(password, this.password)
}

// this function will use json web token and return us a assigned token
// this token consist of id of the user jwt_secret and jwt_expire
UserSchema.methods.getSignedToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn : process.env.JWT_EXPIRE })
}

// creating token for reseting the password
// now we will hash this token and save the hash version in resetPasswordToken defined in UserSchema
// resetPasswordToken will be changed only for the user with which are calling this function
UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    
    // Hash token (private key) and save to database
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    
    // Set token expire date
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000); // Ten Minutes
    
    return resetToken;
    };

// creating user model
const User = mongoose.model("User",UserSchema);

// exporting user model
module.exports = User;