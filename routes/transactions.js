const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const User = require("../models/User")
const Account = require("../models/Account")
const Transaction = require("../models/Transaction")
const { check, validationResult } = require("express-validator")

// @route   GET api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 })
    res.json(transactions)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/transactions/transfer
// @desc    Transfer money to another account
// @access  Private
router.post(
  "/transfer",
  [
    auth,
    check("recipientAccount", "Recipient account number is required").not().isEmpty(),
    check("amount", "Amount must be a positive number").isFloat({ min: 0.01 }),
    check("pin", "PIN is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { recipientAccount, amount, pin, description } = req.body

    try {
      // Get sender user and account
      const sender = await User.findById(req.user.id)
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" })
      }

      // Verify PIN
      const isPinValid = await sender.comparePin(pin)
      if (!isPinValid) {
        return res.status(400).json({ message: "Invalid PIN" })
      }

      const senderAccount = await Account.findOne({ user: req.user.id })
      if (!senderAccount) {
        return res.status(404).json({ message: "Sender account not found" })
      }

      // Check if sender has enough balance
      if (senderAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" })
      }

      // Get recipient account
      const recipientAccountDoc = await Account.findOne({ accountNumber: recipientAccount })
      if (!recipientAccountDoc) {
        return res.status(404).json({ message: "Recipient account not found" })
      }

      // Get recipient user
      const recipient = await User.findById(recipientAccountDoc.user)
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" })
      }

      // Update sender account balance
      senderAccount.balance -= Number.parseFloat(amount)
      await senderAccount.save()

      // Update recipient account balance
      recipientAccountDoc.balance += Number.parseFloat(amount)
      await recipientAccountDoc.save()

      // Create transaction record for sender (debit)
      const senderTransaction = new Transaction({
        user: req.user.id,
        type: "debit",
        amount,
        recipient: `${recipient.firstName} ${recipient.lastName}`,
        description: description || "Transfer",
        status: "completed",
      })

      await senderTransaction.save()

      // Create transaction record for recipient (credit)
      const recipientTransaction = new Transaction({
        user: recipient._id,
        type: "credit",
        amount,
        sender: `${sender.firstName} ${sender.lastName}`,
        description: description || "Transfer",
        status: "completed",
      })

      await recipientTransaction.save()

      res.json({ message: "Transfer successful" })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

module.exports = router
