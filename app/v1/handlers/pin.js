const bcrypt = require("bcryptjs")
const User = require('../models/user');
const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require('../responses');


const setPin = async (req, res) => {

    try {
  
      const userId = req.user.userId;
  
      const { pin } = req.body;
  
      if (!/^\d{4}$/.test(pin)) {
        return sendBadRequestResponse(res, 'Pin must be exactly 4 digits');
      }

  
      const user = await User.findById(userId);
  
      if (!user) {
        return sendBadRequestResponse(res, 'User not found');
      }
  
  
      if(user.pin){
        return sendBadRequestResponse(res, 'Pin already set ,use update pin instead');
      }
  
      
      const hashpin = await user.setPin(pin);
      user.pin = hashpin
      user.isPinSet = true;

    //   console.log(hashpin)

      user.save()

      sendSuccessResponse(
        res,
        'Pin set successfully',
      );
  
    } catch (error) {
  
      console.error('Set pin error:', error);
      sendUnauthenticatedErrorResponse(res, error.message);
  
    }
  
};


const updatePin = async (req, res) => {

    try {
  
      const userId = req.user.userId;
  
      const { currentPin, newPin } = req.body;
  
      if (!/^\d{4}$/.test(newPin)) {
        return sendBadRequestResponse(res, 'New pin must be exactly 4 digits');
      }
  
      const user = await User.findById(userId).select("+pin");
  
      if (!user || !user.isPinSet) {
        return sendBadRequestResponse(res, 'Pin not set');
      }
  
      const isMatch = await user.comparePin(currentPin);
  
      if (!isMatch) {
        return sendBadRequestResponse(res, 'Old pin is incorrect');
      }
  
      const hashpin = await user.setPin(newPin);
  
      user.pin = hashpin;
  
      await user.save();
  
      sendSuccessResponse(res, 'Pin updated successfully');
  
    } catch (error) {
  
      console.error('Update Pin error:', error);
      sendUnauthenticatedErrorResponse(res, error.message);
  
    }
  
  };

  const verifyPin = async (req, res) => {

    try {
  
      const userId = req.user.userId;
  
      const { pin } = req.body;
  
      if (!/^\d{4}$/.test(pin)) {
        return sendBadRequestResponse(res, 'Pin must be exactly 4 digits');
      }
  
      const user = await User.findById(userId).select("+pin");
  
      if (!user || !user.pin) {
        return sendBadRequestResponse(res, 'Pin not set');
      }
  
      const isMatch = await user.comparePin(pin);
  
      if (!isMatch) {
        return sendBadRequestResponse(res, 'Incorrect pin');
      }
  
      sendSuccessResponse(
        res,
        'Pin verified successfully'
      );
  
    } catch (error) {
  
      console.error('Pin verify error:', error);
      sendUnauthenticatedErrorResponse(res, error.message);
  
    }
  
  };


  module.exports = {
    setPin,
    updatePin,
    verifyPin
  };