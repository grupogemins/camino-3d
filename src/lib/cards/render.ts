/**
 * Cartões compartilháveis desenhados em <canvas> no próprio aparelho (nada é enviado ao servidor).
 * Formato 1080×1350 (retrato, bom para Instagram, WhatsApp e YouTube Shorts com bordas).
 * `t` (0–1) anima a cena para o vídeo curto; t = 1 é a imagem final.
 */
import type { LngLat } from '@/lib/domain/types';

export const CARD_W = 1080;
export const CARD_H = 1350;

const INK = '#1c2420';
const MUTED = '#545d57';
const STONE = '#f5f1e8';
const GREEN = '#2f5d3a';
const GOLD = '#d4a017';
const TERRACOTTA = '#a8492a';
let fontCache: string | null = null;
/** Mesma fonte do app (o next/font gera um nome de família próprio). */
function fontFamily(): string {
  if (!fontCache) fontCache = typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif' : 'system-ui, sans-serif';
  return fontCache;
}

export interface StageCardData {
  routeName: string;
  day: number;
  from: string;
  to: string;
  date: string;
  distanceKm: number;
  ascentM: number;
  hours: number;
  souvenir: string;
  achievements: string[];
  next?: string;
  photo?: HTMLImageElement | null;
  avatar?: HTMLImageElement | null;
  region: string;
  watermark: boolean;
}

export interface RetroCardData {
  name: string;
  routeName: string;
  startDate: string;
  endDate: string;
  walkedKm: number;
  ascentM: number;
  days: number;
  cities: string[];
  souvenirs: number;
  line: LngLat[];
  reachedIndex: number;
  photos: HTMLImageElement[];
  avatar?: HTMLImageElement | null;
  watermark: boolean;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Converte um <svg> do DOM (ex.: Avatar2D) em imagem para o canvas. */
export async function svgToImage(svg: SVGSVGElement, size = 600): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  const xml = new XMLSerializer().serializeToString(clone);
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`);
}

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const phase = (t: number, a: number, b: number) => ease((t - a) / (b - a));

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight = 800) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${fontFamily()}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxW && s > 20);
}

function scenery(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, region: string, t: number) {
  const coastal = region === 'rias_baixas' || region === 'porto';
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#f3d9ae');
  g.addColorStop(1, '#f7ead2');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // sol
  ctx.fillStyle = 'rgba(212,160,23,0.85)';
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * (0.42 - 0.12 * ease(t)), 70, 0, Math.PI * 2);
  ctx.fill();
  // colinas
  const hills: [string, number, number][] = [
    ['#a9bb8f', 0.55, 0.12],
    ['#8fa77a', 0.65, 0.16],
    ['#6f8f5a', 0.78, 0.2],
  ];
  for (const [color, base, amp] of hills) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    for (let i = 0; i <= 20; i++) {
      const px = x + (w * i) / 20;
      ctx.lineTo(px, y + h * base - Math.sin(i * 0.7 + base * 9) * h * amp * 0.5);
    }
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
  if (coastal) {
    ctx.fillStyle = '#3d7fa6';
    ctx.fillRect(x, y + h * 0.6, w * 0.22, h * 0.4);
  }
  // trilha
  ctx.strokeStyle = '#cfae80';
  ctx.lineWidth = 46;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h + 20);
  ctx.bezierCurveTo(x + w * 0.45, y + h * 0.85, x + w * 0.4, y + h * 0.72, x + w * 0.62, y + h * 0.62);
  ctx.stroke();
  // seta amarela (sinal do Caminho)
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.83, y + h * 0.8);
  ctx.lineTo(x + w * 0.9, y + h * 0.83);
  ctx.lineTo(x + w * 0.83, y + h * 0.86);
  ctx.closePath();
  ctx.fill();
}

function footer(ctx: CanvasRenderingContext2D, watermark: boolean) {
  ctx.fillStyle = GREEN;
  ctx.font = `800 34px ${fontFamily()}`;
  ctx.textAlign = 'left';
  ctx.fillText('Camino 3D', 72, CARD_H - 60);
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${fontFamily()}`;
  ctx.textAlign = 'right';
  ctx.fillText(watermark ? 'Criado na versão gratuita' : 'Bom Caminho!', CARD_W - 72, CARD_H - 60);
  ctx.textAlign = 'left';
  if (watermark) {
    ctx.save();
    ctx.translate(CARD_W / 2, CARD_H / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.fillStyle = 'rgba(28,36,32,0.07)';
    ctx.font = `800 120px ${fontFamily()}`;
    ctx.textAlign = 'center';
    ctx.fillText('CAMINO 3D', 0, 0);
    ctx.restore();
  }
}

function stat(ctx: CanvasRenderingContext2D, x: number, y: number, value: string, label: string) {
  ctx.fillStyle = INK;
  ctx.font = `800 64px ${fontFamily()}`;
  ctx.fillText(value, x, y);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${fontFamily()}`;
  ctx.fillText(label, x, y + 40);
}

export function drawStageCard(ctx: CanvasRenderingContext2D, d: StageCardData, t = 1) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = STONE;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // imagem principal: foto do usuário ou cena ilustrada
  const imgY = 0;
  const imgH = 720;
  ctx.save();
  rounded(ctx, 0, imgY, CARD_W, imgH, 0);
  ctx.clip();
  if (d.photo) cover(ctx, d.photo, 0, imgY, CARD_W, imgH);
  else scenery(ctx, 0, imgY, CARD_W, imgH, d.region, t);
  ctx.restore();

  // peregrino entrando em cena
  if (d.avatar) {
    const size = d.photo ? 300 : 460;
    const ax = -size + (size + 90) * phase(t, 0, 0.5);
    ctx.drawImage(d.avatar, ax, imgH - size + (d.photo ? 40 : 30), size, size);
  }

  // faixa do dia
  ctx.fillStyle = GREEN;
  rounded(ctx, 72, 60, 300, 70, 35);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 34px ${fontFamily()}`;
  ctx.fillText(`DIA ${d.day}`, 100, 108);

  const a = phase(t, 0.25, 0.65);
  ctx.globalAlpha = a;
  ctx.fillStyle = MUTED;
  ctx.font = `600 30px ${fontFamily()}`;
  ctx.fillText(`${d.routeName} · ${d.date}`.toUpperCase(), 72, 790);
  ctx.fillStyle = INK;
  fitText(ctx, `${d.from} → ${d.to}`, CARD_W - 144, 70);
  ctx.fillText(`${d.from} → ${d.to}`, 72, 870);

  const k = phase(t, 0.35, 0.8);
  stat(ctx, 72, 980, `${Math.round(d.distanceKm * k)} km`, 'caminhados');
  stat(ctx, 420, 980, `+${Math.round(d.ascentM * k)} m`, 'de subida');
  stat(ctx, 760, 980, `${(d.hours * k).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`, 'estimadas');

  ctx.globalAlpha = phase(t, 0.55, 0.95);
  ctx.fillStyle = '#fbf1d3';
  rounded(ctx, 72, 1060, CARD_W - 144, 84, 24);
  ctx.fill();
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `700 32px ${fontFamily()}`;
  ctx.fillText(`Lembrança: ${d.souvenir}`, 100, 1114);
  ctx.fillStyle = MUTED;
  ctx.font = `400 30px ${fontFamily()}`;
  const extra = [d.achievements.length ? `Conquistas: ${d.achievements.join(', ')}` : '', d.next ? `Amanhã: ${d.next}` : 'Chegada!'].filter(Boolean);
  extra.forEach((line, i) => ctx.fillText(line.length > 58 ? `${line.slice(0, 57)}…` : line, 72, 1195 + i * 42));
  ctx.globalAlpha = 1;
  footer(ctx, d.watermark);
}

/** Linha da rota projetada num retângulo, desenhada até a fração `upTo`. */
function routeLine(ctx: CanvasRenderingContext2D, line: LngLat[], x: number, y: number, w: number, h: number, reachedIndex: number, upTo: number) {
  if (line.length < 2) return;
  const lngs = line.map((p) => p[0]);
  const lats = line.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const s = Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1));
  const ox = x + (w - (maxX - minX) * s) / 2;
  const oy = y + (h - (maxY - minY) * s) / 2;
  const px = (p: LngLat) => [ox + (p[0] - minX) * s, oy + (maxY - p[1]) * s] as const;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(47,93,58,0.25)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  line.forEach((p, i) => (i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))));
  ctx.stroke();
  const n = Math.max(1, Math.round(reachedIndex * upTo));
  ctx.strokeStyle = GREEN;
  ctx.beginPath();
  line.slice(0, n + 1).forEach((p, i) => (i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))));
  ctx.stroke();
  const [ex, ey] = px(line[Math.min(n, line.length - 1)]);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(ex, ey, 18, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRetroCard(ctx: CanvasRenderingContext2D, d: RetroCardData, t = 1) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = STONE;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = MUTED;
  ctx.font = `600 30px ${fontFamily()}`;
  ctx.fillText(`${d.routeName} · ${d.startDate} a ${d.endDate}`.toUpperCase(), 72, 110);
  ctx.fillStyle = INK;
  fitText(ctx, `O Caminho de ${d.name}`, CARD_W - 144, 76);
  ctx.fillText(`O Caminho de ${d.name}`, 72, 195);

  // mapa da jornada à esquerda, fotos/peregrino à direita
  ctx.fillStyle = '#fff';
  rounded(ctx, 72, 250, 470, 640, 32);
  ctx.fill();
  routeLine(ctx, d.line, 102, 280, 410, 580, d.reachedIndex, phase(t, 0, 0.7));

  const right = 572;
  if (d.photos.length) {
    const cell = (CARD_W - right - 72 - 16) / 2;
    d.photos.slice(0, 4).forEach((p, i) => {
      ctx.save();
      ctx.globalAlpha = phase(t, 0.2 + i * 0.1, 0.5 + i * 0.1);
      rounded(ctx, right + (i % 2) * (cell + 16), 250 + Math.floor(i / 2) * (cell + 16), cell, cell, 24);
      ctx.clip();
      cover(ctx, p, right + (i % 2) * (cell + 16), 250 + Math.floor(i / 2) * (cell + 16), cell, cell);
      ctx.restore();
    });
  } else {
    ctx.save();
    rounded(ctx, right, 250, CARD_W - right - 72, 640, 32);
    ctx.clip();
    scenery(ctx, right, 250, CARD_W - right - 72, 640, 'santiago', t);
    ctx.restore();
  }
  if (d.avatar) ctx.drawImage(d.avatar, right + 40, 560, 360, 360);

  const k = phase(t, 0.3, 0.85);
  stat(ctx, 72, 990, `${Math.round(d.walkedKm * k)} km`, 'caminhados');
  stat(ctx, 400, 990, `${d.days}`, d.days === 1 ? 'dia' : 'dias');
  stat(ctx, 620, 990, `+${Math.round(d.ascentM * k).toLocaleString('pt-BR')} m`, 'de subida');

  ctx.globalAlpha = phase(t, 0.6, 1);
  ctx.fillStyle = TERRACOTTA;
  ctx.font = `700 32px ${fontFamily()}`;
  ctx.fillText(`${d.cities.length} ${d.cities.length === 1 ? 'cidade' : 'cidades'} · ${d.souvenirs} ${d.souvenirs === 1 ? 'lembrança' : 'lembranças'}`, 72, 1100);
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${fontFamily()}`;
  const list = d.cities.join(' · ');
  const words = list.split(' ');
  let lineText = '';
  let row = 0;
  for (const w of words) {
    const test = lineText ? `${lineText} ${w}` : w;
    if (ctx.measureText(test).width > CARD_W - 144) {
      ctx.fillText(lineText, 72, 1150 + row * 38);
      lineText = w;
      row++;
      if (row > 2) break;
    } else lineText = test;
  }
  if (row <= 2) ctx.fillText(lineText, 72, 1150 + row * 38);
  ctx.globalAlpha = 1;
  footer(ctx, d.watermark);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/png'));
}

/** Formato de vídeo suportado pelo navegador (MP4 no Safari, WebM no Chrome/Firefox) ou null. */
export function videoMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

/** Grava um vídeo curto animando o desenho de t = 0 a 1 (e segura o quadro final). */
export async function recordVideo(canvas: HTMLCanvasElement, draw: (t: number) => void, seconds = 6): Promise<Blob> {
  const mime = videoMimeType();
  if (!mime) throw new Error('Este navegador não grava vídeo. Baixe a imagem.');
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => (rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] }))));
  rec.start();
  const start = performance.now();
  const total = seconds * 1000;
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / (total * 0.75));
      draw(t);
      if (now - start < total) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
  rec.stop();
  stream.getTracks().forEach((tr) => tr.stop());
  return done;
}

export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch {
      /* cancelado: cai no download */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
