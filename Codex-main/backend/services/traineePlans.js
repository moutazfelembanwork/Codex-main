const { getPool, sql } = require('../config/database');
const { mapTrainee } = require('./trainees');

const mapMilestone = (row) => ({
  id: row.id,
  planId: row.planId,
  title: row.title,
  description: row.description,
  dueDate: row.dueDate,
  status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
  order: row.displayOrder,
  completedDate: row.completedDate,
  notes: row.notes,
});

const mapGoal = (row) => ({
  id: row.id,
  planId: row.planId,
  title: row.title,
  description: row.description,
  targetDate: row.targetDate,
  status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
  progress: row.progress,
});

const mapPlan = (planRow, traineeRow) => {
  if (!planRow) {
    return null;
  }

  return {
    id: planRow.id,
    traineeId: planRow.traineeId,
    title: planRow.title,
    description: planRow.description,
    startDate: planRow.startDate,
    endDate: planRow.endDate,
    status: typeof planRow.status === 'string' ? planRow.status.toLowerCase() : planRow.status,
    createdAt: planRow.createdAt,
    updatedAt: planRow.updatedAt,
    trainee: traineeRow ? mapTrainee(traineeRow) : null,
    advisor: traineeRow?.advisor || null,
  };
};

const getPlanRecord = async (planId) => {
  const pool = await getPool();
  const planResult = await pool
    .request()
    .input('PlanId', sql.Int, planId)
    .query(`
      SELECT tp.*, tr.*, u.Id AS user_id, u.Email AS user_email, u.FullName AS user_name, u.Role AS user_role,
             u.Department AS user_department, u.PhoneNumber AS user_phone,
             adv.Id AS advisor_id, adv.Email AS advisor_email, adv.FullName AS advisor_name,
             adv.Role AS advisor_role, adv.Department AS advisor_department
      FROM TraineePlans tp
      INNER JOIN Trainees tr ON tr.Id = tp.TraineeId
      INNER JOIN Users u ON u.Id = tr.UserId
      LEFT JOIN Users adv ON adv.Id = tr.AdvisorId
      WHERE tp.Id = @PlanId
    `);

  if (planResult.recordset.length === 0) {
    return null;
  }

  const milestonesResult = await pool
    .request()
    .input('PlanId', sql.Int, planId)
    .query('SELECT * FROM PlanMilestones WHERE PlanId = @PlanId ORDER BY DisplayOrder');
  const goalsResult = await pool
    .request()
    .input('PlanId', sql.Int, planId)
    .query('SELECT * FROM PlanGoals WHERE PlanId = @PlanId ORDER BY Id');

  const planRow = planResult.recordset[0];
  const plan = mapPlan(planRow, planRow);
  plan.milestones = milestonesResult.recordset.map(mapMilestone);
  plan.goals = goalsResult.recordset.map(mapGoal);

  return plan;
};

const getPlanByTraineeId = async (traineeId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .query('SELECT Id FROM TraineePlans WHERE TraineeId = @TraineeId');

  if (result.recordset.length === 0) {
    return null;
  }

  return getPlanRecord(result.recordset[0].Id);
};

const createPlan = async ({ traineeId, title, description, startDate, endDate, status, milestones, goals }) => {
  const pool = await getPool();
  const planResult = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .input('Title', sql.NVarChar, title)
    .input('Description', sql.NVarChar, description ?? '')
    .input('StartDate', sql.Date, startDate)
    .input('EndDate', sql.Date, endDate)
    .input('Status', sql.NVarChar, status ?? 'active')
    .query(`
      INSERT INTO TraineePlans (TraineeId, Title, Description, StartDate, EndDate, Status)
      OUTPUT INSERTED.Id
      VALUES (@TraineeId, @Title, @Description, @StartDate, @EndDate, @Status)
    `);

  const planId = planResult.recordset[0].Id;

  if (Array.isArray(milestones)) {
    for (let index = 0; index < milestones.length; index += 1) {
      const milestone = milestones[index];
      await pool
        .request()
        .input('PlanId', sql.Int, planId)
        .input('Title', sql.NVarChar, milestone.title)
        .input('Description', sql.NVarChar, milestone.description ?? '')
        .input('DueDate', sql.Date, milestone.dueDate)
        .input('Status', sql.NVarChar, milestone.status ?? 'pending')
        .input('DisplayOrder', sql.Int, milestone.order ?? index + 1)
        .input('CompletedDate', sql.DateTime2, milestone.completedDate ?? null)
        .input('Notes', sql.NVarChar, milestone.notes ?? null)
        .query(`
          INSERT INTO PlanMilestones (PlanId, Title, Description, DueDate, Status, DisplayOrder, CompletedDate, Notes)
          VALUES (@PlanId, @Title, @Description, @DueDate, @Status, @DisplayOrder, @CompletedDate, @Notes)
        `);
    }
  }

  if (Array.isArray(goals)) {
    for (const goal of goals) {
      await pool
        .request()
        .input('PlanId', sql.Int, planId)
        .input('Title', sql.NVarChar, goal.title)
        .input('Description', sql.NVarChar, goal.description ?? '')
        .input('TargetDate', sql.Date, goal.targetDate)
        .input('Status', sql.NVarChar, goal.status ?? 'on-track')
        .input('Progress', sql.Int, goal.progress ?? 0)
        .query(`
          INSERT INTO PlanGoals (PlanId, Title, Description, TargetDate, Status, Progress)
          VALUES (@PlanId, @Title, @Description, @TargetDate, @Status, @Progress)
        `);
    }
  }

  return getPlanRecord(planId);
};

const updatePlan = async (planId, fields) => {
  const pool = await getPool();
  const updates = [];
  const request = pool.request().input('PlanId', sql.Int, planId);

  if (fields.title) {
    updates.push('Title = @Title');
    request.input('Title', sql.NVarChar, fields.title);
  }

  if (fields.description !== undefined) {
    updates.push('Description = @Description');
    request.input('Description', sql.NVarChar, fields.description ?? '');
  }

  if (fields.startDate) {
    updates.push('StartDate = @StartDate');
    request.input('StartDate', sql.Date, fields.startDate);
  }

  if (fields.endDate) {
    updates.push('EndDate = @EndDate');
    request.input('EndDate', sql.Date, fields.endDate);
  }

  if (fields.status) {
    updates.push('Status = @Status');
    request.input('Status', sql.NVarChar, fields.status);
  }

  if (updates.length) {
    updates.push('UpdatedAt = SYSUTCDATETIME()');
    await request.query(`
      UPDATE TraineePlans
      SET ${updates.join(', ')}
      WHERE Id = @PlanId
    `);
  }

  if (Array.isArray(fields.milestones)) {
    await pool.request().input('PlanId', sql.Int, planId).query('DELETE FROM PlanMilestones WHERE PlanId = @PlanId');
    for (let index = 0; index < fields.milestones.length; index += 1) {
      const milestone = fields.milestones[index];
      await pool
        .request()
        .input('PlanId', sql.Int, planId)
        .input('Title', sql.NVarChar, milestone.title)
        .input('Description', sql.NVarChar, milestone.description ?? '')
        .input('DueDate', sql.Date, milestone.dueDate)
        .input('Status', sql.NVarChar, milestone.status ?? 'pending')
        .input('DisplayOrder', sql.Int, milestone.order ?? index + 1)
        .input('CompletedDate', sql.DateTime2, milestone.completedDate ?? null)
        .input('Notes', sql.NVarChar, milestone.notes ?? null)
        .query(`
          INSERT INTO PlanMilestones (PlanId, Title, Description, DueDate, Status, DisplayOrder, CompletedDate, Notes)
          VALUES (@PlanId, @Title, @Description, @DueDate, @Status, @DisplayOrder, @CompletedDate, @Notes)
        `);
    }
  }

  if (Array.isArray(fields.goals)) {
    await pool.request().input('PlanId', sql.Int, planId).query('DELETE FROM PlanGoals WHERE PlanId = @PlanId');
    for (const goal of fields.goals) {
      await pool
        .request()
        .input('PlanId', sql.Int, planId)
        .input('Title', sql.NVarChar, goal.title)
        .input('Description', sql.NVarChar, goal.description ?? '')
        .input('TargetDate', sql.Date, goal.targetDate)
        .input('Status', sql.NVarChar, goal.status ?? 'on-track')
        .input('Progress', sql.Int, goal.progress ?? 0)
        .query(`
          INSERT INTO PlanGoals (PlanId, Title, Description, TargetDate, Status, Progress)
          VALUES (@PlanId, @Title, @Description, @TargetDate, @Status, @Progress)
        `);
    }
  }

  return getPlanRecord(planId);
};

const updateMilestone = async (planId, milestoneId, fields) => {
  const pool = await getPool();
  const request = pool
    .request()
    .input('PlanId', sql.Int, planId)
    .input('MilestoneId', sql.Int, milestoneId);

  const updates = [];

  if (fields.status) {
    updates.push('Status = @Status');
    request.input('Status', sql.NVarChar, fields.status);
  }

  if (fields.notes !== undefined) {
    updates.push('Notes = @Notes');
    request.input('Notes', sql.NVarChar, fields.notes ?? null);
  }

  if (fields.completedDate) {
    updates.push('CompletedDate = @CompletedDate');
    request.input('CompletedDate', sql.DateTime2, fields.completedDate);
  }

  if (updates.length === 0) {
    return getPlanRecord(planId);
  }

  updates.push('UpdatedAt = SYSUTCDATETIME()');

  await request.query(`
    UPDATE PlanMilestones
    SET ${updates.join(', ')}
    WHERE PlanId = @PlanId AND Id = @MilestoneId
  `);

  return getPlanRecord(planId);
};

module.exports = {
  getPlanByTraineeId,
  createPlan,
  updatePlan,
  updateMilestone,
};
