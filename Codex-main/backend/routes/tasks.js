const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getTasks,
  getTasksByTrainee,
  getTaskById,
  createTask,
  updateTask,
  updateProgress,
  deleteTask,
} = require('../services/tasks');
const { getTraineeById, getTraineeByUserId } = require('../services/trainees');
const {
  createHelpRequest,
  getHelpRequestStats,
} = require('../services/helpRequests');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    let data;

    if (req.user.role === 'trainee') {
      const traineeRecord = req.user.traineeId
        ? await getTraineeById(req.user.traineeId)
        : await getTraineeByUserId(req.user.id);

      data = traineeRecord ? await getTasksByTrainee(traineeRecord.id) : [];
    } else {
      data = await getTasks();
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const traineeId = Number(req.body.traineeId);
    const dueDate = req.body.dueDate;
    const priority =
      typeof req.body.priority === 'string' ? req.body.priority.toLowerCase() : 'medium';

    if (!title || !traineeId || !dueDate) {
      return res.status(400).json({ message: 'Title, trainee and due date are required' });
    }

    const traineeRecord = await getTraineeById(traineeId);

    if (!traineeRecord) {
      return res.status(404).json({ message: 'Trainee not found' });
    }

    const task = await createTask({ title, description, traineeId, dueDate, priority });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const existing = await getTaskById(taskId);

    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updated = await updateTask(taskId, {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      status: typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined,
      priority:
        typeof req.body.priority === 'string' ? req.body.priority.toLowerCase() : undefined,
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const existing = await getTaskById(taskId);

    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await deleteTask(taskId);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const progress = Number(req.body.progress);
    const notes = req.body.notes;

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }

    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'trainee' && req.user.traineeId !== task.trainee?.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updated = await updateProgress(taskId, progress, notes);

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/help-request', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await getTaskById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const traineeRecord = await getTraineeById(task.traineeId);

    if (!traineeRecord) {
      return res.status(404).json({ message: 'Trainee record missing' });
    }

    if (req.user.role === 'trainee' && req.user.traineeId !== traineeRecord.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const newRequest = await createHelpRequest({
      taskId,
      traineeId: traineeRecord.id,
      message,
      urgency:
        typeof req.body.urgency === 'string' ? req.body.urgency.toLowerCase() : 'medium',
      chatSessionId: req.body.chatSessionId || null,
    });

    res.status(201).json({
      success: true,
      message: 'Help request created successfully',
      data: newRequest,
    });
  } catch (error) {
    console.error('Create help request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/stats/overview', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const stats = await getHelpRequestStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Help request stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
