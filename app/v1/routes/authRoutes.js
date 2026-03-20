const express = require('express')


const router= express.Router()


const { register,login,verifyOTP,resendOTP,updatePassword} = require('../handlers/auth')


router.route('/register').post(register)

router.route('/login').post(login)

// router.route('/verify-email').get(verificationEmailLink)

// router.route('/sendCode').post(sentVerificationCode)
router.route('/sendCode').post(resendOTP)
router.route('/verifyCode').post(verifyOTP)
router.route('/updatePassword').post(updatePassword)


// app.use(notFound)
module.exports = router