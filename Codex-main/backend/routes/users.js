const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const mapUserRecord = (record) => ({
  id: record.UserID,
  email: record.Email,
  name: record.FullName,
  role: typeof record.Role === 'string' ? record.Role.toLowerCase() : record.Role,
  department: record.Department,
  phoneNumber: record.PhoneNumber,
  isActive: record.IsActive,
  createdAt: record.CreatedAt,
  lastLogin: record.LastLogin,
  traineeId: record.TraineeID,
  traineeStatus: typeof record.TraineeStatus === 'string' ? record.TraineeStatus.toLowerCase() : record.TraineeStatus,
  startDate: record.StartDate,
  endDate: record.EndDate,
});

// 🔹 Get all users (Admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        u.UserID, u.Email, u.FullName, u.Role, u.Department, u.PhoneNumber,
        u.IsActive, u.CreatedAt, u.LastLogin,
        t.TraineeID, t.StartDate, t.EndDate, t.Status as TraineeStatus
      FROM Users u
      LEFT JOIN Trainees t ON u.UserID = t.UserID
      ORDER BY u.CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset.map(mapUserRecord)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 Get single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('UserID', sql.Int, req.params.id)
      .query(`
        SELECT 
          u.UserID, u.Email, u.FullName, u.Role, u.Department, u.PhoneNumber,
          u.CreatedAt, u.LastLogin,
          t.TraineeID, t.EmployeeID, t.StartDate, t.EndDate, t.TrainingType, t.Status as TraineeStatus
        FROM Users u
        LEFT JOIN Trainees t ON u.UserID = t.UserID
        WHERE u.UserID = @UserID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: mapUserRecord(result.recordset[0])
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 Update user info (Admin or self)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const fullName = req.body.FullName ?? req.body.fullName ?? null;
    const department = req.body.Department ?? req.body.department ?? null;
    const phoneNumber = req.body.PhoneNumber ?? req.body.phoneNumber ?? null;

    const pool = await getPool();

    // Check permissions
    if (req.user.id !== parseInt(req.params.id, 10) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await pool.request()
      .input('UserID', sql.Int, req.params.id)
      .input('FullName', sql.NVarChar, fullName)
      .input('Department', sql.NVarChar, department)
      .input('PhoneNumber', sql.NVarChar, phoneNumber)
      .query(`
        UPDATE Users
        SET
          FullName = COALESCE(@FullName, FullName),
          Department = COALESCE(@Department, Department),
          PhoneNumber = COALESCE(@PhoneNumber, PhoneNumber)
        WHERE UserID = @UserID
      `);

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
