// Status & Priority union types
export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Recurrence
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceSchedule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  nextDueDate?: string;
}

// Category (first-class entity, 1..* relationship with Task)
export interface Category {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

// Task (full interface)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  // Soft delete
  isDeleted: boolean;
  deletedAt: string | null;

  // Category relationship (Category 1..* Task)
  categoryId: string | null;

  // Task dependency (parentTaskId)
  parentTaskId: string | null;

  // Recurring tasks
  isRecurring: boolean;
  recurrence: RecurrenceSchedule | null;
  recurringSourceId: string | null;
}

// Priority as first-class type — order and label maps
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Status constants
export const STATUS_ORDER: Record<TaskStatus, number> = {
  pending: 0,
  'in-progress': 1,
  done: 2,
  cancelled: 3,
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

// Filter state
export interface TaskFilterState {
  status: TaskStatus | 'all';
  priority: TaskPriority | null;
  tag: string | null;
  categoryId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
}

// Sort state
export type SortField = 'default' | 'title' | 'priority' | 'dueDate' | 'createdAt' | 'status' | 'category';

export interface SortState {
  field: SortField;
  direction: 'asc' | 'desc';
}

// Statistics
export interface TaskStatistics {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdueCount: number;
  completionRate: number;
  tasksByCategory: Record<string, number>;
  totalActive: number;
}

// Storage info
export interface StorageInfo {
  type: 'IndexedDB' | 'localStorage';
  dbName: string;
  storeName: string;
}
