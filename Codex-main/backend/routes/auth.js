const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Utility functions
const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;

const extractCredential = (primary, fallback) => {
  if (typeof primary === 'string' && primary.trim()) {
    return primary.trim();
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }
  return undefined;
};

// Map user record consistently
const mapUserRecord = (record) => ({
  id: record.UserID,
  email: record.Email,
  name: record.FullName,
  role: record.Role?.toLowerCase?.() || record.Role,
  department: record.Department,
  phoneNumber: record.PhoneNumber,
  traineeId: record.TraineeID,
  traineeStatus: record.TraineeStatus?.toLowerCase?.() || record.TraineeStatus,
  startDate: record.StartDate,
  endDate: record.EndDate,
});

// 🔹 Register new user (Admin only)
router.post('/register', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const email = extractCredential(req.body.Email, req.body.email);
    const password = extractCredential(req.body.Password, req.body.password);
    const fullName = extractCredential(req.body.FullName, req.body.fullName);
    const role = extractCredential(req.body.Role, req.body.role);
    const normalizedRole = role ? role.toLowerCase() : null;
    const department = req.body.Department ?? req.body.department ?? null;
    const phoneNumber = req.body.PhoneNumber ?? req.body.phoneNumber ?? null;

    if (!email || !password || !fullName || !normalizedRole) {
      return res.status(400).json({
        message: 'Email, password, full name, and role are required',
      });
    }

    const pool = await getPool();

    // Check if user already exists
    const existing = await pool
      .request()
      .input('Email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @Email');

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool
      .request()
      .input('Email', sql.NVarChar, email)
      .input('PasswordHash', sql.NVarChar, hash)
      .input('FullName', sql.NVarChar, fullName)
      .input('Role', sql.NVarChar, normalizedRole)
      .input('Department', sql.NVarChar, department)
      .input('PhoneNumber', sql.NVarChar, phoneNumber)
      .query(`
        INSERT INTO Users (Email, PasswordHash, FullName, Role, Department, PhoneNumber, IsActive, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@Email, @PasswordHash, @FullName, @Role, @Department, @PhoneNumber, 1, GETDATE())
      `);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: mapUserRecord(result.recordset[0]),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 Login
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.Email || req.body.email);
    const password = req.body.Password || req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('Email', sql.NVarChar, email)
      .query(`
        SELECT 
          u.UserID,
          u.Email,
          u.PasswordHash,
          u.Role,
          u.FullName,
          u.Department,
          u.PhoneNumber,
          t.TraineeID,
          t.Status AS TraineeStatus,
          t.StartDate,
          t.EndDate
        FROM Users u
        LEFT JOIN Trainees t ON u.UserID = t.UserID
        WHERE u.Email = @Email AND u.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await pool
      .request()
      .input('UserID', sql.Int, user.UserID)
      .query('UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @UserID');

    const token = jwt.sign(
      { userId: user.UserID, email: user.Email, role: user.Role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: mapUserRecord(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UserID', sql.Int, req.user.userId)
      .query(`
        SELECT 
          u.UserID,
          u.Email,
          u.FullName,
          u.Role,
          u.Department,
          u.PhoneNumber,
          u.CreatedAt,
          u.LastLogin,
          t.TraineeID,
          t.StartDate,
          t.EndDate,
          t.Status AS TraineeStatus
        FROM Users u
        LEFT JOIN Trainees t ON u.UserID = t.UserID
        WHERE u.UserID = @UserID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: mapUserRecord(result.recordset[0]),
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
