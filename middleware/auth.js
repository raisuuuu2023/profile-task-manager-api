const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // get the part after "Bearer "

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.',
    });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    req.user = decoded;

    next(); 
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};