const VIDEO_PADRAO_REGEX = /^video\d{4}\.mp4$/i;

export function normalizarNomeVideo(valor?: string | null): string {
  if (!valor) return '';
  let limpo = valor.trim().replace(/\\/g, '/');

  // Se vier um caminho como /video/video0001.mp4 ou public/video/video0001.mp4
  if (limpo.includes('/')) {
    const partes = limpo.split('/').filter(Boolean);
    limpo = partes[partes.length - 1] || '';
  }

  return limpo;
}

export function ehNomeVideoValido(valor?: string | null): boolean {
  const nome = normalizarNomeVideo(valor);
  return VIDEO_PADRAO_REGEX.test(nome);
}

export function resolverUrlVideo(valor?: string | null): string {
  if (!valor) return '';
  const bruto = valor.trim();
  if (!bruto) return '';

  const nomeArquivo = normalizarNomeVideo(bruto);
  if (VIDEO_PADRAO_REGEX.test(nomeArquivo)) {
    return `/video/${nomeArquivo.toLowerCase()}`;
  }

  return bruto;
}
