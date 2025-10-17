const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 🧭 Map DB record to object
const mapTraineeRecord = (record) => ({
  id: record.TraineeID,
  userId: record.UserID,
  employeeId: record.EmployeeID,
  startDate: record.StartDate,
  endDate: record.EndDate,
  trainingType: record.TrainingType,
  status: typeof record.Status === 'string' ? record.Status.toLowerCase() : record.Status,
  advisorId: record.AdvisorID,
  createdAt: record.CreatedAt,
  user: {
    id: record.UserID,
    name: record.FullName,
    email: record.Email,
    role: record.UserRole,
    department: record.Department,
    phoneNumber: record.PhoneNumber,
  },
  advisor: record.AdvisorID ? {
    id: record.AdvisorID,
    name: record.AdvisorName,
    email: record.AdvisorEmail,
    role: record.AdvisorRole,
    department: record.AdvisorDepartment,
  } : null,
});

// 🧱 Base SELECT query
const traineeSelectQuery = `
  SELECT
    t.TraineeID, t.UserID, t.EmployeeID, t.StartDate, t.EndDate,
    t.TrainingType, t.Status, t.AdvisorID, t.CreatedAt,
    u.FullName, u.Email, u.Department, u.PhoneNumber, u.Role AS UserRole,
    a.FullName AS AdvisorName, a.Email AS AdvisorEmail,
    a.Role AS AdvisorRole, a.Department AS AdvisorDepartment
  FROM Trainees t
  INNER JOIN Users u ON t.UserID = u.UserID
  LEFT JOIN Users a ON t.AdvisorID = a.UserID
`;

// 🔹 GET all trainees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`${traineeSelectQuery} ORDER BY t.CreatedAt DESC`);

    res.json({
      success: true,
      data: result.recordset.map(mapTraineeRecord),
    });
  } catch (error) {
    console.error('Get trainees error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 GET trainee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('TraineeID', sql.Int, req.params.id)
      .query(`${traineeSelectQuery} WHERE t.TraineeID = @TraineeID`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    res.json({
      success: true,
      data: mapTraineeRecord(result.recordset[0]),
    });
  } catch (error) {
    console.error('Get trainee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 CREATE trainee (Admin/Advisor)
router.post('/', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const { UserID, userId, EmployeeID, employeeId, StartDate, startDate, EndDate, endDate, TrainingType, trainingType, AdvisorID, advisorId } = req.body;

    const user = UserID ?? userId;
    const empId = EmployeeID ?? employeeId;
    const start = StartDate ?? startDate;
    const end = EndDate ?? endDate;
    const type = TrainingType ?? trainingType ?? null;
    const advisor = AdvisorID ?? advisorId ?? null;

    if (!user || !empId || !start || !end) {
      return res.status(400).json({ message: 'User, employee ID, start and end date are required' });
    }

    const pool = await getPool();

    // Insert trainee
    const insertResult = await pool.request()
      .input('UserID', sql.Int, user)
      .input('EmployeeID', sql.NVarChar, empId)
      .input('StartDate', sql.Date, start)
      .input('EndDate', sql.Date, end)
      .input('TrainingType', sql.NVarChar, type)
      .input('AdvisorID', sql.Int, advisor)
      .query(`
        INSERT INTO Trainees (UserID, EmployeeID, StartDate, EndDate, TrainingType, AdvisorID)
        OUTPUT INSERTED.TraineeID
        VALUES (@UserID, @EmployeeID, @StartDate, @EndDate, @TrainingType, @AdvisorID)
      `);

    const traineeId = insertResult.recordset[0].TraineeID;

    // Return the created record
    const result = await pool.request()
      .input('TraineeID', sql.Int, traineeId)
      .query(`${traineeSelectQuery} WHERE t.TraineeID = @TraineeID`);

    res.status(201).json({
      success: true,
      message: 'Trainee created successfully',
      data: mapTraineeRecord(result.recordset[0]),
    });
  } catch (error) {
    console.error('Create trainee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 UPDATE trainee (Admin/Advisor)
router.put('/:id', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const pool = await getPool();

    await pool.request()
      .input('TraineeID', sql.Int, req.params.id)
      .input('EmployeeID', sql.NVarChar, req.body.EmployeeID ?? req.body.employeeId ?? null)
      .input('StartDate', sql.Date, req.body.StartDate ?? req.body.startDate ?? null)
      .input('EndDate', sql.Date, req.body.EndDate ?? req.body.endDate ?? null)
      .input('TrainingType', sql.NVarChar, req.body.TrainingType ?? req.body.trainingType ?? null)
      .input('Status', sql.NVarChar, req.body.Status ?? req.body.status ?? null)
      .input('AdvisorID', sql.Int, req.body.AdvisorID ?? req.body.advisorId ?? null)
      .query(`
        UPDATE Trainees
        SET
          EmployeeID = COALESCE(@EmployeeID, EmployeeID),
          StartDate = COALESCE(@StartDate, StartDate),
          EndDate = COALESCE(@EndDate, EndDate),
          TrainingType = COALESCE(@TrainingType, TrainingType),
          Status = COALESCE(@Status, Status),
          AdvisorID = COALESCE(@AdvisorID, AdvisorID)
        WHERE TraineeID = @TraineeID
      `);

    const updated = await pool.request()
      .input('TraineeID', sql.Int, req.params.id)
      .query(`${traineeSelectQuery} WHERE t.TraineeID = @TraineeID`);

    if (updated.recordset.length === 0) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    res.json({
      success: true,
      message: 'Trainee updated successfully',
      data: mapTraineeRecord(updated.recordset[0]),
    });
  } catch (error) {
    console.error('Update trainee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 🔹 DELETE trainee (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('TraineeID', sql.Int, req.params.id)
      .query('DELETE FROM Trainees WHERE TraineeID = @TraineeID');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    res.json({
      success: true,
      message: 'Trainee deleted successfully',
    });
  } catch (error) {
    console.error('Delete trainee error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
