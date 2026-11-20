export type ProgressStatus = "pending" | "in_progress" | "completed";

export interface Track {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  description: string | null;
  lessons_count: number;
}

export interface Lesson {
  id: string;
  track_id: string;
  order_index: number;
  title: string;
  summary: string;
  theory_md: string;
  lab_prompt: string;
  checklist_json: string[] | { items: string[] } | null;
  estimated_minutes: number;
  my_status?: ProgressStatus | null;
}

export interface ProgressRow {
  id: string;
  user_id?: string;
  lesson_id: string;
  lesson_title?: string;
  track_id?: string;
  status: ProgressStatus;
  notes_md: string | null;
  next_review_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  status_code: number;
  created_at: string;
}

export interface Me {
  id: string;
  email: string;
  role: "student" | "mentor" | "admin";
}

export interface IdorResult {
  allowed: boolean;
  reason: string;
}
