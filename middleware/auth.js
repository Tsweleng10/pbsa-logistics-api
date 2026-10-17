// middleware/auth.js
// Verifies JWT tokens for protected routes

const jwt = require('jsonwebtoken');

/**
 * Protects a route — requires a valid JWT in the Authorization header.
 * Usage: router.get('/protected', requireAuth, handler);
 * Client sends: Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = header.slice(7); // remove "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request so route handlers can access it
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Role-based access control.
 * Usage: router.post('/', requireAuth, requireRole('DISPATCHER', 'ADMIN'), handler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };