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
      twoFactorVerification
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
    if (twoFactorVerification) user.twoFactorVerification = twoFactorVerification;

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
      Object.assign(user.userIdentity, userIdentity);
    
      if (
        userIdentity.status === "pending" &&
        !user.userIdentity.submittedAt
      ) {
        user.userIdentity.submittedAt = new Date();
      }
    
      user.markModified("userIdentity");
    }
  
    await user.save();
    const savedUser = await User.findById(user._id).lean();

    console.dir(savedUser.userIdentity, { depth: null });

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

const approveKYC = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return sendBadRequestResponse(res, "User not found");
    }

    user.twoFactorVerification = true;

    user.userIdentity.status = "verified";
    user.userIdentity.reviewedAt = new Date();
    user.userIdentity.rejectionReason = null;

    user.markModified("userIdentity");

    await user.save();

    return sendSuccessResponseData(
      res,
      "KYC approved successfully",
      {
        id: user._id,
        twoFactorVerification: user.twoFactorVerification,
        userIdentity: user.userIdentity,
      }
    );
  } catch (error) {
    console.error(error);

    return sendUnauthenticatedErrorResponse(
      res,
      error.message
    );
  }
};

/*
|--------------------------------------------------------------------------
| REJECT KYC
|--------------------------------------------------------------------------
*/
const rejectKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendBadRequestResponse(
        res,
        "Rejection reason is required."
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return sendBadRequestResponse(res, "User not found");
    }

    user.twoFactorVerification = false;

    user.userIdentity.status = "rejected";
    user.userIdentity.reviewedAt = new Date();
    user.userIdentity.rejectionReason = reason;

    user.markModified("userIdentity");

    await user.save();

    return sendSuccessResponseData(
      res,
      "KYC rejected successfully",
      {
        id: user._id,
        twoFactorVerification: user.twoFactorVerification,
        userIdentity: user.userIdentity,
      }
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
          userIdentity:1,
          country:1,
          twoFactorVerification:1,
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
  updateUserPassword,
  approveKYC,
  rejectKYC,
};