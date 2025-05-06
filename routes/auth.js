const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Account = require("../models/Account")
const { check, validationResult } = require("express-validator")

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  "/register",
  [
    check("firstName", "First name is required").not().isEmpty(),
    check("lastName", "Last name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 8 characters").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { firstName, lastName, email, password, phoneNumber, address } = req.body

    try {
      // Check if user already exists
      let user = await User.findOne({ email })
      if (user) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Create new user
      user = new User({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
      })

      await user.save()

      // Create account for the user
      const account = new Account({
        user: user._id,
        accountNumber: user.accountNumber,
      })

      await account.save()

      res.status(201).json({ message: "User registered successfully" })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [check("email", "Please include a valid email").isEmail(), check("password", "Password is required").exists()],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { email, password } = req.body

    try {
      // Check if user exists
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Create and return JWT token
      const payload = {
        user: {
          id: user._id,
          role: user.role,
        },
      }

      jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "24h" }, (err, token) => {
        if (err) throw err
        res.json({
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accountNumber: user.accountNumber,
            role: user.role,
          },
        })
      })
    } catch (err) {
      console.error(err.message)
      res.status(500).json({ message: "Server error" })
    }
  },
)

module.exports = router
