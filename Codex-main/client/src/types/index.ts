// =====================
// User Types
// =====================
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'advisor' | 'trainee';
  department?: string | null;
  phoneNumber?: string | null;
  createdAt?: string | null;
  lastLogin?: string | null;
  isActive?: boolean;
  traineeId?: number | null;
  traineeStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  traineePlanId?: number | null;
}

export interface RawUser {
  // Common identifier variations
  id?: number;
  userId?: number;
  UserID?: number;

  // Email/name variations
  email?: string;
  Email?: string;
  name?: string;
  FullName?: string;
  fullName?: string;

  // Role
  role?: string;
  Role?: string;

  // Department/contact
  Department?: string | null;
  department?: string | null;
  PhoneNumber?: string | null;
  phoneNumber?: string | null;

  // Active state & dates
  IsActive?: boolean;
  isActive?: boolean;
  CreatedAt?: string;
  createdAt?: string;
  LastLogin?: string | null;
  lastLogin?: string | null;

  // Trainee info
  TraineeID?: number;
  traineeId?: number;
  TraineeStatus?: string;
  traineeStatus?: string;
  StartDate?: string;
  startDate?: string;
  EndDate?: string;
  endDate?: string;

  // Optional trainee plan
  traineePlanId?: number | null;
  TraineePlanId?: number | null;
}

// =====================
// Trainee Types
// =====================
export interface Trainee {
  id: number;
  userId: number;
  employeeId: string;
  startDate: string;
  endDate: string;
  trainingType?: string | null;
  status: string;
  advisorId?: number | null;
  user?: User | null;
  advisor?: User | null;
  createdAt?: string;
}

// =====================
// Trainee Plan Types
// =====================
export interface Milestone {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  completedDate?: string | null;
  order: number;
  notes?: string | null;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  status: 'on-track' | 'at-risk' | 'completed' | 'behind';
  progress?: number;
}

export interface TraineePlan {
  id: number;
  traineeId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  milestones: Milestone[];
  goals: Goal[];
  createdAt: string;
  updatedAt: string;
  trainee?: Trainee | null;
  advisor?: User | null;
}

export interface CreateTraineePlanData {
  traineeId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  milestones?: Omit<Milestone, 'id'>[];
  goals?: Omit<Goal, 'id'>[];
}

export interface UpdateTraineePlanData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  milestones?: Milestone[];
  goals?: Goal[];
}

// =====================
// Task Types
// =====================
export interface Task {
  id: number;
  title: string;
  description: string;
  traineeId: number;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
  progress?: number;
  lastProgressNote?: string;
  trainee?: Trainee | null;
}

// =====================
// Document Types
// =====================
export interface TraineeDocument {
  id: number;
  traineeId: number;
  fileName: string;
  documentType: 'certificate' | 'report' | 'assessment' | 'other';
  uploadDate: string;
  fileSize: string;
  fileType: string;
  description?: string;
  uploadedBy: number;
  status: 'active' | 'archived';
  version: string;
  lastModified?: string;
  trainee?: Trainee | null;
  uploader?: User | null;
}

export interface DocumentFilters {
  traineeId?: number;
  documentType?: string;
}

// =====================
// Help Request Types
// =====================
export interface HelpRequest {
  id: number;
  taskId: number;
  traineeId: number;
  message: string;
  status: 'pending' | 'resolved';
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: number;
  responseMessage?: string;
  chatSessionId: number | null;
  task?: Task | null;
  trainee?: Trainee | null;
  resolvedByUser?: User | null;
  hasUnreadMessages?: boolean; // ✅ added
  unreadCount?: number;        // ✅ added
}

export interface HelpRequestStats {
  total: number;
  pending: number;
  resolved: number;
  highPriority: number;
}

// =====================
// Chat Types
// =====================
export interface ChatSession {
  id: number;
  traineeId: number;
  advisorId: number;
  status: 'active' | 'closed';
  createdAt: string;
  lastMessageAt: string;
  trainee?: Trainee | null;
  advisor?: User | null;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  messagesCount?: number;
  otherParticipant?: User | null;
}

export interface DirectChatSession {
  id: number;
  participant1Id: number;
  participant2Id: number;
  status: 'active' | 'closed';
  createdAt: string;
  lastMessageAt: string;
  participant1?: User | null;
  participant2?: User | null;
  otherParticipant?: User | null;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  messagesCount?: number;
}

export interface ChatMessage {
  id: number;
  chatSessionId: number;
  senderId: number;
  receiverId: number | null;
  message: string;
  timestamp: string;
  read: boolean;
  messageType: 'text' | 'file';
  sender?: User;
  receiver?: User;
}

// =====================
// API Response Types
// =====================
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: RawUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// =====================
// Form Data Types
// =====================
export interface CreateTraineeData {
  userId: number;
  employeeId: string;
  startDate: string;
  endDate: string;
  trainingType: string;
  advisorId?: number;
}

export interface UpdateTraineeData {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  trainingType?: string;
  status?: string;
  advisorId?: number;
}

export interface CreateTaskData {
  title: string;
  description: string;
  traineeId: number;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
}
