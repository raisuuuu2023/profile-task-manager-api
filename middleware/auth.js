const jwt = require('jsonwebtoken');
require('dotenv').config();

// This middleware runs before any protected route
module.exports = (req, res, next) => {
  // Token comes in the Authorization header like:
  // Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // get the part after "Bearer "

  // If no token was sent, block the request
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.',
    });
  }

  try {
    // Verify the token using our secret key
    // If token is fake or expired, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to req.user
    // Now any route can access req.user.id, req.user.role, etc.
    req.user = decoded;

    next(); // move on to the actual route
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};