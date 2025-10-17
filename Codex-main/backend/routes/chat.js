const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getAdvisorSessionsForUser,
  getDirectSessionsForUser,
  getAvailableChatUsers,
  getAdvisors,
  getOrCreateAdvisorSession,
} = require('../services/chat');

const router = express.Router();

router.get('/available-users', authenticateToken, async (req, res) => {
  try {
    const users = await getAvailableChatUsers(req.user);

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.Id,
        email: user.Email,
        name: user.FullName,
        role: user.Role,
        department: user.Department,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error('Available users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/advisors', authenticateToken, async (req, res) => {
  try {
    const advisors = await getAdvisors();

    res.json({
      success: true,
      data: advisors.map((advisor) => ({
        id: advisor.Id,
        email: advisor.Email,
        name: advisor.FullName,
        role: advisor.Role,
        department: advisor.Department,
      })),
    });
  } catch (error) {
    console.error('Advisors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const advisorSessions = await getAdvisorSessionsForUser(req.user);
    const directSessions = await getDirectSessionsForUser(req.user.id);

    res.json({
      success: true,
      data: [...advisorSessions, ...directSessions],
    });
  } catch (error) {
    console.error('Chat sessions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/direct-sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await getDirectSessionsForUser(req.user.id);

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Direct sessions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/session/:advisorId', authenticateToken, async (req, res) => {
  try {
    const advisorId = parseInt(req.params.advisorId, 10);

    if (!Number.isFinite(advisorId)) {
      return res.status(400).json({ message: 'Advisor ID is required' });
    }

    let traineeRecord = req.user.role === 'trainee' ? { id: req.user.traineeId } : null;

    if (!traineeRecord) {
      const traineeId = req.query.traineeId ? Number(req.query.traineeId) : null;

      if (!traineeId) {
        return res.status(400).json({ message: 'Trainee information is required to start a session' });
      }

      traineeRecord = { id: traineeId };
    }

    const sessionId = await getOrCreateAdvisorSession(traineeRecord.id, advisorId);
    const sessions = await getAdvisorSessionsForUser({
      ...req.user,
      traineeId: traineeRecord.id,
    });

    const session =
      sessions.find((candidate) => candidate.id === sessionId) ||
      sessions.find(
        (candidate) => candidate.traineeId === traineeRecord.id && candidate.advisorId === advisorId
      );

    const sessionData = session
      ? session
      : {
          id: sessionId,
          traineeId: traineeRecord.id,
          advisorId,
          status: 'active',
          messages: [],
          messagesCount: 0,
          unreadCount: 0,
        };

    res.json({ success: true, data: sessionData });
  } catch (error) {
    console.error('Advisor session error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
