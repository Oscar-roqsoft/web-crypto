const express = require('express')
const router = express.Router()
const { getUserTransactions } = require('../handlers/transaction')
const {verifyToken} = require('../../../middlewares/authentication')

router.get('/all', verifyToken, getUserTransactions)

module.exports = router