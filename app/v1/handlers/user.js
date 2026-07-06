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

    const userId = req.user.userId;

    const {
      name,
      phone,
      country,
      avatar,
      userIdentity,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return sendBadRequestResponse(
        res,
        "User not found"
      );
    }

    // -----------------------------
    // Basic Profile
    // -----------------------------

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (country) user.country = country;
    if (avatar) user.avatar = avatar;

    // -----------------------------
    // Avatar Upload
    // -----------------------------

    if (req.file) {
      user.avatar = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${req.file.filename}`;
    }

    // -----------------------------
    // KYC
    // -----------------------------

    if (userIdentity) {

      user.userIdentity = {
        ...user.userIdentity,

        firstName: userIdentity.firstName,
        lastName: userIdentity.lastName,
        dob: userIdentity.dob,
        nationality: userIdentity.nationality,
        address: userIdentity.address,

        documentType: userIdentity.documentType,
        documentNumber: userIdentity.documentNumber,

        frontFile: userIdentity.frontFile,
        backFile: userIdentity.backFile,
        selfieFile: userIdentity.selfieFile,

        status: "pending",
        submittedAt: new Date(),
      };

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

      role: user.role,
      isVerified: user.isVerified,
      isPinSet: user.isPinSet,
      twoFactorVerification: user.twoFactorVerification,

      userIdentity: user.userIdentity,
    };

    return sendSuccessResponseData(
      res,
      "Profile updated successfully",
      safeUser
    );

  } catch (error) {

    console.error(error);

    return sendUnauthenticatedErrorResponse(
      res,
      error.message
    );

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


const getUsersWithBalances = async (req, res) => {
  try {

    const users = await User.aggregate([

      /* =========================
         JOIN WALLETS
      ========================== */
      {
        $lookup: {
          from: "balances", // collection name
          localField: "_id",
          foreignField: "userId",
          as: "wallets"
        }
      },

      /* =========================
         CALCULATE TOTAL BALANCE
      ========================== */
      {
        $addFields: {
          totalBalance: {
            $sum: "$wallets.balance"
          }
        }
      },

      /* =========================
         FORMAT RESPONSE
      ========================== */
      {
        $project: {
          name: 1,
          email: 1,
          country: 1,
          phone: 1,
          isVerified: 1,
          totalBalance: 1,
          wallets: {
            $map: {
              input: "$wallets",
              as: "w",
              in: {
                coin: "$$w.coin",
                balance: "$$w.balance",
                network:"$$w.network"
              }
            }
          }
        }
      }

    ])


    const normalizeUsers  = Array.isArray(users) ? users : Object.values(users || {})

    return sendSuccessResponseData(
      res,
      "Users fetched successfully",
      { users : normalizeUsers }
    )

  } catch (err) {
    console.error("Get users error:", err)
    return sendBadRequestResponse(res, err.message)
  }
}





module.exports = {
  updateProfile,
  getUsersWithBalances,
  updateUserPassword
};