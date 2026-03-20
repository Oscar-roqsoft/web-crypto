const express = require('express');
const {verifyToken} = require('../../../middlewares/authentication')

const router = express.Router();

const {
    updateProfile,
    updateUserPassword
} = require('../handlers/user');

router.route('/update').patch(verifyToken,updateProfile)
router.route('/updateUserPassword').put(verifyToken,updateUserPassword)

module.exports = router
