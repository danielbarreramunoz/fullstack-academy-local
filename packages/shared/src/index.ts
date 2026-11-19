import { z } from "zod";

// --- Capabilities granulares (fuente de verdad, importada por API y web) ---
export const CAPABILITIES = [
  "lessons:read",
  "progress:read",
  "progress:write",
  "curriculum:edit",
  "audit:read",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

// Roles demo -> capabilities iniciales
export const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  student: ["lessons:read", "progress:read", "progress:write"],
  mentor: ["lessons:read", "progress:read", "audit:read"],
  admin: ["lessons:read", "progress:read", "progress:write", "curriculum:edit", "audit:read"],
};

export type Role = keyof typeof ROLE_CAPABILITIES;
export type ProgressStatus = "pending" | "in_progress" | "completed";

// --- DTOs compartidos (validación estricta, sin campos extra) ---
export const loginSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
  })
  .strict();

export const updateProgressSchema = z
  .object({
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
    notes_md: z.string().max(20000).optional(),
  })
  .strict()
  .refine((v) => v.status !== undefined || v.notes_md !== undefined, {
    message: "status o notes_md requerido",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// --- Tipos de lectura (nunca incluyen password_hash) ---
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  description: string | null;
}

export interface Lesson {
  id: string;
  track_id: string;
  order_index: number;
  title: string;
  summary: string;
  theory_md: string;
  lab_prompt: string;
  checklist_json: { items: string[] };
  estimated_minutes: number;
}

export interface UserProgress {
  id: string;
  lesson_id: string;
  status: ProgressStatus;
  notes_md: string | null;
  next_review_at: string | null;
  completed_at: string | null;
}
