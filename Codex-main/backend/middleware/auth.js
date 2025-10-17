const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// 🔹 Middleware: Verify JWT and ensure user exists
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await getPool();

    // Check if the user still exists and is active
    const result = await pool.request()
      .input('UserID', sql.Int, decoded.userId)
      .query(`
        SELECT UserID, Email, Role, FullName, Department, IsActive 
        FROM Users 
        WHERE UserID = @UserID
      `);

    if (result.recordset.length === 0 || !result.recordset[0].IsActive) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    const user = result.recordset[0];
    req.user = {
      id: user.UserID,
      email: user.Email,
      name: user.FullName,
      role: user.Role ? user.Role.toLowerCase() : null,
      department: user.Department,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 🔹 Middleware: Restrict route by role
const requireRole = (roles) => {
  const normalized = roles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    const userRole = (req.user?.role || '').toLowerCase();
    if (!normalized.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
