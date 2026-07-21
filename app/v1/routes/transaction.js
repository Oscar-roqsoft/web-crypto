const express = require('express')
const router = express.Router()
const { getUserTransactions,getUserAdminTransactions } = require('../handlers/transaction')
const {verifyToken,adminAuth} = require('../../../middlewares/authentication')

router.get('/all', verifyToken, getUserTransactions)

router.get('/admin/all', adminAuth, getUserAdminTransactions)

module.exports = router