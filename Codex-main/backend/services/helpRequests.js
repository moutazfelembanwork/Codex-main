const { getPool, sql } = require('../config/database');
const { mapTask } = require('./tasks');
const { mapTrainee } = require('./trainees');

const baseSelect = `
  SELECT
    hr.Id AS id,
    hr.TaskId AS taskId,
    hr.TraineeId AS traineeId,
    hr.Message AS message,
    hr.Status AS status,
    hr.Urgency AS urgency,
    hr.CreatedAt AS createdAt,
    hr.ResolvedAt AS resolvedAt,
    hr.ResolvedBy AS resolvedBy,
    hr.ResponseMessage AS responseMessage,
    hr.ChatSessionId AS chatSessionId,
    t.Id AS task_id,
    t.Title AS task_title,
    t.Description AS task_description,
    t.TraineeId AS task_traineeId,
    t.DueDate AS task_dueDate,
    t.Status AS task_status,
    t.Priority AS task_priority,
    t.CreatedAt AS task_createdAt,
    t.UpdatedAt AS task_updatedAt,
    t.Progress AS task_progress,
    t.LastProgressNote AS task_lastProgressNote,
    tr.Id AS trainee_id,
    tr.UserId AS trainee_userId,
    tr.EmployeeId AS trainee_employeeId,
    tr.StartDate AS trainee_startDate,
    tr.EndDate AS trainee_endDate,
    tr.TrainingType AS trainee_trainingType,
    tr.Status AS trainee_status,
    tr.AdvisorId AS trainee_advisorId,
    tr.CreatedAt AS trainee_createdAt,
    tu.Id AS trainee_user_id,
    tu.Email AS trainee_user_email,
    tu.FullName AS trainee_user_name,
    tu.Role AS trainee_user_role,
    tu.Department AS trainee_user_department,
    tu.PhoneNumber AS trainee_user_phone,
    adv.Id AS advisor_id,
    adv.Email AS advisor_email,
    adv.FullName AS advisor_name,
    adv.Role AS advisor_role,
    adv.Department AS advisor_department,
    u.Id AS resolved_by_id,
    u.Email AS resolved_by_email,
    u.FullName AS resolved_by_name,
    u.Role AS resolved_by_role
  FROM HelpRequests hr
  LEFT JOIN Tasks t ON t.Id = hr.TaskId
  LEFT JOIN Trainees tr ON tr.Id = hr.TraineeId
  LEFT JOIN Users tu ON tu.Id = tr.UserId
  LEFT JOIN Users adv ON adv.Id = tr.AdvisorId
  LEFT JOIN Users u ON u.Id = hr.ResolvedBy
`;

const mapHelpRequest = (row) => {
  if (!row) {
    return null;
  }

  const task = row.task_id
    ? mapTask({
        id: row.task_id,
        title: row.task_title,
        description: row.task_description,
        traineeId: row.task_traineeId,
        dueDate: row.task_dueDate,
        status: row.task_status,
        priority: row.task_priority,
        createdAt: row.task_createdAt,
        updatedAt: row.task_updatedAt,
        progress: row.task_progress,
        lastProgressNote: row.task_lastProgressNote,
        trainee_id: row.trainee_id,
        trainee_employeeId: row.trainee_employeeId,
        trainee_status: row.trainee_status,
        trainee_startDate: row.trainee_startDate,
        trainee_endDate: row.trainee_endDate,
        trainee_user_id: row.trainee_user_id,
        trainee_user_email: row.trainee_user_email,
        trainee_user_name: row.trainee_user_name,
        trainee_user_role: row.trainee_user_role,
      })
    : null;

  const trainee = row.trainee_id
    ? mapTrainee({
        id: row.trainee_id,
        userId: row.trainee_userId,
        employeeId: row.trainee_employeeId,
        startDate: row.trainee_startDate,
        endDate: row.trainee_endDate,
        trainingType: row.trainee_trainingType,
        status: row.trainee_status,
        advisorId: row.trainee_advisorId,
        createdAt: row.trainee_createdAt,
        user_id: row.trainee_user_id,
        user_email: row.trainee_user_email,
        user_name: row.trainee_user_name,
        user_role: row.trainee_user_role,
        user_department: row.trainee_user_department,
        user_phone: row.trainee_user_phone,
        advisor_id: row.advisor_id,
        advisor_email: row.advisor_email,
        advisor_name: row.advisor_name,
        advisor_role: row.advisor_role,
        advisor_department: row.advisor_department,
      })
    : null;

  const resolvedByUser = row.resolved_by_id
    ? {
        id: row.resolved_by_id,
        email: row.resolved_by_email,
        name: row.resolved_by_name,
        role:
          typeof row.resolved_by_role === 'string'
            ? row.resolved_by_role.toLowerCase()
            : 'advisor',
      }
    : null;

  return {
    id: row.id,
    taskId: row.taskId,
    traineeId: row.traineeId,
    message: row.message,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    urgency: typeof row.urgency === 'string' ? row.urgency.toLowerCase() : row.urgency,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    resolvedBy: row.resolvedBy,
    responseMessage: row.responseMessage,
    chatSessionId: row.chatSessionId,
    task,
    trainee,
    resolvedByUser,
  };
};

const getHelpRequestById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`${baseSelect} WHERE hr.Id = @Id`);

  return mapHelpRequest(result.recordset[0]);
};

const getHelpRequests = async (filters = {}) => {
  const pool = await getPool();
  const request = pool.request();
  const clauses = [];

  if (filters.taskId) {
    clauses.push('hr.TaskId = @TaskId');
    request.input('TaskId', sql.Int, filters.taskId);
  }

  if (filters.traineeId) {
    clauses.push('hr.TraineeId = @TraineeId');
    request.input('TraineeId', sql.Int, filters.traineeId);
  }

  if (filters.id) {
    clauses.push('hr.Id = @Id');
    request.input('Id', sql.Int, filters.id);
  }

  const query = `${baseSelect}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY hr.Id`;
  const result = await request.query(query);
  return result.recordset.map(mapHelpRequest);
};

const createHelpRequest = async ({
  taskId,
  traineeId,
  message,
  urgency,
  chatSessionId,
}) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TaskId', sql.Int, taskId ?? null)
    .input('TraineeId', sql.Int, traineeId)
    .input('Message', sql.NVarChar, message)
    .input('Urgency', sql.NVarChar, urgency ?? 'medium')
    .input('ChatSessionId', sql.Int, chatSessionId ?? null)
    .query(`
      INSERT INTO HelpRequests (TaskId, TraineeId, Message, Urgency, ChatSessionId)
      OUTPUT INSERTED.Id
      VALUES (@TaskId, @TraineeId, @Message, @Urgency, @ChatSessionId)
    `);

  return getHelpRequestById(result.recordset[0].Id);
};

const resolveHelpRequest = async (id, { resolvedBy, responseMessage }) => {
  const pool = await getPool();
  await pool
    .request()
    .input('Id', sql.Int, id)
    .input('ResolvedBy', sql.Int, resolvedBy)
    .input('ResponseMessage', sql.NVarChar, responseMessage ?? null)
    .query(`
      UPDATE HelpRequests
      SET Status = 'resolved',
          ResolvedAt = SYSUTCDATETIME(),
          ResolvedBy = @ResolvedBy,
          ResponseMessage = @ResponseMessage
      WHERE Id = @Id
    `);

  return getHelpRequestById(id);
};

const deleteHelpRequest = async (id) => {
  const pool = await getPool();
  await pool.request().input('Id', sql.Int, id).query('DELETE FROM HelpRequests WHERE Id = @Id');
};

const getHelpRequestStats = async () => {
  const pool = await getPool();
  const totalQuery = 'SELECT COUNT(*) AS total FROM HelpRequests';
  const pendingQuery = "SELECT COUNT(*) AS pending FROM HelpRequests WHERE Status = 'pending'";
  const resolvedQuery = "SELECT COUNT(*) AS resolved FROM HelpRequests WHERE Status = 'resolved'";
  const highPriorityQuery = "SELECT COUNT(*) AS highPriority FROM HelpRequests WHERE Urgency = 'high'";

  const [total, pending, resolved, highPriority] = await Promise.all([
    pool.request().query(totalQuery),
    pool.request().query(pendingQuery),
    pool.request().query(resolvedQuery),
    pool.request().query(highPriorityQuery),
  ]);

  return {
    total: total.recordset[0]?.total ?? 0,
    pending: pending.recordset[0]?.pending ?? 0,
    resolved: resolved.recordset[0]?.resolved ?? 0,
    highPriority: highPriority.recordset[0]?.highPriority ?? 0,
  };
};

module.exports = {
  getHelpRequests,
  createHelpRequest,
  getHelpRequestById,
  resolveHelpRequest,
  deleteHelpRequest,
  getHelpRequestStats,
  mapHelpRequest,
};
