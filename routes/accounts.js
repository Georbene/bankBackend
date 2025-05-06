const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const Account = require("../models/Account")

// @route   GET api/accounts/balance
// @desc    Get account balance
// @access  Private
router.get("/balance", auth, async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id })

    if (!account) {
      return res.status(404).json({ message: "Account not found" })
    }

    res.json({ balance: account.balance })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
