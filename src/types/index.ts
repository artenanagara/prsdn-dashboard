// Data Models for PRSDN Dashboard

export interface Member {
  id: string;
  fullName: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  rt: '01' | '02' | '03' | '04';
  phone: string;
  instagram: string;
  job: string;
  grade?: string; // For Pelajar
  university?: string; // For Mahasiswa
  joinedWhatsApp?: boolean;
  educationStatus: 'school' | 'not_school';
  educationLevel?: 'SD' | 'SMP' | 'SMA/SMK' | 'College';
  createdAt: string;
}

export interface AccountApplication {
  id: string;
  step1Data: Omit<Member, 'id' | 'createdAt'>;
  username: string;
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
}

export interface UserAccount {
  id: string;
  memberId: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  attendeeMemberIds: string[];
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface KasPayment {
  id: string;
  monthKey: string; // YYYY-MM
  year: number;
  memberId: string;
  amount: number;
  paidAt?: string; // YYYY-MM-DD
  status: 'paid' | 'unpaid';
}

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'event' | 'program' | 'birthday' | 'holiday';
  description?: string;
}

export interface AttendanceEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  isActive: boolean;
  token: string; // 6 characters
  tokenExpiresAt: number; // epoch ms
  createdAt: number;
  createdByAdminId: string;
}

export interface AttendanceCheckin {
  id: string;
  eventId: string;
  memberId: string;
  checkedInAt: number;
  tokenUsed: string;
}

export interface Session {
  userId: string;
  role: 'admin' | 'user';
  username: string;
  memberId?: string;
}

export interface Database {
  members: Member[];
  accountApplications: AccountApplication[];
  userAccounts: UserAccount[];
  attendanceRecords: AttendanceRecord[];
  financeTransactions: FinanceTransaction[];
  kasPayments: KasPayment[];
  events: Event[];
  attendanceEvents: AttendanceEvent[];
  attendanceCheckins: AttendanceCheckin[];
}
