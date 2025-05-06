const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")
const User = require("../models/User")
const Account = require("../models/Account")
const Transaction = require("../models/Transaction")
const { check, validationResult } = require("express-validator")

// Apply both auth and adminAuth middleware to all routes
router.use(auth)
router.use(adminAuth)

// @route   GET api/admin/users
// @desc    Get all users with their account details
// @access  Admin
router.get("/users", async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select("-password -pin")

    // Get account details for each user
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        const account = await Account.findOne({ user: user._id })

        return {
          ...user.toObject(),
          balance: account ? account.balance : 0,
          status: account ? account.status : "inactive",
        }
      }),
    )

    res.json(usersWithBalance)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/admin/add-balance
// @desc    Add balance to a user's account
// @access  Admin
router.post(
  "/add-balance",
  [
    check("userId", "User ID is required").not().isEmpty(),
    check("amount", "Amount must be a positive number").isFloat({ min: 0.01 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { userId, amount, description } = req.body

    try {
      // Find the user
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Find the user's account
      const account = await Account.findOne({ user: userId })
      if (!account) {
        return res.status(404).json({ message: "Account not found" })
      }

      // Update account balance
      account.balance += Number.parseFloat(amount)
      await account.save()

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: "deposit",
        amount: Number.parseFloat(amount),
        sender: "Admin",
        description: description || "Admin deposit",
        status: "completed",
      })

      await transaction.save()

      res.json({
        message: "Balance updated successfully",
        newBalance: account.balance,
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

module.exports = router
