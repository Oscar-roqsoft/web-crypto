const express = require('express');
const {verifyToken} = require('../../../middlewares/authentication')

const router = express.Router();

const {
    setPin,updatePin,verifyPin
} = require('../handlers/pin');

router.route('/create').post(verifyToken,setPin)
router.route('/update').put(verifyToken,updatePin)
router.route('/verify').post(verifyToken,verifyPin)

module.exports = router