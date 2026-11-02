import type { Tables } from "@/lib/supabase/types";

export type Profile = Tables<"profiles">;
export type Fund = Tables<"funds">;
export type Bucket = Tables<"buckets">;
export type PlannedItem = Tables<"planned_items">;
