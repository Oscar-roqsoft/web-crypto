const express = require("express");
const router = express.Router();

const { getCryptoPrices } = require("../handlers/crypto");

router.get("/prices", getCryptoPrices);

module.exports = router;