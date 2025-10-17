import axios from 'axios';
import {
  User,
  Trainee,
  Task,
  TraineeDocument,
  AuthResponse,
  CreateTraineeData,
  UpdateTraineeData,
  CreateTaskData,
  UpdateTaskData,
  HelpRequest,
  ChatMessage,
  ChatSession,
  DirectChatSession,
  DocumentFilters,
  TraineePlan,
  Milestone,
  CreateTraineePlanData,
  UpdateTraineePlanData,
  HelpRequestStats,
} from '../types';

// ✅ Automatically detect or fallback to local backend
const resolveApiBaseUrl = (): string => {
  const candidates = [
    process.env.REACT_APP_API_BASE_URL,
    process.env.REACT_APP_API_URL,
    process.env.REACT_APP_BACKEND_URL,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  const rawBase = (candidates[0] ?? 'http://localhost:5000/api').trim();
  const clean = rawBase.replace(/\/+$/, '');
  return /\/api$/i.test(clean) ? clean : `${clean}/api`;
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle unauthorized (401) errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

//
// ────────────────────────────────
//  API ENDPOINTS
// ────────────────────────────────
//

// 🔹 Auth
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    }),
};

// 🔹 Trainee Plans
export const traineePlansAPI = {
  getByTraineeId: (traineeId: number) =>
    api.get<{ success: boolean; data: TraineePlan }>(`/trainee-plans/${traineeId}`),

  create: (planData: CreateTraineePlanData) =>
    api.post<{ success: boolean; data: TraineePlan }>('/trainee-plans', planData),

  update: (planId: number, updates: UpdateTraineePlanData) =>
    api.put<{ success: boolean; data: TraineePlan }>(`/trainee-plans/${planId}`, updates),

  updateMilestone: (planId: number, milestoneId: number, updates: { status: string; notes?: string }) =>
    api.put<{ success: boolean; data: Milestone }>(
      `/trainee-plans/${planId}/milestones/${milestoneId}`,
      updates
    ),
};

// 🔹 Trainees
export const traineesAPI = {
  getAll: () => api.get<{ success: boolean; data: Trainee[] }>('/trainees'),
  getById: (id: number) => api.get<{ success: boolean; data: Trainee }>(`/trainees/${id}`),
  create: (data: CreateTraineeData) =>
    api.post<{ success: boolean; data: Trainee }>('/trainees', data),
  update: (id: number, data: UpdateTraineeData) =>
    api.put<{ success: boolean; data: Trainee }>(`/trainees/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean; message: string }>(`/trainees/${id}`),
};

// 🔹 Documents
export const documentsAPI = {
  getAll: (filters?: DocumentFilters) =>
    api.get<{ success: boolean; data: TraineeDocument[] }>(
      `/documents${filters ? `?${new URLSearchParams(filters as any)}` : ''}`
    ),
  getById: (id: number) =>
    api.get<{ success: boolean; data: TraineeDocument }>(`/documents/${id}`),
  create: (data: {
    fileName: string;
    fileSize?: string;
    fileType?: string;
    documentType?: string;
    traineeId: number;
    description?: string;
  }) =>
    api.post<{ success: boolean; data: TraineeDocument; message: string }>(
      '/documents',
      data
    ),
  update: (id: number, updates: Partial<TraineeDocument>) =>
    api.put<{ success: boolean; data: TraineeDocument; message: string }>(
      `/documents/${id}`,
      updates
    ),
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/documents/${id}`),
  getStats: () => api.get<{ success: boolean; data: any }>('/documents/stats'),
};

// 🔹 Users
export const usersAPI = {
  getAll: () => api.get<{ success: boolean; data: User[] }>('/users'),
};

// 🔹 Tasks
export const tasksAPI = {
  getAll: () => api.get<{ success: boolean; data: Task[] }>('/tasks'),
  create: (data: CreateTaskData) =>
    api.post<{ success: boolean; data: Task }>('/tasks', data),
  update: (id: number, data: UpdateTaskData) =>
    api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data),
  delete: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/tasks/${id}`),
  updateProgress: (taskId: number, progress: number, notes?: string) =>
    api.post<{ success: boolean; data: Task }>(`/tasks/${taskId}/progress`, {
      progress,
      notes,
    }),
  requestHelp: (taskId: number, message: string, options?: { urgency?: string }) =>
    api.post<{ success: boolean; data: HelpRequest }>(
      `/tasks/${taskId}/help-request`,
      { message, ...options }
    ),
  getHelpRequests: (taskId?: number) =>
    api.get<{ success: boolean; data: HelpRequest[] }>(
      `/help-requests${taskId ? `?taskId=${taskId}` : ''}`
    ),
  resolveHelpRequest: (requestId: number, responseMessage?: string) =>
    api.put<{ success: boolean; data: HelpRequest }>(
      `/help-requests/${requestId}/resolve`,
      { responseMessage }
    ),
  getHelpRequestStats: () =>
    api.get<{ success: boolean; data: HelpRequestStats }>('/help-requests/stats'),
};

// 🔹 Chat
export const chatAPI = {
  getAvailableUsers: () =>
    api.get<{ success: boolean; data: User[] }>('/chat/available-users'),

  getOrCreateDirectSession: (otherUserId: number) =>
    api.get<{ success: boolean; data: DirectChatSession }>(
      `/chat/direct/${otherUserId}`
    ),

  getDirectSessions: () =>
    api.get<{ success: boolean; data: DirectChatSession[] }>(
      '/chat/direct-sessions'
    ),

  getMessages: (sessionId: number) =>
    api.get<{ success: boolean; data: ChatMessage[] }>(
      `/chat/session/${sessionId}/messages`
    ),

  sendMessage: (sessionId: number, message: string) =>
    api.post<{ success: boolean; data: ChatMessage }>(
      `/chat/session/${sessionId}/messages`,
      { message }
    ),

  markAsRead: (sessionId: number) =>
    api.put<{ success: boolean; message: string }>(
      `/chat/session/${sessionId}/mark-read`
    ),

  getAdvisors: () =>
    api.get<{ success: boolean; data: User[] }>('/chat/advisors'),

  getOrCreateSession: (advisorId: number, traineeId?: number) =>
    api.get<{ success: boolean; data: ChatSession }>(
      `/chat/session/${advisorId}${traineeId ? `?traineeId=${traineeId}` : ''}`
    ),

  getSessions: () =>
    api.get<{ success: boolean; data: (ChatSession | DirectChatSession)[] }>(
      '/chat/sessions'
    ),

  closeSession: (sessionId: number) =>
    api.put<{ success: boolean; data: ChatSession; message: string }>(
      `/chat/session/${sessionId}/close`
    ),
};

export default api;
