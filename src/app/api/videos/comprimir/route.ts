import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const VIDEO_PADRAO_REGEX = /^video\d{4}\.mp4$/i;

function localizarPastaVideos(): string | null {
  const candidatos = [
    path.join(process.cwd(), 'public', 'videos'),
    path.join(process.cwd(), 'videos'),
    path.resolve(process.cwd(), '..', 'videos'),
  ];

  for (const pasta of candidatos) {
    if (fs.existsSync(pasta) && fs.statSync(pasta).isDirectory()) {
      return pasta;
    }
  }
  return null;
}

async function comprimirComFfmpeg(origem: string, destino: string): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      origem,
      '-vf',
      'scale=-2:720',
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'veryfast',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-movflags',
      '+faststart',
      destino,
    ]);
    return fs.existsSync(destino) && fs.statSync(destino).size > 0;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const arquivoParam = (req.nextUrl.searchParams.get('arquivo') || '').trim();
  const nomeArquivo = path.basename(arquivoParam).toLowerCase();

  if (!VIDEO_PADRAO_REGEX.test(nomeArquivo)) {
    return NextResponse.json(
      { error: 'Nome de vídeo inválido. Use o padrão video0001.mp4.' },
      { status: 400 }
    );
  }

  const pastaVideos = localizarPastaVideos();
  if (!pastaVideos) {
    return NextResponse.json(
      { error: 'Pasta de vídeos não encontrada no servidor.' },
      { status: 404 }
    );
  }

  const arquivoOrigem = path.join(pastaVideos, nomeArquivo);
  if (!fs.existsSync(arquivoOrigem)) {
    return NextResponse.json(
      { error: `Arquivo ${nomeArquivo} não encontrado na pasta videos.` },
      { status: 404 }
    );
  }

  const statOrigem = fs.statSync(arquivoOrigem);
  const pastaCache = path.join(os.tmpdir(), 'j4u-videos-comprimidos');
  fs.mkdirSync(pastaCache, { recursive: true });

  const arquivoComprimido = path.join(
    pastaCache,
    `${statOrigem.size}_${statOrigem.mtimeMs}_${nomeArquivo}`
  );

  let arquivoParaServir = arquivoOrigem;

  if (fs.existsSync(arquivoComprimido)) {
    arquivoParaServir = arquivoComprimido;
  } else {
    const comprimiu = await comprimirComFfmpeg(arquivoOrigem, arquivoComprimido);
    if (comprimiu) {
      arquivoParaServir = arquivoComprimido;
    }
  }

  const statFinal = fs.statSync(arquivoParaServir);
  const totalSize = statFinal.size;
  const rangeHeader = req.headers.get('range');

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${totalSize}`,
        },
      });
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(arquivoParaServir, { start, end });
    const webStream = stream as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const stream = fs.createReadStream(arquivoParaServir);
  const webStream = stream as unknown as ReadableStream;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Length': String(totalSize),
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
