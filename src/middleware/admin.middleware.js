/**
 * Admin Middleware
 * Checks if the user is authenticated and has admin role
 */

const verifyAdminToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization required.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // You would normally verify the token here (JWT verification)
    // For now, this is a placeholder - in a real app, you'd decode and verify the JWT
    // and check if req.user.role === 'ADMIN'
    
    // TODO: Implement JWT verification and role checking
    // Example:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if (decoded.role !== 'ADMIN') {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }
    // req.user = decoded;

    // For now, just attach a placeholder
    req.user = { role: 'ADMIN' }; // This should come from JWT verification

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
  verifyAdminToken
};
