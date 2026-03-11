"use client";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

const env = getSupabaseEnv();

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
