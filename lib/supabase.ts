import { createClient } from "@supabase/supabase-js";

const isLoginCallback =
  typeof window !== "undefined" &&
  window.location.pathname === "/login-callback";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      detectSessionInUrl: !isLoginCallback,
    },
  }
);