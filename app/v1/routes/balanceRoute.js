const express = require('express');
const {verifyToken,adminAuth} = require('../../../middlewares/authentication')

const router = express.Router();

const {
    getUserBalances,calculateGasFee,swapCrypto,sendCrypto,fundUserWallet
} = require('../handlers/balance');

router.route('/all').get(verifyToken,getUserBalances)
// router.route('/update').put(verifyToken,updatePin)
router.route('/cal').post(verifyToken,calculateGasFee)
router.route('/swap').post(verifyToken,swapCrypto)
router.route('/send').post(verifyToken,sendCrypto)
router.route('/fund').post(verifyToken,adminAuth,fundUserWallet)

module.exports = router