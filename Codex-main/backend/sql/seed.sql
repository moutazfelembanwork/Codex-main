DECLARE @passwordHash NVARCHAR(255) = '$2a$10$u1cFmm7dXuo7QvfN5WLhkONgKwRPj7HW8SLDDx34rB1UrKvF6t84.';

INSERT INTO Users (Email, PasswordHash, FullName, Role, Department, PhoneNumber)
VALUES
  ('admin@satorp.com', @passwordHash, 'System Administrator', 'admin', 'Information Technology', '+966-13-123-4567'),
  ('advisor@satorp.com', @passwordHash, 'John Advisor', 'advisor', 'Operations', '+966-13-234-5678'),
  ('advisor2@satorp.com', @passwordHash, 'Sarah Advisor', 'advisor', 'Engineering', '+966-13-345-6789'),
  ('trainee@satorp.com', @passwordHash, 'Ahmed Trainee', 'trainee', 'Operations', '+966-13-456-7890'),
  ('trainee2@satorp.com', @passwordHash, 'Fatima Trainee', 'trainee', 'Engineering', '+966-13-567-8901');

INSERT INTO Trainees (UserId, EmployeeId, StartDate, EndDate, TrainingType, Status, AdvisorId)
VALUES
  (4, 'TRN001', '2024-01-01', '2024-12-31', 'Operations', 'active', 2),
  (5, 'TRN002', '2024-01-01', '2024-12-31', 'Engineering', 'active', 3);

INSERT INTO Tasks (Title, Description, TraineeId, DueDate, Status, Priority, Progress, LastProgressNote)
VALUES
  ('Safety Training', 'Complete safety orientation program and pass the assessment test.', 1, '2024-12-15', 'in-progress', 'high', 60, 'Reviewed modules 1-3'),
  ('Equipment Operation', 'Operate refinery equipment under supervision and log learnings.', 1, '2024-12-30', 'pending', 'medium', 25, NULL),
  ('Technical Documentation', 'Review technical documentation and summarize key points.', 2, '2024-11-30', 'completed', 'low', 100, 'Summary submitted');

INSERT INTO ChatSessions (SessionType, TraineeId, AdvisorId, Status, CreatedAt, LastMessageAt, Participant1Id, Participant2Id)
VALUES
  ('advisor', 1, 2, 'active', '2024-03-01T08:00:00Z', '2024-12-05T09:15:00Z', NULL, NULL),
  ('advisor', 2, 3, 'active', '2024-04-01T08:00:00Z', '2024-11-20T13:20:00Z', NULL, NULL),
  ('direct', NULL, NULL, 'active', '2024-05-10T11:00:00Z', '2024-12-04T15:45:00Z', 1, 2),
  ('direct', NULL, NULL, 'active', '2024-06-12T14:00:00Z', '2024-11-28T17:25:00Z', 4, 5);

INSERT INTO ChatMessages (SessionId, SessionType, SenderId, ReceiverId, Message, Timestamp, ReadBy)
VALUES
  (1, 'advisor', 4, 2, 'Good morning! I have a question about the safety checklist.', '2024-12-05T08:30:00Z', '[2]'),
  (1, 'advisor', 2, 4, 'Sure, what specifically is unclear?', '2024-12-05T08:35:00Z', '[2,4]'),
  (2, 'advisor', 3, 5, 'Please review the updated design templates before Friday.', '2024-11-20T13:20:00Z', '[3]'),
  (3, 'direct', 1, 2, 'Can you join the leadership call at 3 PM?', '2024-12-04T15:30:00Z', '[1]'),
  (3, 'direct', 2, 1, 'Yes, I will be there.', '2024-12-04T15:45:00Z', '[1,2]');

INSERT INTO Documents (TraineeId, FileName, DocumentType, FileSize, FileType, Description, UploadedBy, Status, Version)
VALUES
  (1, 'safety_certificate.pdf', 'certificate', '2.5 MB', 'application/pdf', 'Safety training completion certificate.', 4, 'active', '1.0'),
  (1, 'progress_report_q3.docx', 'report', '1.2 MB', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Quarterly progress assessment report.', 2, 'active', '1.0'),
  (2, 'technical_assessment.pdf', 'assessment', '3.1 MB', 'application/pdf', 'Technical skills evaluation.', 3, 'active', '1.0');

INSERT INTO HelpRequests (TaskId, TraineeId, Message, Status, Urgency, CreatedAt, ChatSessionId)
VALUES
  (1, 1, 'I am having trouble accessing the safety training portal.', 'pending', 'high', '2024-12-05T08:45:00Z', 1),
  (2, 1, 'Could you please clarify the specific equipment to focus on?', 'resolved', 'medium', '2024-12-02T10:15:00Z', 1),
  (3, 2, 'Need confirmation on document formatting requirements.', 'pending', 'low', '2024-11-20T13:20:00Z', 2);

UPDATE HelpRequests
SET ResolvedAt = '2024-12-03T09:30:00Z', ResolvedBy = 2, ResponseMessage = 'Let us meet tomorrow at 10 AM to review the equipment list.'
WHERE Id = 2;

INSERT INTO TraineePlans (TraineeId, Title, Description, StartDate, EndDate, Status)
VALUES
  (1, 'Operations Readiness Plan', 'Comprehensive plan covering operational readiness and safety.', '2024-01-01', '2024-12-31', 'active'),
  (2, 'Engineering Excellence Plan', 'Structured development plan for engineering trainee.', '2024-02-01', '2024-12-31', 'active');

INSERT INTO PlanMilestones (PlanId, Title, Description, DueDate, Status, DisplayOrder, CompletedDate, Notes)
VALUES
  (1, 'Safety Orientation', 'Complete site-wide safety orientation program', '2024-03-31', 'completed', 1, '2024-03-20T00:00:00Z', 'Completed with excellent score'),
  (1, 'Equipment Training', 'Gain proficiency in handling primary equipment', '2024-06-30', 'in-progress', 2, NULL, NULL),
  (1, 'Operations Shadowing', 'Shadow senior operator for shift handover', '2024-09-30', 'pending', 3, NULL, NULL),
  (2, 'Design Standards', 'Review SATORP engineering design standards.', '2024-04-30', 'completed', 1, '2024-04-20T00:00:00Z', NULL),
  (2, 'Process Simulation', 'Run simulation on assigned process unit.', '2024-07-31', 'in-progress', 2, NULL, NULL);

INSERT INTO PlanGoals (PlanId, Title, Description, TargetDate, Status, Progress)
VALUES
  (1, 'Safety Certification', 'Obtain required safety certifications', '2024-04-30', 'completed', 100),
  (1, 'Process Optimization', 'Lead a process optimization initiative', '2024-10-15', 'on-track', 45),
  (2, 'Design Review', 'Complete design review sign-off', '2024-08-30', 'on-track', 55);
