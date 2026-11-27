import { createClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "j4umarketplace@gmail.com";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function garantirConfiguracaoSupabase() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project") ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon-key")
  ) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (e na Vercel)."
    );
  }
}

export function extrairColunaAusenteNoSchema(err: unknown): string | null {
  const msg =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  const matchPgrst = msg.match(/Could not find the '([^']+)' column/i);
  if (matchPgrst?.[1]) return matchPgrst[1];

  const matchPg = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of relation/i);
  if (matchPg?.[1]) return matchPg[1];

  return null;
}

export function isErroColunaOuTabelaAusente(err: unknown): boolean {
  const codigo =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  const msg =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  return (
    ["PGRST204", "PGRST205", "42703", "42P01"].includes(codigo) ||
    /could not find the .* column|does not exist/i.test(msg)
  );
}
