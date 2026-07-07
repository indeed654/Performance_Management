export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  departmentId?: number;
  managerId?: number;
  designation?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  address?: string;
  skills?: string[];
  education?: any[];
  emergencyContact?: any;
  isActive: boolean;
  lastLogin?: string;
  department?: { id: number; name: string };
  manager?: Partial<User>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PagedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
