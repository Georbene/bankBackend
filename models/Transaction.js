const mongoose = require("mongoose")

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit", "transfer", "deposit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  recipient: {
    type: String,
  },
  sender: {
    type: String,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed",
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Transaction", TransactionSchema)
