const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getHelpRequests,
  resolveHelpRequest,
  deleteHelpRequest,
  getHelpRequestStats,
} = require('../services/helpRequests');
const { getTraineeByUserId } = require('../services/trainees');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {};

    if (req.query.taskId) {
      filters.taskId = Number(req.query.taskId);
    }

    if (req.user.role === 'trainee') {
      const traineeRecord = req.user.traineeId
        ? { id: req.user.traineeId }
        : await getTraineeByUserId(req.user.id);

      if (!traineeRecord) {
        return res.json({ success: true, data: [] });
      }

      filters.traineeId = traineeRecord.id;
    }

    const data = await getHelpRequests(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch help requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getHelpRequestStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Help request stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id/resolve', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const responseMessage = req.body.responseMessage;

    const resolved = await resolveHelpRequest(requestId, {
      resolvedBy: req.user.id,
      responseMessage,
    });

    if (!resolved) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    res.json({
      success: true,
      message: 'Help request resolved',
      data: resolved,
    });
  } catch (error) {
    console.error('Resolve help request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const existing = await getHelpRequests({ id: requestId });

    if (!existing.length) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    await deleteHelpRequest(requestId);

    res.json({
      success: true,
      message: 'Help request deleted',
    });
  } catch (error) {
    console.error('Delete help request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
