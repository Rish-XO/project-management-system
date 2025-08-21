// TypeScript interfaces matching our GraphQL schema

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  organization: Organization;
  taskCount: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeEmail: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
  isOverdue: boolean;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  content: string;
  authorEmail: string;
  timestamp: string;
  task?: Task;
}

export interface ProjectStatistics {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionPercentage: number;
}

// Mutation Response Types
export interface MutationResponse<T> {
  success: boolean;
  errors?: string[];
  data?: T;
}

export interface CreateOrganizationResponse {
  organization?: Organization;
  success: boolean;
  errors?: string[];
}

export interface CreateProjectResponse {
  project?: Project;
  success: boolean;
  errors?: string[];
}

export interface CreateTaskResponse {
  task?: Task;
  success: boolean;
  errors?: string[];
}

export interface AddTaskCommentResponse {
  comment?: TaskComment;
  success: boolean;
  errors?: string[];
}