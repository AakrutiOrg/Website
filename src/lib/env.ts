export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  };
}

export function getSupabaseServiceEnv() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    ...getSupabaseEnv(),
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  };
}

export function getResendEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing environment variable: RESEND_API_KEY");
  }

  if (!fromEmail) {
    throw new Error("Missing environment variable: RESEND_FROM_EMAIL");
  }

  return {
    RESEND_API_KEY: apiKey,
    RESEND_FROM_EMAIL: fromEmail,
  };
}
