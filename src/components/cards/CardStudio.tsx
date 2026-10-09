'use client';
import { Film, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar2D, type AvatarPose } from '@/components/avatar/Avatar2D';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { CARD_H, CARD_W, canvasToBlob, recordVideo, shareOrDownload, svgToImage, videoMimeType } from '@/lib/cards/render';
import type { AvatarConfiguration } from '@/lib/domain/types';

/**
 * Prévia e exportação de um cartão (imagem PNG e vídeo curto quando o navegador permite).
 * `draw` recebe o contexto, o avatar já convertido em imagem e o progresso da animação.
 */
export function CardStudio({
  avatar,
  pose = 'walk',
  draw,
  filename,
  title,
  deps,
}: {
  avatar: AvatarConfiguration;
  pose?: AvatarPose;
  draw: (ctx: CanvasRenderingContext2D, avatarImg: HTMLImageElement | null, t: number) => void;
  filename: string;
  title: string;
  deps: unknown[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const svgHost = useRef<HTMLDivElement>(null);
  const avatarImg = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<null | 'video' | 'image'>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [canVideo, setCanVideo] = useState(false);

  useEffect(() => setCanVideo(Boolean(videoMimeType()) && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const svg = svgHost.current?.querySelector('svg');
      avatarImg.current = svg ? await svgToImage(svg).catch(() => null) : null;
      await document.fonts?.ready;
      const ctx = canvas.current?.getContext('2d');
      if (cancelled || !ctx) return;
      draw(ctx, avatarImg.current, 1);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  async function image() {
    if (!canvas.current) return;
    setBusy('image');
    try {
      const r = await shareOrDownload(await canvasToBlob(canvas.current), `${filename}.png`, title);
      setMsg(r === 'shared' ? 'Imagem compartilhada.' : 'Imagem salva no aparelho.');
    } finally {
      setBusy(null);
    }
  }

  async function video() {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    setBusy('video');
    setMsg('Gravando o vídeo (6 segundos)…');
    try {
      const blob = await recordVideo(c, (t) => draw(ctx, avatarImg.current, t));
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const r = await shareOrDownload(blob, `${filename}.${ext}`, title);
      setMsg(r === 'shared' ? 'Vídeo compartilhado.' : `Vídeo salvo no aparelho (${ext.toUpperCase()}).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível gravar o vídeo.');
    } finally {
      draw(ctx, avatarImg.current, 1);
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={svgHost} className="hidden" aria-hidden>
        <Avatar2D config={avatar} size={200} pose={pose} />
      </div>
      {!ready && <LoadingState label="Desenhando o cartão" rows={1} />}
      <canvas
        ref={canvas}
        width={CARD_W}
        height={CARD_H}
        className={`w-full rounded-2xl border border-line shadow-sm ${ready ? '' : 'hidden'}`}
        role="img"
        aria-label={title}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={image} disabled={!ready || !!busy} icon={<Share2 aria-hidden size={18} />}>
          {busy === 'image' ? 'Gerando…' : 'Imagem'}
        </Button>
        <Button variant="outline" onClick={video} disabled={!ready || !!busy || !canVideo} icon={<Film aria-hidden size={18} />}>
          {busy === 'video' ? 'Gravando…' : 'Vídeo curto'}
        </Button>
      </div>
      {!canVideo && <p className="text-xs text-muted">Este navegador não grava vídeo. A imagem funciona em todos.</p>}
      {msg && <p role="status" className="text-sm font-semibold text-primary">{msg}</p>}
      <p className="text-xs text-muted">O cartão é criado no seu aparelho. Nada é enviado aos nossos servidores.</p>
    </div>
  );
}
