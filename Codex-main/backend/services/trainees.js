const { getPool, sql } = require('../config/database');

const baseSelect = `
  SELECT
    t.Id AS id,
    t.UserId AS userId,
    t.EmployeeId AS employeeId,
    t.StartDate AS startDate,
    t.EndDate AS endDate,
    t.TrainingType AS trainingType,
    t.Status AS status,
    t.AdvisorId AS advisorId,
    t.CreatedAt AS createdAt,
    u.Id AS user_id,
    u.Email AS user_email,
    u.FullName AS user_name,
    u.Role AS user_role,
    u.Department AS user_department,
    u.PhoneNumber AS user_phone,
    a.Id AS advisor_id,
    a.Email AS advisor_email,
    a.FullName AS advisor_name,
    a.Role AS advisor_role,
    a.Department AS advisor_department
  FROM Trainees t
  INNER JOIN Users u ON u.Id = t.UserId
  LEFT JOIN Users a ON a.Id = t.AdvisorId
`;

const mapTrainee = (row) => {
  if (!row) {
    return null;
  }

  const user = row.user_id
    ? {
        id: row.user_id,
        email: row.user_email,
        name: row.user_name,
        role: typeof row.user_role === 'string' ? row.user_role.toLowerCase() : 'trainee',
        department: row.user_department,
        phoneNumber: row.user_phone,
      }
    : null;

  const advisor = row.advisor_id
    ? {
        id: row.advisor_id,
        email: row.advisor_email,
        name: row.advisor_name,
        role: typeof row.advisor_role === 'string' ? row.advisor_role.toLowerCase() : 'advisor',
        department: row.advisor_department,
      }
    : null;

  return {
    id: row.id,
    userId: row.userId,
    employeeId: row.employeeId,
    startDate: row.startDate,
    endDate: row.endDate,
    trainingType: row.trainingType,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    advisorId: row.advisorId,
    createdAt: row.createdAt,
    user,
    advisor,
  };
};

const getTrainees = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`${baseSelect} ORDER BY t.Id`);
  return result.recordset.map(mapTrainee);
};

const getTraineeById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`${baseSelect} WHERE t.Id = @Id`);

  return mapTrainee(result.recordset[0]);
};

const getTraineeByUserId = async (userId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`${baseSelect} WHERE t.UserId = @UserId`);

  return mapTrainee(result.recordset[0]);
};

const createTrainee = async ({
  userId,
  employeeId,
  startDate,
  endDate,
  trainingType,
  advisorId,
}) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .input('EmployeeId', sql.NVarChar, employeeId)
    .input('StartDate', sql.Date, startDate)
    .input('EndDate', sql.Date, endDate)
    .input('TrainingType', sql.NVarChar, trainingType ?? null)
    .input('AdvisorId', sql.Int, advisorId ?? null)
    .query(`
      INSERT INTO Trainees (UserId, EmployeeId, StartDate, EndDate, TrainingType, AdvisorId)
      OUTPUT INSERTED.Id
      VALUES (@UserId, @EmployeeId, @StartDate, @EndDate, @TrainingType, @AdvisorId)
    `);

  return getTraineeById(result.recordset[0].Id);
};

const updateTrainee = async (id, fields) => {
  const pool = await getPool();
  const updates = [];
  const request = pool.request().input('Id', sql.Int, id);

  if (fields.employeeId) {
    updates.push('EmployeeId = @EmployeeId');
    request.input('EmployeeId', sql.NVarChar, fields.employeeId);
  }

  if (fields.startDate) {
    updates.push('StartDate = @StartDate');
    request.input('StartDate', sql.Date, fields.startDate);
  }

  if (fields.endDate) {
    updates.push('EndDate = @EndDate');
    request.input('EndDate', sql.Date, fields.endDate);
  }

  if (fields.trainingType !== undefined) {
    updates.push('TrainingType = @TrainingType');
    request.input('TrainingType', sql.NVarChar, fields.trainingType ?? null);
  }

  if (fields.status) {
    updates.push('Status = @Status');
    request.input('Status', sql.NVarChar, fields.status);
  }

  if (fields.advisorId !== undefined) {
    updates.push('AdvisorId = @AdvisorId');
    request.input('AdvisorId', sql.Int, fields.advisorId ?? null);
  }

  if (!updates.length) {
    return getTraineeById(id);
  }

  await request.query(`
    UPDATE Trainees
    SET ${updates.join(', ')}
    WHERE Id = @Id
  `);

  return getTraineeById(id);
};

const deleteTrainee = async (id) => {
  const pool = await getPool();
  await pool.request().input('Id', sql.Int, id).query('DELETE FROM Trainees WHERE Id = @Id');
};

module.exports = {
  getTrainees,
  getTraineeById,
  getTraineeByUserId,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  mapTrainee,
};
