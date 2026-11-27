// Patch auxiliar para src/lib/supabaseClient.ts
// Garante que helpers esperados por services legados/existentes estejam exportados
// e aceitem argumentos opcionais sem quebrar o TypeScript (TS2554).

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
