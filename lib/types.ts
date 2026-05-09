export type UserRole = "admin" | "student";

export type MuxStatus = "waiting" | "preparing" | "ready" | "errored";

export type MaterialPosition = "before" | "after";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  mux_asset_id: string | null;
  mux_playback_id: string | null;
  mux_upload_id: string | null;
  mux_status: MuxStatus;
  material_storage_path: string | null;
  material_display_position: MaterialPosition;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  last_position_seconds: number;
  updated_at: string;
}

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      courses: {
        Row: Course;
        Insert: Partial<Course> & { title: string };
        Update: Partial<Course>;
        Relationships: [];
      };
      lessons: {
        Row: Lesson;
        Insert: Partial<Lesson> & { course_id: string; title: string };
        Update: Partial<Lesson>;
        Relationships: [];
      };
      enrollments: {
        Row: Enrollment;
        Insert: Partial<Enrollment> & { user_id: string; course_id: string };
        Update: Partial<Enrollment>;
        Relationships: [];
      };
      lesson_progress: {
        Row: LessonProgress;
        Insert: Partial<LessonProgress> & { user_id: string; lesson_id: string };
        Update: Partial<LessonProgress>;
        Relationships: [];
      };
    };
    Views: { [k: string]: never };
    Functions: { [k: string]: never };
    Enums: { [k: string]: never };
    CompositeTypes: { [k: string]: never };
  };
}

// Explicitly mark Json as exported for downstream use, even if currently unused.
export type { Json };
