const User = require('../models/user');
const crypto = require('crypto');
const cache = require('../../../db/cache');
const sendOTP = require('../../../utils/sendOTP');
const Wallet = require("../models/walletAddress");
const generateWalletAddress = require("../../../utils/generateWalletAddress");


const {
  sendConflictResponse,
  sendBadRequestResponse,
  sendUnauthenticatedErrorResponse,
  sendSuccessResponseData
} = require('../responses');


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
const register = async (req, res) => {

  try {

    const { name, email, password, phone, country } = req.body;

    if (!name || !email || !password || !country) {
      return sendBadRequestResponse(
        res,
        'Please provide name, email, password and country'
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendConflictResponse(res, 'Email already exists');
    }

    const walletAddress = '0x' + crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      phone,
      country,
      walletAddress,
      balances: {
        BTC: 0,
        ETH: 0,
        USDT: 0
      },
    });

    const accessToken = user.createJWT();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      avatar: user.avatar,
      walletAddress: user.walletAddress,
      balances: user.balances,
      role: user.role,
      isVerified: user.isVerified,
      isPinSet: user.isPinSet,
      pin: user.pin
    };

    // await sendOTP(safeUser, accessToken);

    sendSuccessResponseData(
      res,
      'User registered successfully. OTP sent to email.',
      null
    );

    const coins = ["BTC","ETH","USDT","TRX","SOL","XRP","XLM","ADA"];

    for (let coin of coins) {

      await Wallet.create({
        userId: user._id,
        coin,
        network: coin,
        address: generateWalletAddress(coin)
      });

    }

  } catch (error) {

    console.error('Register error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }
};



/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
*/
const verifyOTP = async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendBadRequestResponse(res, 'Email and OTP required');
    }

    const storedOTP = cache.get(email);
    console.log(storedOTP,email)

    if (!storedOTP) {
      return sendBadRequestResponse(res, 'OTP expired');
    }

    if (storedOTP !== otp) {
      return sendBadRequestResponse(res, 'Invalid OTP');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return sendBadRequestResponse(res, 'User not Found');
    }

    user.isVerified = true;
    await user.save();


    cache.del(`otp_${email}`);

    const token = user.createJWT();

    const safeUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        balances: user.balances,
        country:user.country,
        avatar:user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        isPinSet: user.isPinSet,
        pin: user.pin
    };

    sendSuccessResponseData(
      res,
      'Email verified successfully',
      {

        token,
        ...safeUser
      }
    );

  } catch (error) {

    console.error('Verify OTP error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};



/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/
const resendOTP = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return sendBadRequestResponse(res, 'Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return sendBadRequestResponse(res, 'User not found');
    }

    // if (user.isVerified) {
    //   return sendBadRequestResponse(res, 'Email already verified');
    // }

    const token = user.createJWT();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    await sendOTP(safeUser, token);

    sendSuccessResponseData(
      res,
      'OTP resent successfully',
      null
    );

  } catch (error) {

    console.error('Resend OTP error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};



/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return sendBadRequestResponse(res, 'Email and password required');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendBadRequestResponse(res, 'Invalid credentials');
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendBadRequestResponse(res, 'Invalid credentials');
    }

    if (!user.isVerified) {

      const token = user.createJWT();

      await sendOTP(user, token);

      return sendSuccessResponseData(
        res,
        'Account not verified. OTP sent to your email.',
        null
      );

    }

    

    const token = user.createJWT();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      balances: user.balances,
      country:user.country,
      avatar:user.avatar,
      role: user.role,
      isPinSet: user.isPinSet,
      isVerified: user.isVerified,
      pin: user.pin
    };

    sendSuccessResponseData(
      res,
      'Login successful',
      {
        ...safeUser,
        token
      }
    );

    

  } catch (error) {

    console.error('Login error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};


/*
|--------------------------------------------------------------------------
| UPDATE PASSWORD
|--------------------------------------------------------------------------
*/
const updatePassword = async (req, res) => {

  try {

    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return sendBadRequestResponse(res, 'Email and new password required');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendBadRequestResponse(res, 'User not found');
    }

    user.password = newPassword;

    await user.save();

    sendSuccessResponseData(
      res,
      'Password updated successfully',
      null
    );

  } catch (error) {

    console.error('Update password error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};


// const User = require("./models/User");

// const createAdmin = async () => {

//   const admin = new User({
//     name:"admin",
//     email:"admin@admin.com",
//     password:"admin4admin",
//     role:"admin",
//     country:"nigeria"
//   });

//   await admin.save();

//   console.log("Admin created");
// }

// createAdmin();



module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  updatePassword
};