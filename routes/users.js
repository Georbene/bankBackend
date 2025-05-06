const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const auth = require("../middleware/auth")
const User = require("../models/User")
const { check, validationResult } = require("express-validator")

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -pin")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  const { firstName, lastName, phoneNumber, address } = req.body

  // Build user object
  const userFields = {}
  if (firstName) userFields.firstName = firstName
  if (lastName) userFields.lastName = lastName
  if (phoneNumber) userFields.phoneNumber = phoneNumber
  if (address) userFields.address = address

  try {
    let user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update
    user = await User.findByIdAndUpdate(req.user.id, { $set: userFields }, { new: true }).select("-password -pin")

    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/users/password
// @desc    Update user password
// @access  Private
router.put(
  "/password",
  [
    auth,
    check("currentPassword", "Current password is required").exists(),
    check("newPassword", "New password must be at least 8 characters").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { currentPassword, newPassword } = req.body

    try {
      const user = await User.findById(req.user.id)

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Check current password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" })
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(newPassword, salt)

      await user.save()

      res.json({ message: "Password updated successfully" })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   POST api/users/create-pin
// @desc    Create or update PIN
// @access  Private
router.post(
  "/create-pin",
  [auth, check("pin", "PIN must be 4 digits").isLength({ min: 4, max: 4 }).isNumeric()],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { pin } = req.body

    try {
      const user = await User.findById(req.user.id)

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Update PIN
      user.pin = pin
      await user.save()

      res.json({ message: "PIN created successfully" })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

module.exports = router
