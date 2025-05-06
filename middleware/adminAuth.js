// Middleware to check if user is an admin
module.exports = (req, res, next) => {
    // Using MongoDB shell or a tool like MongoDB Compass
db.users.updateOne(
    { email: "nelson" },
    { $set: { role: "admin" } }
  )
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." })
    }
  
    next()
  }
  