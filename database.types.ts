// Hand-written to match supabase/migrations/0001_init.sql.
// If you change the schema, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

import type { Pack } from "@/lib/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Track =
  | "marketing"
  | "consulting"
  | "product"
  | "analytics"
  | "sales"
  | "general_management";

export type PackStatus = "in_progress" | "interview_ready";

export type PrepPackRow = {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  track: Track;
  jd_text: string;
  resume_text: string;
  pack: Pack;
  practiced: Record<string, boolean>;
  notes: Record<string, string>;
  status: PackStatus;
  created_at: string;
  updated_at: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      prep_packs: {
        Row: PrepPackRow;
        Insert: Partial<PrepPackRow> &
          Pick<
            PrepPackRow,
            "user_id" | "title" | "track" | "jd_text" | "resume_text" | "pack"
          >;
        Update: Partial<PrepPackRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generations_today_count: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
