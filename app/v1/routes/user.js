const express = require('express');
const {verifyToken,adminAuth} = require('../../../middlewares/authentication')

const router = express.Router();

const {
    updateProfile,
    updateUserPassword,getUsersWithBalances,rejectKYC,approveKYC
} = require('../handlers/user');

router.route('/update').patch(verifyToken,updateProfile)
router.route('/getUser').get(verifyToken,adminAuth,getUsersWithBalances)
router.route('/updateUserPassword').put(verifyToken,updateUserPassword)
router.patch(
    "/:id/approve-kyc",
    verifyToken,
    adminAuth,
    approveKYC
  );
  
 router.patch(
    "/:id/reject-kyc",
    verifyToken,
    adminAuth,
    rejectKYC
  );
  
module.exports = router
