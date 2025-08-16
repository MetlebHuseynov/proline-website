const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Helper function to read JSON file (fallback)
const readJSONFile = (filename) => {
    try {
        const filePath = path.join(__dirname, '..', 'data', filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

// Helper function to get user from PostgreSQL
const getUserFromDB = async (userId) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting user from database:', error);
        return null;
    }
};

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'proline_secret_key_2024');
    console.log('Decoded token:', decoded);

    // Find user in PostgreSQL database
    let user = await getUserFromDB(decoded.id);
    
    // Fallback to JSON file if PostgreSQL fails
    if (!user) {
      const users = readJSONFile('users.json');
      user = users.find(u => u.id === decoded.id);
    }
    
    console.log('Found user:', user ? { id: user.id, email: user.email, role: user.role } : 'null');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin only middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
};