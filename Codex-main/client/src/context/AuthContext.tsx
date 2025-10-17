import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { RawUser, User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔹 Normalize user data from API or storage
const normalizeUser = (data: RawUser | User | null | undefined): User => {
  if (!data) throw new Error('Missing user data');

  const id =
    (data as any).id ??
    (data as any).UserID ??
    (data as any).userId ??
    (data as any).UserId;

  const email =
    (data as any).email ??
    (data as any).Email ??
    null;

  const rawName =
    (data as any).name ??
    (data as any).FullName ??
    (data as any).fullName ??
    email;

  const rawRole =
    (data as any).role ??
    (data as any).Role ??
    'trainee';

  const role = (typeof rawRole === 'string' ? rawRole.toLowerCase() : 'trainee') as User['role'];

  return {
    id: Number(id),
    email: email || '',
    name: rawName || email || 'Unknown User',
    role,
    department: (data as any).department ?? (data as any).Department ?? null,
    phoneNumber: (data as any).phoneNumber ?? (data as any).PhoneNumber ?? null,
    createdAt: (data as any).createdAt ?? (data as any).CreatedAt ?? null,
    lastLogin: (data as any).lastLogin ?? (data as any).LastLogin ?? null,
    isActive: (data as any).isActive ?? (data as any).IsActive ?? true,
    traineeId: (data as any).traineeId ?? (data as any).TraineeID ?? null,
    traineeStatus:
      typeof ((data as any).traineeStatus ?? (data as any).TraineeStatus) === 'string'
        ? ((data as any).traineeStatus ?? (data as any).TraineeStatus)?.toLowerCase()
        : (data as any).traineeStatus ?? null,
    startDate: (data as any).startDate ?? (data as any).StartDate ?? null,
    endDate: (data as any).endDate ?? (data as any).EndDate ?? null,
    traineePlanId:
      (data as any).traineePlanId ?? (data as any).TraineePlanId ?? null,
    isOnline: (data as any).isOnline ?? undefined,
    lastSeen: (data as any).lastSeen ?? null,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load stored token + user on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData) as RawUser | User;
        setUser(normalizeUser(parsed));
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // 🔹 Login function (returns true/false)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        const normalizedUser = normalizeUser(userData);

        // Save credentials
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        setUser(normalizedUser);
        return true; // ✅ Login successful
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Login failed';
      console.error('Login error:', msg);
      throw new Error(msg);
    }
  };

  // 🔹 Logout (clears session)
  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
