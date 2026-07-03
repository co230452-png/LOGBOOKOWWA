export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  owwaId: string;
  address: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: User | string;
  date: string;
  timestamp: string;
  scannedBy?: User | string | null;
  notes?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  todayAttendance: number;
  totalAttendance: number;
}

export interface ScanResult {
  success: boolean;
  message: string;
  user?: Partial<User>;
  alreadyLogged?: boolean;
}
