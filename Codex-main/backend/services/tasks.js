const { getPool, sql } = require('../config/database');

const baseSelect = `
  SELECT
    ta.Id AS id,
    ta.Title AS title,
    ta.Description AS description,
    ta.TraineeId AS traineeId,
    ta.DueDate AS dueDate,
    ta.Status AS status,
    ta.Priority AS priority,
    ta.CreatedAt AS createdAt,
    ta.UpdatedAt AS updatedAt,
    ta.Progress AS progress,
    ta.LastProgressNote AS lastProgressNote,
    tr.Id AS trainee_id,
    tr.EmployeeId AS trainee_employeeId,
    tr.Status AS trainee_status,
    tr.StartDate AS trainee_startDate,
    tr.EndDate AS trainee_endDate,
    u.Id AS trainee_user_id,
    u.Email AS trainee_user_email,
    u.FullName AS trainee_user_name,
    u.Role AS trainee_user_role
  FROM Tasks ta
  INNER JOIN Trainees tr ON tr.Id = ta.TraineeId
  INNER JOIN Users u ON u.Id = tr.UserId
`;

const mapTask = (row) => {
  if (!row) {
    return null;
  }

  const traineeUser = row.trainee_user_id
    ? {
        id: row.trainee_user_id,
        email: row.trainee_user_email,
        name: row.trainee_user_name,
        role:
          typeof row.trainee_user_role === 'string'
            ? row.trainee_user_role.toLowerCase()
            : 'trainee',
      }
    : null;

  const trainee = row.trainee_id
    ? {
        id: row.trainee_id,
        employeeId: row.trainee_employeeId,
        status: row.trainee_status,
        startDate: row.trainee_startDate,
        endDate: row.trainee_endDate,
        user: traineeUser,
      }
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    traineeId: row.traineeId,
    dueDate: row.dueDate,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    priority: typeof row.priority === 'string' ? row.priority.toLowerCase() : row.priority,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    progress: row.progress ?? 0,
    lastProgressNote: row.lastProgressNote ?? null,
    trainee,
  };
};

const getTasks = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`${baseSelect} ORDER BY ta.Id`);
  return result.recordset.map(mapTask);
};

const getTasksByTrainee = async (traineeId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .query(`${baseSelect} WHERE ta.TraineeId = @TraineeId ORDER BY ta.Id`);

  return result.recordset.map(mapTask);
};

const getTaskById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`${baseSelect} WHERE ta.Id = @Id`);

  return mapTask(result.recordset[0]);
};

const createTask = async ({ title, description, traineeId, dueDate, priority }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Title', sql.NVarChar, title)
    .input('Description', sql.NVarChar, description ?? '')
    .input('TraineeId', sql.Int, traineeId)
    .input('DueDate', sql.Date, dueDate)
    .input('Priority', sql.NVarChar, priority ?? 'medium')
    .query(`
      INSERT INTO Tasks (Title, Description, TraineeId, DueDate, Priority)
      OUTPUT INSERTED.Id
      VALUES (@Title, @Description, @TraineeId, @DueDate, @Priority)
    `);

  return getTaskById(result.recordset[0].Id);
};

const updateTask = async (id, fields) => {
  const pool = await getPool();
  const updates = [];
  const request = pool.request().input('Id', sql.Int, id);

  if (fields.title) {
    updates.push('Title = @Title');
    request.input('Title', sql.NVarChar, fields.title);
  }

  if (fields.description !== undefined) {
    updates.push('Description = @Description');
    request.input('Description', sql.NVarChar, fields.description ?? '');
  }

  if (fields.dueDate) {
    updates.push('DueDate = @DueDate');
    request.input('DueDate', sql.Date, fields.dueDate);
  }

  if (fields.status) {
    updates.push('Status = @Status');
    request.input('Status', sql.NVarChar, fields.status);
  }

  if (fields.priority) {
    updates.push('Priority = @Priority');
    request.input('Priority', sql.NVarChar, fields.priority);
  }

  if (!updates.length) {
    return getTaskById(id);
  }

  updates.push('UpdatedAt = SYSUTCDATETIME()');

  await request.query(`
    UPDATE Tasks
    SET ${updates.join(', ')}
    WHERE Id = @Id
  `);

  return getTaskById(id);
};

const updateProgress = async (id, progress, notes) => {
  const pool = await getPool();
  await pool
    .request()
    .input('Id', sql.Int, id)
    .input('Progress', sql.Int, progress)
    .input('Status', sql.NVarChar, progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending')
    .input('Notes', sql.NVarChar, notes ?? null)
    .query(`
      UPDATE Tasks
      SET Progress = @Progress,
          Status = @Status,
          LastProgressNote = @Notes,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @Id
    `);

  return getTaskById(id);
};

const deleteTask = async (id) => {
  const pool = await getPool();
  await pool.request().input('Id', sql.Int, id).query('DELETE FROM Tasks WHERE Id = @Id');
};

module.exports = {
  getTasks,
  getTasksByTrainee,
  getTaskById,
  createTask,
  updateTask,
  updateProgress,
  deleteTask,
  mapTask,
};
