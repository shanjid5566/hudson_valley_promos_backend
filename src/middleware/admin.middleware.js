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

/**
 * Verify User or Admin Token
 * Allows both authenticated users and admins
 * Users can only access their own profile, admins can access any profile
 */
const verifyUserOrAdminToken = (req, res, next) => {
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

    // TODO: Implement JWT verification
    // This should decode the token and determine if it's a user or admin token
    // For now, placeholder logic:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded; // Contains { id, email, role, ... }

    // Placeholder: For testing, set a user
    req.user = { id: token, role: 'USER' }; // This should come from JWT verification

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
