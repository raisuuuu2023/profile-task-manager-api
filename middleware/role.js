// This middleware checks if the logged-in user has the right role
// Usage: role('admin') or role('admin', 'user')
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was set by auth middleware before this runs
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next(); // role is allowed, continue
  };
};