const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getPlanByTraineeId,
  createPlan,
  updatePlan,
  updateMilestone,
} = require('../services/traineePlans');
const { getTraineeById } = require('../services/trainees');

const router = express.Router();

router.get('/:traineeId', authenticateToken, async (req, res) => {
  try {
    const traineeId = parseInt(req.params.traineeId, 10);
    const plan = await getPlanByTraineeId(traineeId);

    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    if (req.user.role === 'trainee' && req.user.traineeId !== traineeId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Get training plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const traineeId = req.body.traineeId;
    const title = req.body.title;
    const description = req.body.description;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    if (!traineeId || !title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Trainee, title, start date and end date are required' });
    }

    const trainee = await getTraineeById(Number(traineeId));

    if (!trainee) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    const existing = await getPlanByTraineeId(Number(traineeId));

    if (existing) {
      return res.status(400).json({ message: 'Training plan already exists for this trainee' });
    }

    const normalizedStatus =
      typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined;

    const plan = await createPlan({
      traineeId: Number(traineeId),
      title,
      description,
      startDate,
      endDate,
      status: normalizedStatus,
      milestones: req.body.milestones,
      goals: req.body.goals,
    });

    res.status(201).json({
      success: true,
      message: 'Training plan created successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Create training plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:planId', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const planId = parseInt(req.params.planId, 10);
    const normalizedStatus =
      typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined;

    const updated = await updatePlan(planId, {
      title: req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: normalizedStatus,
      milestones: req.body.milestones,
      goals: req.body.goals,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    res.json({
      success: true,
      message: 'Training plan updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update training plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:planId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const planId = parseInt(req.params.planId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);

    const milestoneStatus =
      typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined;

    const plan = await updateMilestone(planId, milestoneId, {
      status: milestoneStatus,
      notes: req.body.notes,
      completedDate: req.body.completedDate,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Training plan not found' });
    }

    if (req.user.role === 'trainee' && req.user.traineeId !== plan.traineeId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const milestone = plan.milestones.find((m) => m.id === milestoneId);

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: milestone,
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
