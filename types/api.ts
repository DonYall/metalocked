// types/api.ts
export type Frequency = "daily" | "weekly" | "none";

export interface TaskDTO {
  id: string;
  title: string;
  frequency: Frequency;
  is_active: boolean;
  created_at: string;
}

export interface CompleteTaskRequest {
  taskId: string;
  completedAt?: string;
}

export interface CompleteTaskResponse {
  completionId: string;
  repAwarded: number;
  streakAfter: number;
}
