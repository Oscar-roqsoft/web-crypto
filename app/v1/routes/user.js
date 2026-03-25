const express = require('express');
const {verifyToken,adminAuth} = require('../../../middlewares/authentication')

const router = express.Router();

const {
    updateProfile,
    updateUserPassword,getUsersWithBalances
} = require('../handlers/user');

router.route('/update').patch(verifyToken,updateProfile)
router.route('/getUser').get(verifyToken,adminAuth,getUsersWithBalances)
router.route('/updateUserPassword').put(verifyToken,updateUserPassword)

module.exports = router
