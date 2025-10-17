const { getPool, sql } = require('../config/database');

const parseReadBy = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const mapMessage = (row) => ({
  id: row.id,
  sessionId: row.sessionId,
  sessionType: row.sessionType,
  senderId: row.senderId,
  receiverId: row.receiverId,
  message: row.message,
  timestamp: row.timestamp,
  readBy: parseReadBy(row.readBy),
  messageType: row.messageType,
});

const mapAdvisorSession = (row, messages) => {
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

  const advisor = row.advisor_id
    ? {
        id: row.advisor_id,
        email: row.advisor_email,
        name: row.advisor_name,
        role: typeof row.advisor_role === 'string' ? row.advisor_role.toLowerCase() : 'advisor',
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

  const lastMessage = messages.length ? messages[messages.length - 1] : null;

  return {
    id: row.id,
    traineeId: row.traineeId,
    advisorId: row.advisorId,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
    messagesCount: messages.length,
    unreadCount: messages.filter((message) => !message.readBy.includes(row.currentUserId)).length,
    trainee,
    advisor,
    lastMessage,
    otherParticipant: row.currentUserRole === 'advisor' ? traineeUser : advisor,
    messages,
  };
};

const mapDirectSession = (row, messages) => {
  const participant1 = row.participant1_id
    ? {
        id: row.participant1_id,
        email: row.participant1_email,
        name: row.participant1_name,
        role:
          typeof row.participant1_role === 'string'
            ? row.participant1_role.toLowerCase()
            : 'trainee',
      }
    : null;
  const participant2 = row.participant2_id
    ? {
        id: row.participant2_id,
        email: row.participant2_email,
        name: row.participant2_name,
        role:
          typeof row.participant2_role === 'string'
            ? row.participant2_role.toLowerCase()
            : 'trainee',
      }
    : null;

  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const currentUserId = row.currentUserId;

  const otherParticipant = currentUserId === participant1?.id ? participant2 : participant1;

  return {
    id: row.id,
    participant1Id: row.participant1Id,
    participant2Id: row.participant2Id,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    createdAt: row.createdAt,
    lastMessageAt: row.lastMessageAt,
    messagesCount: messages.length,
    unreadCount: messages.filter((message) => !message.readBy.includes(currentUserId)).length,
    participant1,
    participant2,
    otherParticipant,
    lastMessage,
    messages,
  };
};

const getMessagesForSession = async (sessionId, sessionType) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('SessionId', sql.Int, sessionId)
    .input('SessionType', sql.NVarChar, sessionType)
    .query(
      `SELECT Id AS id, SessionId AS sessionId, SessionType AS sessionType, SenderId AS senderId, ReceiverId AS receiverId,
              Message AS message, Timestamp AS timestamp, ReadBy AS readBy, MessageType AS messageType
       FROM ChatMessages
       WHERE SessionId = @SessionId AND SessionType = @SessionType
       ORDER BY Timestamp`
    );

  return result.recordset.map(mapMessage);
};

const getAdvisorSessionsForUser = async (user) => {
  const pool = await getPool();
  const request = pool.request();
  let whereClause = "cs.SessionType = 'advisor'";

  if (user.role === 'trainee' && user.traineeId) {
    request.input('TraineeId', sql.Int, user.traineeId);
    whereClause += ' AND cs.TraineeId = @TraineeId';
  } else if (user.role === 'advisor') {
    request.input('AdvisorId', sql.Int, user.id);
    whereClause += ' AND cs.AdvisorId = @AdvisorId';
  } else if (user.traineeId) {
    request.input('TraineeIdFilter', sql.Int, user.traineeId);
    whereClause += ' AND cs.TraineeId = @TraineeIdFilter';
  }

  const query = `
    SELECT cs.Id AS id,
           cs.TraineeId AS traineeId,
           cs.AdvisorId AS advisorId,
           cs.Status AS status,
           cs.CreatedAt AS createdAt,
           cs.LastMessageAt AS lastMessageAt,
           t.Id AS trainee_id,
           t.EmployeeId AS trainee_employeeId,
           t.Status AS trainee_status,
           t.StartDate AS trainee_startDate,
           t.EndDate AS trainee_endDate,
           u.Id AS trainee_user_id,
           u.Email AS trainee_user_email,
           u.FullName AS trainee_user_name,
           adv.Id AS advisor_id,
           adv.Email AS advisor_email,
           adv.FullName AS advisor_name,
           adv.Role AS advisor_role
    FROM ChatSessions cs
    INNER JOIN Trainees t ON t.Id = cs.TraineeId
    INNER JOIN Users u ON u.Id = t.UserId
    LEFT JOIN Users adv ON adv.Id = cs.AdvisorId
    WHERE ${whereClause}
    ORDER BY cs.LastMessageAt DESC, cs.Id DESC
  `;

  const result = await request.query(query);

  const sessions = [];

  for (const row of result.recordset) {
    const messages = await getMessagesForSession(row.id, 'advisor');
    sessions.push(
      mapAdvisorSession({ ...row, currentUserId: user.id, currentUserRole: user.role }, messages)
    );
  }

  return sessions;
};

const getDirectSessionsForUser = async (userId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT cs.Id AS id,
             cs.Participant1Id AS participant1Id,
             cs.Participant2Id AS participant2Id,
             cs.Status AS status,
             cs.CreatedAt AS createdAt,
             cs.LastMessageAt AS lastMessageAt,
             u1.Id AS participant1_id,
             u1.Email AS participant1_email,
             u1.FullName AS participant1_name,
             u1.Role AS participant1_role,
             u2.Id AS participant2_id,
             u2.Email AS participant2_email,
             u2.FullName AS participant2_name,
             u2.Role AS participant2_role
      FROM ChatSessions cs
      INNER JOIN Users u1 ON u1.Id = cs.Participant1Id
      INNER JOIN Users u2 ON u2.Id = cs.Participant2Id
      WHERE cs.SessionType = 'direct'
        AND (cs.Participant1Id = @UserId OR cs.Participant2Id = @UserId)
      ORDER BY cs.LastMessageAt DESC, cs.Id DESC
    `);

  const sessions = [];

  for (const row of result.recordset) {
    const messages = await getMessagesForSession(row.id, 'direct');
    sessions.push(mapDirectSession({ ...row, currentUserId: userId }, messages));
  }

  return sessions;
};

const getAvailableChatUsers = async (user) => {
  const pool = await getPool();
  if (user.role === 'trainee') {
    const result = await pool
      .request()
      .query("SELECT Id, Email, FullName, Role, Department FROM Users WHERE Role = 'advisor'");

    return result.recordset;
  }

  if (user.role === 'advisor') {
    const request = pool.request().input('AdvisorId', sql.Int, user.id);
    const result = await request.query(`
      SELECT DISTINCT u.Id, u.Email, u.FullName, u.Role, u.Department
      FROM Trainees t
      INNER JOIN Users u ON u.Id = t.UserId
      WHERE t.AdvisorId = @AdvisorId
      UNION
      SELECT Id, Email, FullName, Role, Department
      FROM Users
      WHERE Role <> 'trainee' AND Id <> @AdvisorId
    `);

    return result.recordset;
  }

  const result = await pool
    .request()
    .input('UserId', sql.Int, user.id)
    .query('SELECT Id, Email, FullName, Role, Department FROM Users WHERE Id <> @UserId');

  return result.recordset;
};

const getAdvisors = async () => {
  const pool = await getPool();
  const result = await pool
    .request()
    .query("SELECT Id, Email, FullName, Role, Department FROM Users WHERE Role = 'advisor'");
  return result.recordset;
};

const getOrCreateAdvisorSession = async (traineeId, advisorId) => {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .input('AdvisorId', sql.Int, advisorId)
    .query(`
      SELECT Id FROM ChatSessions
      WHERE SessionType = 'advisor' AND TraineeId = @TraineeId AND AdvisorId = @AdvisorId
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset[0].Id;
  }

  const result = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .input('AdvisorId', sql.Int, advisorId)
    .query(`
      INSERT INTO ChatSessions (SessionType, TraineeId, AdvisorId, Status)
      OUTPUT INSERTED.Id
      VALUES ('advisor', @TraineeId, @AdvisorId, 'active')
    `);

  return result.recordset[0].Id;
};

module.exports = {
  getAdvisorSessionsForUser,
  getDirectSessionsForUser,
  getMessagesForSession,
  getAvailableChatUsers,
  getAdvisors,
  getOrCreateAdvisorSession,
};
