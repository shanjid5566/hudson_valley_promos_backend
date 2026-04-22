/**
 * Admin Middleware
 * Checks if the user is authenticated and has admin role
 */

const verifyAdminToken = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization required.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Decode and verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
    
    // Check if user has ADMIN role
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Attach decoded user data to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: error.message
    });
  }
};

/**
 * Verify User or Admin Token
 * Allows both authenticated users and admins
 * Users can only access their own profile, admins can access any profile
 */
const verifyUserOrAdminToken = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization required.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Decode and verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
    
    // Attach decoded user data to request object
    // Token contains: { userId, email, role }
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: error.message
    });
  }
};

module.exports = {
  verifyAdminToken,
  verifyUserOrAdminToken
};
