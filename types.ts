
export enum UserRole {
  ADMIN = 'Admin',
  COUNSELOR = 'Counselor'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
}

export interface Lead {
  id: string;
  timestamp: string;
  studentName: string;
  phone: string;
  email: string;
  source: string;
  course: string;
  city: string;
  assignedCounselor: string;
  status: string;
  lastRemark: string;
  nextFollowupDate: string | null;
  conversionDate: string | null;
  createdBy: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  followupsDue: number;
  converted: number;
  dead: number;
  conversionRate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
