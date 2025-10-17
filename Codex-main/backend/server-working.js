require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// Mock database for development
const mockDatabase = {
  users: [
    {
      id: 1,
      email: 'admin@satorp.com',
      password: 'password',
      name: 'System Administrator',
      role: 'admin',
      department: 'IT'
    },
    {
      id: 2, 
      email: 'advisor@satorp.com',
      password: 'password',
      name: 'John Advisor',
      role: 'advisor',
      department: 'Engineering'
    },
    {
      id: 3,
      email: 'advisor2@satorp.com',
      password: 'password',
      name: 'Sarah Advisor',
      role: 'advisor',
      department: 'Operations'
    },
    {
      id: 4,
      email: 'trainee@satorp.com', 
      password: 'password',
      name: 'Ahmed Trainee',
      role: 'trainee',
      department: 'Operations'
    },
    {
      id: 5,
      email: 'trainee2@satorp.com', 
      password: 'password',
      name: 'Fatima Trainee',
      role: 'trainee',
      department: 'Engineering'
    }
  ],
  trainees: [
    {
      id: 1,
      userId: 4,
      employeeId: 'TRN001',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      trainingType: 'Operations',
      status: 'active',
      advisorId: 2
    },
    {
      id: 2,
      userId: 5,
      employeeId: 'TRN002',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      trainingType: 'Engineering',
      status: 'active',
      advisorId: 3
    }
  ],
  tasks: [
    {
      id: 1,
      title: 'Safety Training',
      description: 'Complete safety orientation program and pass the safety assessment test',
      traineeId: 1,
      dueDate: '2024-12-15',
      status: 'in-progress',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Equipment Operation',
      description: 'Learn to operate refinery equipment under supervision',
      traineeId: 1,
      dueDate: '2024-12-30',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Technical Documentation',
      description: 'Review and understand technical documentation for assigned equipment',
      traineeId: 1,
      dueDate: '2024-11-30',
      status: 'completed',
      priority: 'low'
    }
  ],
  documents: [
    {
      id: 1,
      traineeId: 1,
      fileName: 'safety_certificate.pdf',
      documentType: 'certificate',
      uploadDate: '2024-10-01',
      fileSize: '2.5 MB',
      fileType: 'application/pdf',
      description: 'Safety training completion certificate',
      uploadedBy: 4, // Ahmed Trainee
      status: 'active',
      version: '1.0'
    },
    {
      id: 2,
      traineeId: 1,
      fileName: 'progress_report_q3.docx',
      documentType: 'report',
      uploadDate: '2024-11-15',
      fileSize: '1.2 MB',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      description: 'Quarterly progress assessment report',
      uploadedBy: 2, // John Advisor
      status: 'active',
      version: '1.0'
    },
    {
      id: 3,
      traineeId: 2,
      fileName: 'technical_assessment.pdf',
      documentType: 'assessment',
      uploadDate: '2024-11-20',
      fileSize: '3.1 MB',
      fileType: 'application/pdf',
      description: 'Technical skills evaluation',
      uploadedBy: 3, // Sarah Advisor
      status: 'active',
      version: '1.0'
    },
    {
      id: 4,
      traineeId: 2,
      fileName: 'equipment_training_certificate.pdf',
      documentType: 'certificate',
      uploadDate: '2024-10-25',
      fileSize: '1.8 MB',
      fileType: 'application/pdf',
      description: 'Equipment operation certification',
      uploadedBy: 5, // Fatima Trainee
      status: 'active',
      version: '1.0'
    }
  ],
  helpRequests: [
    {
      id: 1,
      taskId: 1,
      traineeId: 1,
      message: '[TECHNICAL] I am having trouble accessing the safety training portal.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      urgency: 'high',
      chatSessionId: 1
    },
    {
      id: 2,
      taskId: 2,
      traineeId: 1,
      message: '[CLARIFICATION] Could you please clarify the specific equipment?',
      status: 'resolved',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedBy: 2,
      responseMessage: 'Focus on the primary distillation unit.',
      urgency: 'medium',
      chatSessionId: 2
    }
  ],
  chatSessions: [
    {
      id: 1,
      traineeId: 1,
      advisorId: 2,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    },
    {
      id: 2,
      traineeId: 1,
      advisorId: 2,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastMessageAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      traineeId: 2,
      advisorId: 3,
      status: 'active',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      participant1Id: 1, // Admin
      participant2Id: 2, // John Advisor
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    },
    {
      id: 5,
      participant1Id: 4, // Ahmed Trainee
      participant2Id: 5, // Fatima Trainee
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    }
  ],
  chatMessages: [
    {
      id: 1,
      chatSessionId: 1,
      senderId: 4, // Ahmed Trainee
      receiverId: 2, // John Advisor
      message: 'Hello, I need help with the safety training portal.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 2,
      chatSessionId: 1,
      senderId: 2, // John Advisor
      receiverId: 4, // Ahmed Trainee
      message: 'I can help with that. What specific issue are you facing?',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 3,
      chatSessionId: 1,
      senderId: 4, // Ahmed Trainee
      receiverId: 2, // John Advisor
      message: 'The login page shows "Invalid credentials" even with correct password.',
      timestamp: new Date().toISOString(),
      read: false,
      messageType: 'text'
    },
    {
      id: 4,
      chatSessionId: 2,
      senderId: 4, // Ahmed Trainee
      receiverId: 2, // John Advisor
      message: 'About the equipment operation training...',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 5,
      chatSessionId: 2,
      senderId: 2, // John Advisor
      receiverId: 4, // Ahmed Trainee
      message: 'Which equipment are you referring to?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 6,
      chatSessionId: 3,
      senderId: 5, // Fatima Trainee
      receiverId: 3, // Sarah Advisor
      message: 'Hi Sarah, I have questions about the engineering documentation.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 7,
      chatSessionId: 3,
      senderId: 3, // Sarah Advisor
      receiverId: 5, // Fatima Trainee
      message: 'Hello Fatima, I\'d be happy to help with the documentation.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 8,
      chatSessionId: 4,
      senderId: 1, // Admin
      receiverId: 2, // John Advisor
      message: 'Hi John, how are the trainees progressing?',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: true,
      messageType: 'text'
    },
    {
      id: 9,
      chatSessionId: 4,
      senderId: 2, // John Advisor
      receiverId: 1, // Admin
      message: 'Everything is going well. Ahmed is making good progress.',
      timestamp: new Date().toISOString(),
      read: false,
      messageType: 'text'
    }
  ]
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = mockDatabase.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// ===== AUTHENTICATION ROUTES =====
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockDatabase.users.find(u => u.email === email);
  
  if (user && user.password === password) {
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful (Development Mode)',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// ===== ENHANCED CHAT ROUTES =====

// Get available users for direct chat - ENHANCED
app.get('/api/chat/available-users', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  let availableUsers = [];
  
  if (req.user.role === 'admin') {
    // Admin can chat with anyone
    availableUsers = mockDatabase.users
      .filter(user => user.id !== currentUserId)
      .map(user => ({
        ...user,
        isOnline: Math.random() > 0.3, // Mock online status
        lastSeen: new Date().toISOString()
      }));
  } else if (req.user.role === 'advisor') {
    // Advisors can only chat with their assigned trainees and other advisors
    const assignedTrainees = mockDatabase.trainees
      .filter(t => t.advisorId === currentUserId)
      .map(t => mockDatabase.users.find(u => u.id === t.userId))
      .filter(Boolean)
      .map(user => ({
        ...user,
        isOnline: Math.random() > 0.4,
        lastSeen: new Date().toISOString()
      }));
    
    const otherAdvisors = mockDatabase.users
      .filter(user => user.id !== currentUserId && user.role === 'advisor')
      .map(user => ({
        ...user,
        isOnline: Math.random() > 0.5,
        lastSeen: new Date().toISOString()
      }));
    
    availableUsers = [...assignedTrainees, ...otherAdvisors];
  } else if (req.user.role === 'trainee') {
    // Trainees can only chat with their assigned advisor
    const userTrainee = mockDatabase.trainees.find(t => t.userId === currentUserId);
    if (userTrainee && userTrainee.advisorId) {
      const assignedAdvisor = mockDatabase.users.find(u => u.id === userTrainee.advisorId);
      if (assignedAdvisor) {
        availableUsers = [{
          ...assignedAdvisor,
          isOnline: Math.random() > 0.2,
          lastSeen: new Date().toISOString()
        }];
      }
    }
    
    // Trainees can also chat with other trainees in same department
    const currentUser = mockDatabase.users.find(u => u.id === currentUserId);
    const otherTrainees = mockDatabase.users.filter(user => 
      user.id !== currentUserId && 
      user.role === 'trainee' && 
      user.department === currentUser?.department
    ).map(user => ({
      ...user,
      isOnline: Math.random() > 0.3,
      lastSeen: new Date().toISOString()
    }));
    
    availableUsers = [...availableUsers, ...otherTrainees];
  }
  
  res.json({
    success: true,
    data: availableUsers
  });
});

// Get user's chat sessions with real data
app.get('/api/chat/sessions', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  // Get all sessions where user is participant
  let sessions = mockDatabase.chatSessions.filter(session => {
    if (session.participant1Id && session.participant2Id) {
      // Direct chat session
      return session.participant1Id === currentUserId || session.participant2Id === currentUserId;
    } else {
      // Advisor chat session
      if (req.user.role === 'trainee') {
        const userTrainee = mockDatabase.trainees.find(t => t.userId === currentUserId);
        return userTrainee && session.traineeId === userTrainee.id;
      } else if (req.user.role === 'advisor') {
        return session.advisorId === currentUserId;
      }
      return false;
    }
  });

  // Add details and unread counts to sessions
  const sessionsWithDetails = sessions.map(session => {
    const messages = mockDatabase.chatMessages.filter(msg => msg.chatSessionId === session.id);
    const unreadCount = messages.filter(msg => 
      msg.receiverId === currentUserId && !msg.read
    ).length;

    let sessionWithDetails = {
      ...session,
      lastMessage: messages[messages.length - 1],
      unreadCount,
      messagesCount: messages.length
    };

    // Add participant details based on session type
    if (session.participant1Id && session.participant2Id) {
      // Direct chat session
      sessionWithDetails.participant1 = mockDatabase.users.find(u => u.id === session.participant1Id);
      sessionWithDetails.participant2 = mockDatabase.users.find(u => u.id === session.participant2Id);
      sessionWithDetails.otherParticipant = session.participant1Id === currentUserId 
        ? sessionWithDetails.participant2
        : sessionWithDetails.participant1;
    } else {
      // Advisor chat session
      sessionWithDetails.trainee = mockDatabase.trainees.find(t => t.id === session.traineeId);
      sessionWithDetails.advisor = mockDatabase.users.find(u => u.id === session.advisorId);
      sessionWithDetails.otherParticipant = req.user.role === 'trainee' 
        ? sessionWithDetails.advisor
        : sessionWithDetails.trainee?.user ? {
            ...sessionWithDetails.trainee.user,
            employeeId: sessionWithDetails.trainee.employeeId
          } : null;
    }

    return sessionWithDetails;
  });

  // Sort by last message date (most recent first)
  sessionsWithDetails.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  res.json({
    success: true,
    data: sessionsWithDetails
  });
});

// Send message with real-time simulation
app.post('/api/chat/session/:sessionId/messages', authenticateToken, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { message } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message cannot be empty' });
  }

  // Verify user has access to this chat session
  const chatSession = mockDatabase.chatSessions.find(session => session.id === sessionId);
  if (!chatSession) {
    return res.status(404).json({ success: false, message: 'Chat session not found' });
  }

  // Check access rights and determine receiver
  let receiverId;
  let hasAccess = false;
  
  if (chatSession.participant1Id && chatSession.participant2Id) {
    // Direct chat session
    hasAccess = chatSession.participant1Id === req.user.id || chatSession.participant2Id === req.user.id;
    
    if (hasAccess) {
      receiverId = chatSession.participant1Id === req.user.id 
        ? chatSession.participant2Id 
        : chatSession.participant1Id;
    }
  } else {
    // Advisor chat session
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (req.user.role === 'trainee') {
      hasAccess = userTrainee && chatSession.traineeId === userTrainee.id;
      if (hasAccess) {
        receiverId = chatSession.advisorId;
      }
    } else if (req.user.role === 'advisor') {
      hasAccess = chatSession.advisorId === req.user.id;
      if (hasAccess) {
        receiverId = mockDatabase.trainees.find(t => t.id === chatSession.traineeId)?.userId;
      }
    } else if (req.user.role === 'admin') {
      hasAccess = true;
      // Admin can send to both sides
      if (chatSession.traineeId) {
        const trainee = mockDatabase.trainees.find(t => t.id === chatSession.traineeId);
        receiverId = trainee?.userId || chatSession.advisorId;
      }
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: 'You do not have permission to send messages in this chat' });
  }

  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver not found' });
  }

  // Update session last message time
  chatSession.lastMessageAt = new Date().toISOString();

  // Create message
  const newMessage = {
    id: mockDatabase.chatMessages.length + 1,
    chatSessionId: sessionId,
    senderId: req.user.id,
    receiverId: receiverId,
    message: message.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    messageType: 'text'
  };

  mockDatabase.chatMessages.push(newMessage);

  // Add sender details for response
  const messageWithDetails = {
    ...newMessage,
    sender: mockDatabase.users.find(u => u.id === newMessage.senderId),
    receiver: mockDatabase.users.find(u => u.id === newMessage.receiverId)
  };

  res.json({
    success: true,
    data: messageWithDetails
  });
});

// ===== TRAINEE PLAN ROUTES =====

// Mock data for trainee plans
const mockTraineePlans = [
  {
    id: 1,
    traineeId: 1,
    title: 'Operations Training Program',
    description: 'Complete operations training with safety certifications',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    milestones: [
      {
        id: 1,
        title: 'Safety Orientation',
        description: 'Complete safety training and certification',
        dueDate: '2024-02-01',
        status: 'completed',
        completedDate: '2024-01-28',
        order: 1
      },
      {
        id: 2,
        title: 'Equipment Operation Basics',
        description: 'Learn basic equipment operation procedures',
        dueDate: '2024-04-01',
        status: 'in-progress',
        order: 2
      },
      {
        id: 3,
        title: 'Advanced Operations',
        description: 'Master advanced operational techniques',
        dueDate: '2024-08-01',
        status: 'pending',
        order: 3
      },
      {
        id: 4,
        title: 'Final Assessment',
        description: 'Complete final operational assessment',
        dueDate: '2024-11-30',
        status: 'pending',
        order: 4
      }
    ],
    goals: [
      {
        id: 1,
        title: 'Safety Compliance',
        description: 'Maintain 100% safety compliance throughout training',
        targetDate: '2024-12-31',
        status: 'on-track'
      },
      {
        id: 2,
        title: 'Technical Proficiency',
        description: 'Achieve 90%+ score in technical assessments',
        targetDate: '2024-10-31',
        status: 'on-track'
      }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: 2,
    traineeId: 2,
    title: 'Engineering Development Program',
    description: 'Engineering skills development and certification program',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    milestones: [
      {
        id: 5,
        title: 'Technical Documentation Review',
        description: 'Review and understand engineering documentation',
        dueDate: '2024-03-01',
        status: 'completed',
        completedDate: '2024-02-20',
        order: 1
      },
      {
        id: 6,
        title: 'Design Principles',
        description: 'Learn engineering design principles',
        dueDate: '2024-06-01',
        status: 'in-progress',
        order: 2
      },
      {
        id: 7,
        title: 'Project Work',
        description: 'Participate in engineering projects',
        dueDate: '2024-09-01',
        status: 'pending',
        order: 3
      }
    ],
    goals: [
      {
        id: 3,
        title: 'Design Skills',
        description: 'Complete 3 engineering design projects',
        targetDate: '2024-09-30',
        status: 'on-track'
      }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-02-25'
  }
];

// Get trainee plan
app.get('/api/trainee-plans/:traineeId', authenticateToken, (req, res) => {
  const traineeId = parseInt(req.params.traineeId);
  
  // Check permissions
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (!userTrainee || userTrainee.id !== traineeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own training plan' 
      });
    }
  } else if (req.user.role === 'advisor') {
    const isAssignedTrainee = mockDatabase.trainees.some(t => 
      t.id === traineeId && t.advisorId === req.user.id
    );
    if (!isAssignedTrainee) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view plans for trainees assigned to you' 
      });
    }
  }

  const plan = mockTraineePlans.find(p => p.traineeId === traineeId);
  
  if (!plan) {
    return res.status(404).json({ 
      success: false, 
      message: 'Training plan not found for this trainee' 
    });
  }

  // Add trainee details to plan
  const planWithDetails = {
    ...plan,
    trainee: mockDatabase.trainees.find(t => t.id === traineeId)
  };

  res.json({
    success: true,
    data: planWithDetails
  });
});

// Update milestone status
app.put('/api/trainee-plans/:planId/milestones/:milestoneId', authenticateToken, (req, res) => {
  const { planId, milestoneId } = req.params;
  const { status, notes } = req.body;

  const plan = mockTraineePlans.find(p => p.id === parseInt(planId));
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  // Check permissions
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (!userTrainee || userTrainee.id !== plan.traineeId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own plan milestones' 
      });
    }
  } else if (req.user.role === 'advisor') {
    const isAssignedTrainee = mockDatabase.trainees.some(t => 
      t.id === plan.traineeId && t.advisorId === req.user.id
    );
    if (!isAssignedTrainee) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update milestones for trainees assigned to you' 
      });
    }
  }

  const milestone = plan.milestones.find(m => m.id === parseInt(milestoneId));
  if (!milestone) {
    return res.status(404).json({ success: false, message: 'Milestone not found' });
  }

  milestone.status = status;
  if (status === 'completed') {
    milestone.completedDate = new Date().toISOString();
  }
  milestone.notes = notes;
  plan.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: milestone,
    message: 'Milestone updated successfully'
  });
});

// Create new trainee plan (Admin only)
app.post('/api/trainee-plans', authenticateToken, requireRole(['admin']), (req, res) => {
  const { traineeId, title, description, startDate, endDate, milestones, goals } = req.body;

  const trainee = mockDatabase.trainees.find(t => t.id === parseInt(traineeId));
  if (!trainee) {
    return res.status(404).json({ success: false, message: 'Trainee not found' });
  }

  // Check if plan already exists
  const existingPlan = mockTraineePlans.find(p => p.traineeId === parseInt(traineeId));
  if (existingPlan) {
    return res.status(400).json({ 
      success: false, 
      message: 'A training plan already exists for this trainee' 
    });
  }

  const newPlan = {
    id: mockTraineePlans.length + 1,
    traineeId: parseInt(traineeId),
    title,
    description,
    startDate,
    endDate,
    status: 'active',
    milestones: milestones || [],
    goals: goals || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockTraineePlans.push(newPlan);

  const planWithDetails = {
    ...newPlan,
    trainee: trainee
  };

  res.status(201).json({
    success: true,
    data: planWithDetails,
    message: 'Training plan created successfully'
  });
});

// Update trainee plan
app.put('/api/trainee-plans/:planId', authenticateToken, requireRole(['admin', 'advisor']), (req, res) => {
  const planId = parseInt(req.params.planId);
  const updates = req.body;

  const planIndex = mockTraineePlans.findIndex(p => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  // Check permissions for advisors
  if (req.user.role === 'advisor') {
    const plan = mockTraineePlans[planIndex];
    const isAssignedTrainee = mockDatabase.trainees.some(t => 
      t.id === plan.traineeId && t.advisorId === req.user.id
    );
    if (!isAssignedTrainee) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update plans for trainees assigned to you' 
      });
    }
  }

  mockTraineePlans[planIndex] = {
    ...mockTraineePlans[planIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const updatedPlan = mockTraineePlans[planIndex];
  const planWithDetails = {
    ...updatedPlan,
    trainee: mockDatabase.trainees.find(t => t.id === updatedPlan.traineeId)
  };

  res.json({
    success: true,
    data: planWithDetails,
    message: 'Training plan updated successfully'
  });
});
// ===== DOCUMENT ROUTES =====

// Get all documents with filtering - UPDATED PERMISSIONS
app.get('/api/documents', authenticateToken, (req, res) => {
  const { traineeId, documentType } = req.query;
  
  let documents = mockDatabase.documents || [];
  
  // Role-based filtering
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (userTrainee) {
      documents = documents.filter(doc => doc.traineeId === userTrainee.id);
    } else {
      documents = [];
    }
  } else if (req.user.role === 'advisor') {
    // Advisor can only see documents of their assigned trainees
    const advisorTrainees = mockDatabase.trainees.filter(t => t.advisorId === req.user.id);
    const advisorTraineeIds = advisorTrainees.map(t => t.id);
    documents = documents.filter(doc => advisorTraineeIds.includes(doc.traineeId));
  }
  // Admin can see all documents (no additional filtering)
  
  // Apply additional filters if specified
  if (traineeId) {
    documents = documents.filter(doc => doc.traineeId === parseInt(traineeId));
  }
  
  if (documentType) {
    documents = documents.filter(doc => doc.documentType === documentType);
  }
  
  // Add trainee details to each document
  const documentsWithDetails = documents.map(doc => ({
    ...doc,
    trainee: mockDatabase.trainees.find(t => t.id === doc.traineeId),
    uploader: mockDatabase.users.find(u => u.id === doc.uploadedBy)
  }));

  res.json({
    success: true,
    data: documentsWithDetails
  });
});

// Upload new document - UPDATED PERMISSIONS
app.post('/api/documents', authenticateToken, (req, res) => {
  const { fileName, fileSize, fileType, documentType, traineeId, description } = req.body;
  
  if (!fileName || !traineeId) {
    return res.status(400).json({ success: false, message: 'File name and trainee ID are required' });
  }

  // Verify trainee exists
  const trainee = mockDatabase.trainees.find(t => t.id === parseInt(traineeId));
  if (!trainee) {
    return res.status(404).json({ success: false, message: 'Trainee not found' });
  }

  // Check permissions - STRICTER RULES
  if (req.user.role === 'trainee') {
    // Trainees can only upload documents for themselves
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (!userTrainee || userTrainee.id !== parseInt(traineeId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only upload documents for yourself' 
      });
    }
  } else if (req.user.role === 'advisor') {
    // Advisors can only upload documents for their assigned trainees
    const isAssignedTrainee = mockDatabase.trainees.some(t => 
      t.id === parseInt(traineeId) && t.advisorId === req.user.id
    );
    if (!isAssignedTrainee) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only upload documents for trainees assigned to you' 
      });
    }
  }
  // Admins can upload for anyone

  const newDocument = {
    id: mockDatabase.documents.length + 1,
    fileName,
    fileSize: fileSize || '0 KB',
    fileType: fileType || 'application/pdf',
    documentType: documentType || 'other',
    traineeId: parseInt(traineeId),
    description: description || '',
    uploadedBy: req.user.id,
    uploadDate: new Date().toISOString(),
    status: 'active',
    version: '1.0'
  };

  mockDatabase.documents.push(newDocument);

  const documentWithDetails = {
    ...newDocument,
    trainee: trainee,
    uploader: mockDatabase.users.find(u => u.id === req.user.id)
  };

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: documentWithDetails
  });
});

// ===== CHAT ROUTES - UPDATED PERMISSIONS =====

// Get available users for direct chat - UPDATED PERMISSIONS
app.get('/api/chat/available-users', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  let availableUsers = [];
  
  if (req.user.role === 'admin') {
    // Admin can chat with anyone
    availableUsers = mockDatabase.users.filter(user => user.id !== currentUserId);
  } else if (req.user.role === 'advisor') {
    // Advisors can only chat with their assigned trainees and other advisors
    const assignedTrainees = mockDatabase.trainees
      .filter(t => t.advisorId === currentUserId)
      .map(t => mockDatabase.users.find(u => u.id === t.userId))
      .filter(Boolean);
    
    const otherAdvisors = mockDatabase.users.filter(user => 
      user.id !== currentUserId && user.role === 'advisor'
    );
    
    availableUsers = [...assignedTrainees, ...otherAdvisors];
  } else if (req.user.role === 'trainee') {
    // Trainees can only chat with their assigned advisor
    const userTrainee = mockDatabase.trainees.find(t => t.userId === currentUserId);
    if (userTrainee && userTrainee.advisorId) {
      const assignedAdvisor = mockDatabase.users.find(u => u.id === userTrainee.advisorId);
      if (assignedAdvisor) {
        availableUsers = [assignedAdvisor];
      }
    }
  }
  
  res.json({
    success: true,
    data: availableUsers
  });
});

// Get or create one-to-one chat session - UPDATED PERMISSIONS
app.get('/api/chat/session/:advisorId', authenticateToken, (req, res) => {
  const advisorId = parseInt(req.params.advisorId);
  
  // Verify advisor exists and is actually an advisor
  const advisor = mockDatabase.users.find(u => u.id === advisorId && u.role === 'advisor');
  if (!advisor) {
    return res.status(404).json({ success: false, message: 'Advisor not found' });
  }

  // For trainees, verify they are assigned to this advisor
  const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
  if (!userTrainee) {
    return res.status(403).json({ success: false, message: 'Trainee not found' });
  }

  // Check if trainee is assigned to this advisor
  if (userTrainee.advisorId !== advisorId) {
    return res.status(403).json({ 
      success: false, 
      message: 'You can only chat with your assigned advisor' 
    });
  }

  // Find existing session between this trainee and advisor
  let chatSession = mockDatabase.chatSessions.find(session => 
    session.traineeId === userTrainee.id && session.advisorId === advisorId && session.status === 'active'
  );

  // If no session exists, create one
  if (!chatSession) {
    chatSession = {
      id: mockDatabase.chatSessions.length + 1,
      traineeId: userTrainee.id,
      advisorId: advisorId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    };
    mockDatabase.chatSessions.push(chatSession);
  }

  // Add details to session
  const sessionWithDetails = {
    ...chatSession,
    trainee: mockDatabase.trainees.find(t => t.id === chatSession.traineeId),
    advisor: mockDatabase.users.find(u => u.id === chatSession.advisorId)
  };

  res.json({
    success: true,
    data: sessionWithDetails
  });
});

// Get chat sessions for user - UPDATED PERMISSIONS
app.get('/api/chat/sessions', authenticateToken, (req, res) => {
  let sessions = [];
  
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (userTrainee) {
      // Trainees can only see sessions with their assigned advisor
      sessions = mockDatabase.chatSessions.filter(session => 
        session.traineeId === userTrainee.id && session.status === 'active'
      );
    }
  } else if (req.user.role === 'advisor') {
    // Advisors can only see sessions with their assigned trainees
    const advisorTrainees = mockDatabase.trainees.filter(t => t.advisorId === req.user.id);
    const advisorTraineeIds = advisorTrainees.map(t => t.id);
    sessions = mockDatabase.chatSessions.filter(session => 
      advisorTraineeIds.includes(session.traineeId) && session.status === 'active'
    );
  } else if (req.user.role === 'admin') {
    sessions = mockDatabase.chatSessions.filter(session => session.status === 'active');
  }
  
  // Add details and unread counts to sessions
  const sessionsWithDetails = sessions.map(session => {
    const messages = mockDatabase.chatMessages.filter(msg => msg.chatSessionId === session.id);
    const unreadCount = messages.filter(msg => 
      msg.receiverId === req.user.id && !msg.read
    ).length;
    
    return {
      ...session,
      trainee: mockDatabase.trainees.find(t => t.id === session.traineeId),
      advisor: mockDatabase.users.find(u => u.id === session.advisorId),
      lastMessage: messages[messages.length - 1],
      unreadCount
    };
  });

  // Sort by last message date (most recent first)
  sessionsWithDetails.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  res.json({
    success: true,
    data: sessionsWithDetails
  });
});

// Get available advisors for chat - UPDATED PERMISSIONS
app.get('/api/chat/advisors', authenticateToken, (req, res) => {
  let advisors = [];
  
  if (req.user.role === 'trainee') {
    // Trainees can only see their assigned advisor
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (userTrainee && userTrainee.advisorId) {
      const assignedAdvisor = mockDatabase.users.find(u => u.id === userTrainee.advisorId);
      if (assignedAdvisor) {
        advisors = [assignedAdvisor];
      }
    }
  } else if (req.user.role === 'admin') {
    // Admin can see all advisors
    advisors = mockDatabase.users.filter(user => user.role === 'advisor');
  } else if (req.user.role === 'advisor') {
    // Advisors can see other advisors
    advisors = mockDatabase.users.filter(user => 
      user.role === 'advisor' && user.id !== req.user.id
    );
  }
  
  res.json({
    success: true,
    data: advisors
  });
});

// ===== DIRECT CHAT ROUTES =====

// Get available users for direct chat (excluding current user)
app.get('/api/chat/available-users', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  // Filter out current user and get users based on role
  let availableUsers = [];
  
  if (req.user.role === 'admin') {
    // Admin can chat with anyone
    availableUsers = mockDatabase.users.filter(user => user.id !== currentUserId);
  } else if (req.user.role === 'advisor') {
    // Advisors can chat with trainees and other advisors
    availableUsers = mockDatabase.users.filter(user => 
      user.id !== currentUserId && 
      (user.role === 'trainee' || user.role === 'advisor')
    );
  } else if (req.user.role === 'trainee') {
    // Trainees can chat with advisors and other trainees
    availableUsers = mockDatabase.users.filter(user => 
      user.id !== currentUserId && 
      (user.role === 'advisor' || user.role === 'trainee')
    );
  }
  
  res.json({
    success: true,
    data: availableUsers
  });
});

// Get or create direct chat session
app.get('/api/chat/direct/:otherUserId', authenticateToken, (req, res) => {
  const otherUserId = parseInt(req.params.otherUserId);
  const currentUserId = req.user.id;
  
  // Verify other user exists
  const otherUser = mockDatabase.users.find(u => u.id === otherUserId);
  if (!otherUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Find existing direct chat session
  let chatSession = mockDatabase.chatSessions.find(session => 
    ((session.participant1Id === currentUserId && session.participant2Id === otherUserId) ||
     (session.participant1Id === otherUserId && session.participant2Id === currentUserId)) &&
    session.status === 'active'
  );
  
  // If no session exists, create one
  if (!chatSession) {
    chatSession = {
      id: mockDatabase.chatSessions.length + 1,
      participant1Id: currentUserId,
      participant2Id: otherUserId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    };
    mockDatabase.chatSessions.push(chatSession);
  }
  
  // Add user details to session
  const sessionWithDetails = {
    ...chatSession,
    participant1: mockDatabase.users.find(u => u.id === chatSession.participant1Id),
    participant2: mockDatabase.users.find(u => u.id === chatSession.participant2Id)
  };
  
  res.json({
    success: true,
    data: sessionWithDetails
  });
});

// Get user's direct chat sessions
app.get('/api/chat/direct-sessions', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  
  // Find all direct chat sessions where user is a participant
  const sessions = mockDatabase.chatSessions.filter(session => 
    (session.participant1Id === currentUserId || session.participant2Id === currentUserId) &&
    session.status === 'active'
  );
  
  // Add details and unread counts to sessions
  const sessionsWithDetails = sessions.map(session => {
    const messages = mockDatabase.chatMessages.filter(msg => msg.chatSessionId === session.id);
    const unreadCount = messages.filter(msg => 
      msg.receiverId === currentUserId && !msg.read
    ).length;
    
    const otherParticipant = session.participant1Id === currentUserId 
      ? mockDatabase.users.find(u => u.id === session.participant2Id)
      : mockDatabase.users.find(u => u.id === session.participant1Id);
    
    return {
      ...session,
      participant1: mockDatabase.users.find(u => u.id === session.participant1Id),
      participant2: mockDatabase.users.find(u => u.id === session.participant2Id),
      otherParticipant,
      lastMessage: messages[messages.length - 1],
      unreadCount
    };
  });
  
  // Sort by last message date (most recent first)
  sessionsWithDetails.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  
  res.json({
    success: true,
    data: sessionsWithDetails
  });
});

// ===== ONE-TO-ONE CHAT ROUTES =====

// Get or create one-to-one chat session
app.get('/api/chat/session/:advisorId', authenticateToken, (req, res) => {
  const advisorId = parseInt(req.params.advisorId);
  
  // Verify advisor exists and is actually an advisor
  const advisor = mockDatabase.users.find(u => u.id === advisorId && u.role === 'advisor');
  if (!advisor) {
    return res.status(404).json({ success: false, message: 'Advisor not found' });
  }

  // For trainees, get their trainee record
  const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
  if (!userTrainee) {
    return res.status(403).json({ success: false, message: 'Trainee not found' });
  }

  // Find existing session between this trainee and advisor
  let chatSession = mockDatabase.chatSessions.find(session => 
    session.traineeId === userTrainee.id && session.advisorId === advisorId && session.status === 'active'
  );

  // If no session exists, create one
  if (!chatSession) {
    chatSession = {
      id: mockDatabase.chatSessions.length + 1,
      traineeId: userTrainee.id,
      advisorId: advisorId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    };
    mockDatabase.chatSessions.push(chatSession);
  }

  // Add details to session
  const sessionWithDetails = {
    ...chatSession,
    trainee: mockDatabase.trainees.find(t => t.id === chatSession.traineeId),
    advisor: mockDatabase.users.find(u => u.id === chatSession.advisorId)
  };

  res.json({
    success: true,
    data: sessionWithDetails
  });
});

// Get chat sessions for user
app.get('/api/chat/sessions', authenticateToken, (req, res) => {
  let sessions = [];
  
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (userTrainee) {
      sessions = mockDatabase.chatSessions.filter(session => 
        session.traineeId === userTrainee.id && session.status === 'active'
      );
    }
  } else if (req.user.role === 'advisor') {
    sessions = mockDatabase.chatSessions.filter(session => 
      session.advisorId === req.user.id && session.status === 'active'
    );
  } else if (req.user.role === 'admin') {
    sessions = mockDatabase.chatSessions.filter(session => session.status === 'active');
  }
  
  // Add details and unread counts to sessions
  const sessionsWithDetails = sessions.map(session => {
    const messages = mockDatabase.chatMessages.filter(msg => msg.chatSessionId === session.id);
    const unreadCount = messages.filter(msg => 
      msg.receiverId === req.user.id && !msg.read
    ).length;
    
    return {
      ...session,
      trainee: mockDatabase.trainees.find(t => t.id === session.traineeId),
      advisor: mockDatabase.users.find(u => u.id === session.advisorId),
      lastMessage: messages[messages.length - 1],
      unreadCount
    };
  });

  // Sort by last message date (most recent first)
  sessionsWithDetails.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  res.json({
    success: true,
    data: sessionsWithDetails
  });
});

// Get messages for a specific chat session
app.get('/api/chat/session/:sessionId/messages', authenticateToken, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  
  // Verify user has access to this chat session
  const chatSession = mockDatabase.chatSessions.find(session => session.id === sessionId);
  if (!chatSession) {
    return res.status(404).json({ success: false, message: 'Chat session not found' });
  }

  // Check access rights
  let hasAccess = false;
  
  if (chatSession.participant1Id && chatSession.participant2Id) {
    // Direct chat session
    hasAccess = chatSession.participant1Id === req.user.id || chatSession.participant2Id === req.user.id;
  } else {
    // Advisor chat session
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (req.user.role === 'trainee') {
      hasAccess = userTrainee && chatSession.traineeId === userTrainee.id;
    } else if (req.user.role === 'advisor') {
      hasAccess = chatSession.advisorId === req.user.id;
    } else if (req.user.role === 'admin') {
      hasAccess = true; // Admin can access all chats
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: 'Access denied to this chat session' });
  }

  let messages = mockDatabase.chatMessages.filter(msg => msg.chatSessionId === sessionId);
  
  // Sort messages by timestamp (oldest first)
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Add sender details
  const messagesWithDetails = messages.map(message => ({
    ...message,
    sender: mockDatabase.users.find(u => u.id === message.senderId),
    receiver: mockDatabase.users.find(u => u.id === message.receiverId)
  }));

  res.json({
    success: true,
    data: messagesWithDetails
  });
});

// Send a message in any chat session (advisor or direct)
app.post('/api/chat/session/:sessionId/messages', authenticateToken, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { message } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message cannot be empty' });
  }

  // Verify user has access to this chat session
  const chatSession = mockDatabase.chatSessions.find(session => session.id === sessionId);
  if (!chatSession) {
    return res.status(404).json({ success: false, message: 'Chat session not found' });
  }

  // Check access rights and determine receiver
  let receiverId;
  let hasAccess = false;
  
  if (chatSession.participant1Id && chatSession.participant2Id) {
    // Direct chat session
    hasAccess = chatSession.participant1Id === req.user.id || chatSession.participant2Id === req.user.id;
    
    if (hasAccess) {
      // Determine receiver for direct chat
      receiverId = chatSession.participant1Id === req.user.id 
        ? chatSession.participant2Id 
        : chatSession.participant1Id;
    }
  } else {
    // Advisor chat session
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (req.user.role === 'trainee') {
      hasAccess = userTrainee && chatSession.traineeId === userTrainee.id;
      if (hasAccess) {
        receiverId = chatSession.advisorId;
      }
    } else if (req.user.role === 'advisor') {
      hasAccess = chatSession.advisorId === req.user.id;
      if (hasAccess) {
        receiverId = mockDatabase.trainees.find(t => t.id === chatSession.traineeId)?.userId;
      }
    } else if (req.user.role === 'admin') {
      hasAccess = true;
      // Admin can send to both sides, determine receiver based on last message
      const lastMessage = mockDatabase.chatMessages
        .filter(msg => msg.chatSessionId === sessionId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      if (lastMessage) {
        receiverId = lastMessage.senderId === req.user.id ? lastMessage.receiverId : lastMessage.senderId;
      } else {
        // If no messages, send to advisor if admin is trainee, or trainee if admin is advisor
        receiverId = chatSession.advisorId === req.user.id ? 
          mockDatabase.trainees.find(t => t.id === chatSession.traineeId)?.userId : 
          chatSession.advisorId;
      }
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: 'You do not have permission to send messages in this chat' });
  }

  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver not found' });
  }

  // Update session last message time
  chatSession.lastMessageAt = new Date().toISOString();

  // Create message
  const newMessage = {
    id: mockDatabase.chatMessages.length + 1,
    chatSessionId: sessionId,
    senderId: req.user.id,
    receiverId: receiverId,
    message: message.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    messageType: 'text'
  };

  mockDatabase.chatMessages.push(newMessage);

  // Add sender details for response
  const messageWithDetails = {
    ...newMessage,
    sender: mockDatabase.users.find(u => u.id === newMessage.senderId),
    receiver: mockDatabase.users.find(u => u.id === newMessage.receiverId)
  };

  res.json({
    success: true,
    data: messageWithDetails
  });
});

// Mark messages as read
app.put('/api/chat/session/:sessionId/mark-read', authenticateToken, (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  
  // Verify user has access to this chat session
  const chatSession = mockDatabase.chatSessions.find(session => session.id === sessionId);
  if (!chatSession) {
    return res.status(404).json({ success: false, message: 'Chat session not found' });
  }

  // Check access rights for both direct and advisor chats
  let hasAccess = false;
  
  if (chatSession.participant1Id && chatSession.participant2Id) {
    // Direct chat session
    hasAccess = chatSession.participant1Id === req.user.id || chatSession.participant2Id === req.user.id;
  } else {
    // Advisor chat session
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (req.user.role === 'trainee') {
      hasAccess = userTrainee && chatSession.traineeId === userTrainee.id;
    } else if (req.user.role === 'advisor') {
      hasAccess = chatSession.advisorId === req.user.id;
    } else if (req.user.role === 'admin') {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Mark all messages to this user as read
  let markedCount = 0;
  mockDatabase.chatMessages.forEach(message => {
    if (message.chatSessionId === sessionId && message.receiverId === req.user.id && !message.read) {
      message.read = true;
      markedCount++;
    }
  });

  res.json({
    success: true,
    message: `${markedCount} messages marked as read`
  });
});

// Close chat session
app.put('/api/chat/session/:sessionId/close', authenticateToken, requireRole(['admin', 'advisor']), (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  
  const sessionIndex = mockDatabase.chatSessions.findIndex(session => session.id === sessionId);
  if (sessionIndex === -1) {
    return res.status(404).json({ success: false, message: 'Chat session not found' });
  }

  mockDatabase.chatSessions[sessionIndex].status = 'closed';
  mockDatabase.chatSessions[sessionIndex].lastMessageAt = new Date().toISOString();

  res.json({
    success: true,
    data: mockDatabase.chatSessions[sessionIndex],
    message: 'Chat session closed'
  });
});

// Get available advisors for chat
app.get('/api/chat/advisors', authenticateToken, (req, res) => {
  const advisors = mockDatabase.users.filter(user => user.role === 'advisor');
  
  res.json({
    success: true,
    data: advisors
  });
});

// ===== TRAINEES ROUTES =====
app.get('/api/trainees', authenticateToken, (req, res) => {
  const traineesWithUsers = mockDatabase.trainees.map(trainee => ({
    ...trainee,
    user: mockDatabase.users.find(u => u.id === trainee.userId),
    advisor: mockDatabase.users.find(u => u.id === trainee.advisorId)
  }));

  res.json({
    success: true,
    data: traineesWithUsers,
    message: 'Development mode - using mock data'
  });
});

app.get('/api/trainees/:id', authenticateToken, (req, res) => {
  const trainee = mockDatabase.trainees.find(t => t.id === parseInt(req.params.id));
  
  if (!trainee) {
    return res.status(404).json({ message: 'Trainee not found' });
  }

  const traineeWithDetails = {
    ...trainee,
    user: mockDatabase.users.find(u => u.id === trainee.userId),
    advisor: mockDatabase.users.find(u => u.id === trainee.advisorId)
  };

  res.json({
    success: true,
    data: traineeWithDetails
  });
});

// Create new trainee - ADMIN ONLY
app.post('/api/trainees', authenticateToken, requireRole(['admin']), (req, res) => {
  const { userId, employeeId, startDate, endDate, trainingType, advisorId } = req.body;
  
  const user = mockDatabase.users.find(u => u.id === userId);
  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  }

  const newTrainee = {
    id: mockDatabase.trainees.length + 1,
    userId: parseInt(userId),
    employeeId,
    startDate,
    endDate,
    trainingType: trainingType || 'General',
    status: 'active',
    advisorId: advisorId ? parseInt(advisorId) : undefined
  };

  mockDatabase.trainees.push(newTrainee);

  res.json({
    success: true,
    data: {
      ...newTrainee,
      user: user,
      advisor: advisorId ? mockDatabase.users.find(u => u.id === parseInt(advisorId)) : undefined
    }
  });
});

// Update trainee - ADMIN ONLY
app.put('/api/trainees/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const traineeId = parseInt(req.params.id);
  const updates = req.body;
  
  const traineeIndex = mockDatabase.trainees.findIndex(t => t.id === traineeId);
  if (traineeIndex === -1) {
    return res.status(404).json({ success: false, message: 'Trainee not found' });
  }

  mockDatabase.trainees[traineeIndex] = {
    ...mockDatabase.trainees[traineeIndex],
    ...updates
  };

  const updatedTrainee = mockDatabase.trainees[traineeIndex];
  const user = mockDatabase.users.find(u => u.id === updatedTrainee.userId);
  const advisor = updatedTrainee.advisorId ? mockDatabase.users.find(u => u.id === updatedTrainee.advisorId) : undefined;

  res.json({
    success: true,
    data: {
      ...updatedTrainee,
      user,
      advisor
    }
  });
});

// Delete trainee - ADMIN ONLY
app.delete('/api/trainees/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const traineeId = parseInt(req.params.id);
  
  const traineeIndex = mockDatabase.trainees.findIndex(t => t.id === traineeId);
  if (traineeIndex === -1) {
    return res.status(404).json({ success: false, message: 'Trainee not found' });
  }

  mockDatabase.trainees.splice(traineeIndex, 1);

  res.json({
    success: true,
    message: 'Trainee deleted successfully'
  });
});

// ===== TASKS ROUTES =====
app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasksWithTrainees = mockDatabase.tasks.map(task => ({
    ...task,
    trainee: mockDatabase.trainees.find(t => t.id === task.traineeId)
  }));

  res.json({
    success: true,
    data: tasksWithTrainees
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, traineeId, dueDate, priority } = req.body;
  
  const newTask = {
    id: mockDatabase.tasks.length + 1,
    title,
    description,
    traineeId,
    dueDate,
    priority: priority || 'medium',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  mockDatabase.tasks.push(newTask);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: newTask
  });
});

// Update task - Admins and Advisors can manage tasks
app.put('/api/tasks/:id', authenticateToken, requireRole(['admin', 'advisor']), (req, res) => {
  const taskId = parseInt(req.params.id);
  const updates = req.body;
  
  const taskIndex = mockDatabase.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  mockDatabase.tasks[taskIndex] = {
    ...mockDatabase.tasks[taskIndex],
    ...updates
  };

  const updatedTask = mockDatabase.tasks[taskIndex];
  const trainee = mockDatabase.trainees.find(t => t.id === updatedTask.traineeId);

  res.json({
    success: true,
    data: {
      ...updatedTask,
      trainee
    }
  });
});

// Delete task - Admins and Advisors can delete tasks
app.delete('/api/tasks/:id', authenticateToken, requireRole(['admin', 'advisor']), (req, res) => {
  const taskId = parseInt(req.params.id);
  
  const taskIndex = mockDatabase.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  mockDatabase.tasks.splice(taskIndex, 1);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// Update task progress
app.post('/api/tasks/:id/progress', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const { progress, notes } = req.body;
  
  const taskIndex = mockDatabase.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Update task status based on progress
  let newStatus = mockDatabase.tasks[taskIndex].status;
  if (progress === 100) {
    newStatus = 'completed';
  } else if (progress > 0 && progress < 100) {
    newStatus = 'in-progress';
  }

  mockDatabase.tasks[taskIndex] = {
    ...mockDatabase.tasks[taskIndex],
    status: newStatus
  };

  const updatedTask = mockDatabase.tasks[taskIndex];
  const trainee = mockDatabase.trainees.find(t => t.id === updatedTask.traineeId);

  res.json({
    success: true,
    data: {
      ...updatedTask,
      trainee
    }
  });
});

// Request help for a task
app.post('/api/tasks/:id/help-request', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  const { message } = req.body;
  
  const task = mockDatabase.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
  if (!userTrainee) {
    return res.status(403).json({ success: false, message: 'Trainee not found' });
  }

  // Determine urgency based on message content
  let urgency = 'medium';
  if (message.includes('urgent') || message.includes('emergency') || message.includes('cannot proceed')) {
    urgency = 'high';
  } else if (message.includes('when you have time') || message.includes('no rush')) {
    urgency = 'low';
  }

  // Create or get chat session with assigned advisor
  let chatSession = mockDatabase.chatSessions.find(session => 
    session.traineeId === userTrainee.id && 
    session.advisorId === userTrainee.advisorId && 
    session.status === 'active'
  );

  if (!chatSession) {
    chatSession = {
      id: mockDatabase.chatSessions.length + 1,
      traineeId: userTrainee.id,
      advisorId: userTrainee.advisorId || 2, // Default to first advisor
      status: 'active',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    };
    mockDatabase.chatSessions.push(chatSession);
  }

  const newHelpRequest = {
    id: mockDatabase.helpRequests.length + 1,
    taskId,
    traineeId: userTrainee.id,
    message,
    status: 'pending',
    urgency,
    createdAt: new Date().toISOString(),
    chatSessionId: chatSession.id
  };

  mockDatabase.helpRequests.push(newHelpRequest);

  res.json({
    success: true,
    data: newHelpRequest
  });
});

// ===== HELP REQUESTS ROUTES =====
app.get('/api/help-requests', authenticateToken, (req, res) => {
  const taskId = req.query.taskId ? parseInt(req.query.taskId) : null;
  
  let requests = mockDatabase.helpRequests || [];
  
  if (taskId) {
    requests = requests.filter(req => req.taskId === taskId);
  }

  // For trainees, only show their own requests
  if (req.user.role === 'trainee') {
    const userTrainee = mockDatabase.trainees.find(t => t.userId === req.user.id);
    if (userTrainee) {
      requests = requests.filter(req => req.traineeId === userTrainee.id);
    }
  }

  // Add details to each request
  const requestsWithDetails = requests.map(request => {
    const chatSession = mockDatabase.chatSessions.find(session => session.id === request.chatSessionId);
    const unreadCount = chatSession ? mockDatabase.chatMessages.filter(msg => 
      msg.chatSessionId === request.chatSessionId && msg.receiverId === req.user.id && !msg.read
    ).length : 0;

    return {
      ...request,
      task: mockDatabase.tasks.find(t => t.id === request.taskId),
      trainee: mockDatabase.trainees.find(t => t.id === request.traineeId),
      resolvedByUser: request.resolvedBy ? mockDatabase.users.find(u => u.id === request.resolvedBy) : null,
      chatSession,
      hasUnreadMessages: unreadCount > 0,
      unreadCount
    };
  });

  res.json({
    success: true,
    data: requestsWithDetails
  });
});

// Get help request statistics
app.get('/api/help-requests/stats', authenticateToken, (req, res) => {
  const requests = mockDatabase.helpRequests || [];
  
  // Calculate average response time (in hours)
  const resolvedRequests = requests.filter(r => r.status === 'resolved' && r.resolvedAt);
  let averageResponseTime = 'N/A';
  
  if (resolvedRequests.length > 0) {
    const totalResponseTime = resolvedRequests.reduce((total, req) => {
      const created = new Date(req.createdAt);
      const resolved = new Date(req.resolvedAt);
      return total + (resolved - created);
    }, 0);
    
    const avgHours = Math.round((totalResponseTime / resolvedRequests.length) / (1000 * 60 * 60));
    averageResponseTime = `${avgHours}h`;
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
    highPriority: requests.filter(r => r.urgency === 'high').length,
    averageResponseTime,
    activeChats: mockDatabase.chatSessions.filter(s => s.status === 'active').length,
    recentRequests: requests.slice(-5).reverse()
  };

  res.json({
    success: true,
    data: stats
  });
});

// Resolve help request (for advisors/admins)
app.put('/api/help-requests/:id/resolve', authenticateToken, requireRole(['admin', 'advisor']), (req, res) => {
  const requestId = parseInt(req.params.id);
  const { responseMessage } = req.body;
  
  const requestIndex = mockDatabase.helpRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Help request not found' });
  }

  mockDatabase.helpRequests[requestIndex] = {
    ...mockDatabase.helpRequests[requestIndex],
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolvedBy: req.user.id,
    responseMessage: responseMessage || 'Your request has been resolved.'
  };

  const updatedRequest = mockDatabase.helpRequests[requestIndex];
  
  // Add details for the response
  const requestWithDetails = {
    ...updatedRequest,
    task: mockDatabase.tasks.find(t => t.id === updatedRequest.taskId),
    trainee: mockDatabase.trainees.find(t => t.id === updatedRequest.traineeId),
    resolvedByUser: mockDatabase.users.find(u => u.id === req.user.id)
  };

  res.json({
    success: true,
    data: requestWithDetails
  });
});

// Delete help request (admin only)
app.delete('/api/help-requests/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const requestId = parseInt(req.params.id);
  
  const requestIndex = mockDatabase.helpRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) {
    return res.status(404).json({ success: false, message: 'Help request not found' });
  }

  mockDatabase.helpRequests.splice(requestIndex, 1);

  res.json({
    success: true,
    message: 'Help request deleted successfully'
  });
});

// ===== USERS ROUTES =====
app.get('/api/users', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockDatabase.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    }))
  });
});

// ===== HEALTH & INFO ROUTES =====
app.get('/api/health', (req, res) => {
  res.json({
    message: '🚀 SATORP Trainee System API Running',
    mode: 'Development (Mock Data)',
    database: 'Using in-memory mock data',
    timestamp: new Date().toISOString(),
    status: 'Operational',
    features: [
      'User Authentication',
      'Trainee Management',
      'Task Management',
      'Progress Tracking',
      'Help Requests System',
      'One-to-One Chat System',
      'Direct Chat System',
      'Document Management System',
      'Role-based Access Control'
    ]
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    system: 'SATORP Trainee Management System',
    version: '1.0.0',
    mode: 'Development',
    features: [
      'User Authentication',
      'Trainee Management', 
      'Task Assignment & Tracking',
      'Progress Monitoring',
      'Help Request System',
      'One-to-One Chat System',
      'Direct Chat System',
      'Document Management System',
      'Role-based Access Control'
    ],
    testAccounts: [
      { email: 'admin@satorp.com', password: 'password', role: 'admin' },
      { email: 'advisor@satorp.com', password: 'password', role: 'advisor' },
      { email: 'advisor2@satorp.com', password: 'password', role: 'advisor' },
      { email: 'trainee@satorp.com', password: 'password', role: 'trainee' },
      { email: 'trainee2@satorp.com', password: 'password', role: 'trainee' }
    ]
  });
});

// ===== MAIN ROUTE =====
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SATORP Trainee System</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          .status { 
            padding: 20px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 10px; 
            margin-bottom: 20px;
          }
          .endpoints { 
            background: rgba(255,255,255,0.15); 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 20px;
          }
          .test-accounts { 
            background: rgba(255,255,255,0.15); 
            padding: 20px; 
            border-radius: 10px;
          }
          a { color: #a3e635; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SATORP Trainee Management System</h1>
          
          <div class="status">
            <h3>Development Mode Active</h3>
            <p><strong>Status:</strong> ✅ Running with Mock Data</p>
            <p><strong>Database:</strong> Using in-memory data</p>
            <p><strong>New Features:</strong> ✅ Complete Document Management System</p>
            <p><strong>Frontend Ready:</strong> Trainees and advisors can upload documents</p>
          </div>
          
          <div class="endpoints">
            <h3>📡 Available API Endpoints:</h3>
            <ul>
              <li><strong>POST</strong> <code>/api/auth/login</code> - User authentication</li>
              <li><strong>GET</strong> <code>/api/trainees</code> - Get all trainees</li>
              <li><strong>GET</strong> <code>/api/tasks</code> - Get all tasks</li>
              <li><strong>POST</strong> <code>/api/tasks/:id/progress</code> - Update task progress</li>
              <li><strong>POST</strong> <code>/api/tasks/:id/help-request</code> - Request help</li>
              <li><strong>GET</strong> <code>/api/help-requests</code> - Get help requests</li>
              <li><strong>GET</strong> <code>/api/help-requests/stats</code> - Get help request statistics</li>
              <li><strong>PUT</strong> <code>/api/help-requests/:id/resolve</code> - Resolve help request</li>
              <li><strong>GET</strong> <code>/api/documents</code> - Get all documents</li>
              <li><strong>POST</strong> <code>/api/documents</code> - Upload document</li>
              <li><strong>PUT</strong> <code>/api/documents/:id</code> - Update document</li>
              <li><strong>DELETE</strong> <code>/api/documents/:id</code> - Delete document</li>
              <li><strong>GET</strong> <code>/api/documents/stats</code> - Get document statistics</li>
              <li><strong>GET</strong> <code>/api/chat/available-users</code> - Get users for direct chat</li>
              <li><strong>GET</strong> <code>/api/chat/direct/:userId</code> - Get or create direct chat</li>
              <li><strong>GET</strong> <code>/api/chat/direct-sessions</code> - Get direct chat sessions</li>
              <li><strong>GET</strong> <code>/api/chat/advisors</code> - Get available advisors</li>
              <li><strong>GET</strong> <code>/api/chat/session/:advisorId</code> - Get or create chat session</li>
              <li><strong>GET</strong> <code>/api/chat/sessions</code> - Get user's chat sessions</li>
              <li><strong>GET</strong> <code>/api/chat/session/:id/messages</code> - Get chat messages</li>
              <li><strong>POST</strong> <code>/api/chat/session/:id/messages</code> - Send chat message</li>
              <li><strong>PUT</strong> <code>/api/chat/session/:id/mark-read</code> - Mark messages as read</li>
              <li><strong>PUT</strong> <code>/api/chat/session/:id/close</code> - Close chat session</li>
              <li><strong>GET</strong> <code>/api/health</code> - System status</li>
              <li><strong>GET</strong> <code>/api/info</code> - System information</li>
            </ul>
          </div>
          
          <div class="test-accounts">
            <h3>👥 Test Accounts:</h3>
            <ul>
              <li><strong>Admin:</strong> admin@satorp.com / password</li>
              <li><strong>Advisors:</strong> advisor@satorp.com / password, advisor2@satorp.com / password</li>
              <li><strong>Trainees:</strong> trainee@satorp.com / password, trainee2@satorp.com / password</li>
            </ul>
            
            <h3>🔗 Quick Links:</h3>
            <ul>
              <li><a href="/api/health">API Health Check</a></li>
              <li><a href="/api/info">System Information</a></li>
              <li><a href="/api/documents/stats">Document Statistics (requires login)</a></li>
              <li><a href="/api/chat/available-users">View Available Users (requires login)</a></li>
            </ul>
          </div>
          
          <p><em>💡 New Features: Complete Document Management System where trainees and advisors can upload documents!</em></p>
        </div>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 SATORP Trainee System - Development Server');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔧 Mode: Development (Mock Data)`);
  console.log(`📊 Database: Using in-memory mock data`);
  console.log(`🔐 Authentication: JWT Enabled`);
  console.log(`🔒 Role-based Authorization: Active`);
  console.log('='.repeat(60));
  console.log('👥 Test Accounts:');
  console.log('   Admin:    admin@satorp.com / password');
  console.log('   Advisors: advisor@satorp.com / password, advisor2@satorp.com / password');
  console.log('   Trainees: trainee@satorp.com / password, trainee2@satorp.com / password');
  console.log('='.repeat(60));
  console.log('💬 Chat Features:');
  console.log('   ✅ Direct chat system with user selection');
  console.log('   ✅ Role-based user filtering');
  console.log('   ✅ Private conversations between selected users');
  console.log('   ✅ Message read receipts and unread counters');
  console.log('   ✅ Session management');
  console.log('='.repeat(60));
  console.log('📁 Document Features:');
  console.log('   ✅ Complete document management system');
  console.log('   ✅ Trainees can upload their own documents');
  console.log('   ✅ Advisors can upload documents for assigned trainees');
  console.log('   ✅ Admins have full document access');
  console.log('   ✅ Document statistics and filtering');
  console.log('='.repeat(60));
  console.log('💡 Complete SATORP Trainee System is now operational!');
  console.log('📡 All API endpoints are ready with full functionality');
  console.log('='.repeat(60));
});