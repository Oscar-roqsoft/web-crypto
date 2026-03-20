/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/
const User = require('../models/user');
const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require('../responses');


const updateProfile = async (req, res) => {

  try {

    const userId = req.user.userId; // coming from verifyToken middleware

    const { name, phone, country, avatar } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return sendBadRequestResponse(res, "User not found");
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (country) user.country = country;
    if (avatar) user.avatar = avatar;

    // Handle avatar upload
    if (req.file) {
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      user.avatar = avatarUrl;
    }

    await user.save();

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      avatar: user.avatar,
      walletAddress: user.walletAddress,
      balances: user.balances,
      role: user.role
    };

    sendSuccessResponseData(
      res,
      "Profile updated successfully",
      safeUser
    );

  } catch (error) {

    console.error("Update profile error:", error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};


const updateUserPassword = async (req, res) => {

  try {

    const userId = req.user.userId;

    const {  currentPassword, newPassword } = req.body;

    if ( !currentPassword || !newPassword) {
      return sendBadRequestResponse(res, 'currentPassword and new password required');
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return sendBadRequestResponse(res, 'User not found');
    }

    const isMatch =  await user.comparePassword(currentPassword)

    if(!isMatch){
      return sendBadRequestResponse(res, 'Old password is incorrect');
    }

    user.password = newPassword;

    await user.save();

    sendSuccessResponse(
      res,
      'Password updated successfully',
    );

  } catch (error) {

    console.error('Update password error:', error);
    sendUnauthenticatedErrorResponse(res, error.message);

  }

};




module.exports = {
  updateProfile,
  updateUserPassword
};