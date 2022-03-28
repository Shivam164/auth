const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// handling register route function
exports.register = async (req, res, next) => {
    const { username, email, password } = req.body;

    try{
        const user = await User.create({
            username,
            email,
            password
        });
        sendToken(user,201,res);
    }catch(error){
        // handling error using middleware in the server.js file
        next(error);
    }
}

// handling login route function
// we are making this function async because we are going to request some data from the database
exports.login = async (req, res, next) => { 
    const { email, password } = req.body;

    if(!email || !password){
        return next(new ErrorResponse("Please provide email and password", 400))
    }

    try{
        // checking whether email exist in the database or not
        const user = await User.findOne({email}).select("+password");

        if(!user){
            return next(new ErrorResponse("Invalid Credentials", 404));
        }

        // checking whether password is correct or not
        const isMatch = await user.matchPasswords(password);

        if(!isMatch){
            return next(new ErrorResponse("Invalid Credentials", 401));
        }

        sendToken(user, 200, res);

    }catch(error){
        // error will be handeled by error.js middleware
        next(error);
    }
}

exports.forgotpassword = async (req, res, next) => {
    console.log("accepting response");
    const { email } = req.body;
    try{
        console.log(email);
         const user = await User.findOne({email});
         console.log(user);

         if(!user){
            return next(new ErrorResponse("Email could not be sent",404));
         }

         const resetToken = user.getResetPasswordToken();
         console.log(resetToken);
         console.log("reached here");
         // now we will save the newly updated data into the database
         await user.save();

         const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

         // preparing for the email that we are going to send to the user.
         // we have used clicktracking off, because it will stop email
         // service provider to make any changes to link that we are going to send
         const message = `
            <h1>You have requested a new password reset </h1>
            <p>Please go to this link to reset your password</p>
            <a href = ${resetUrl} clicktracking = off>${resetUrl}</a>
         `;

         try{
            await sendEmail({
                to : user.email,
                subject : "Password Reset Request",
                text : message
            });

            res.status(200).json({
                success : true,
                data : "Email sent"
            })
         }catch(error){
             console.log("error1");
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return next(new ErrorResponse("Email could not be sent", 500));
         }

    }catch(error){        
        return next(error);
    }
}

exports.resetpassword = async (req, res, next) => {
    console.log(req);
    // In the forgot password route we generated a resetToken and created a hash, and then updated the user's resetPasswordToken with that so now 
    // we are making sure that the same person is using the reset password
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");

    try{
        // $gt is checking whether the time has expired or not, if it is expired then we will not let the reseting of password happen
        const user = await User.findOne({resetPasswordToken, resetPasswordExpire : {$gt : Date.now()} });

        if(!user){
            return next(new ErrorResponse("Invalid reset token",400));
        }

        // Till here we have maked sure that there exist a valid user for this route
        // so we will change password, resetPasswordToken and resetPasswordExpire 
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(201).json({success : true, data : "Password Reset Success"})

    }catch(error){
        next(error);
    }
}

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken();
    res.status(statusCode).json({success : true, token})
}