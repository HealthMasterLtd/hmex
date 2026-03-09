export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  riskLevel: 'low' | 'moderate' | 'high' | null;
  riskScore: number | null;
  assessmentCompleted: boolean;
  completionDate: string | null;
  lastActive: string;
  avatar: string | null;
  location: string;
  employeeId: string;
  tenure: string;
}

export type SortBy = 'name' | 'risk' | 'date';
export type SortOrder = 'asc' | 'desc';
export type RiskFilter = 'all' | 'low' | 'moderate' | 'high' | 'pending';
export type StatusFilter = 'all' | 'completed' | 'pending';