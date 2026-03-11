function getEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
