const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  accountNumber: {
    type: String,
    unique: true,
  },
  pin: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Generate account number before saving
UserSchema.pre("save", async function (next) {
  // Only generate account number if it doesn't exist
  if (!this.accountNumber) {
    // Generate a random 10-digit account number
    this.accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString()
  }

  // Hash password if it's modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  // Hash PIN if it's modified
  if (this.isModified("pin") && this.pin) {
    const salt = await bcrypt.genSalt(10)
    this.pin = await bcrypt.hash(this.pin, salt)
  }

  next()
})

// Method to compare password
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

// Method to compare PIN
UserSchema.methods.comparePin = async function (pin) {
  if (!this.pin) return false
  return await bcrypt.compare(pin, this.pin)
}

module.exports = mongoose.model("User", UserSchema)
