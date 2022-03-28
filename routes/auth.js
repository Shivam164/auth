const express = require('express');

const router = express.Router();

// using the register function that we wrote in auth file insdie controllers folder
const { register, login, forgotpassword, resetpassword } = require('../controllers/auth');

// this is same as writing => router.post('/register',register)
router.route('/register').post(register);

router.route('/login').post(login);

router.route('/forgotpassword').post(forgotpassword);

router.route('/resetPassword/:resetToken').put(resetpassword);

module.exports = router;