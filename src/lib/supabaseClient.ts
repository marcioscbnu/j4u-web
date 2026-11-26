import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "j4umarketplace@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 0;

const clientUrl = isSupabaseConfigured
  ? supabaseUrl
  : "https://placeholder-project.supabase.co";
const clientKey = isSupabaseConfigured
  ? supabaseAnonKey
  : "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(clientUrl, clientKey);

export function garantirConfiguracaoSupabase(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas no ambiente."
    );
  }
}

export function isErroColunaOuTabelaAusente(
  error: { code?: string; message?: string } | null | undefined,
  termo?: string
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const alvo = (termo ?? "").toLowerCase();

  const erroDeSchema =
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.code === "PGRST200" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    msg.includes("relationship");

  if (!alvo) return erroDeSchema;
  return erroDeSchema && msg.includes(alvo);
}

export function extrairColunaAusenteNoSchema(
  error: { code?: string; message?: string } | null | undefined
): string | null {
  if (!error?.message) return null;
  const msg = error.message;

  const matchPgrst = msg.match(
    /Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i
  );
  if (matchPgrst?.[1]) return matchPgrst[1];

  const matchPg = msg.match(
    /column ['"]?([a-zA-Z0-9_]+)['"]? of relation ['"]?[a-zA-Z0-9_]+['"]? does not exist/i
  );
  if (matchPg?.[1]) return matchPg[1];

  return null;
}
