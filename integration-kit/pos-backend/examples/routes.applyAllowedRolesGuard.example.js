const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const allowedRolesGuard = require("../guards/allowedRolesGuard");

const router = express.Router();

router.get("/secure-example", isVerifiedUser, allowedRolesGuard, (req, res) => {
  res.json({ ok: true });
});

module.exports = router
