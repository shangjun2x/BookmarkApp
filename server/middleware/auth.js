const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bookmark-app-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, isGuest: !!user.isGuest },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Optional auth — sets req.user if valid token, otherwise continues without auth
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // ignore invalid token
    }
  }
  next();
}

module.exports = { authenticateToken, optionalAuth, generateToken, JWT_SECRET };
