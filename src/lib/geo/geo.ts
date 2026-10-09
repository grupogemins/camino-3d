import type { LngLat } from '@/lib/domain/types';

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distância em km entre dois pontos (fórmula de haversine). */
export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Comprimento total de uma linha em km. */
export function lineLengthKm(line: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += haversineKm(line[i - 1], line[i]);
  return total;
}

/** Projeção equiretangular local (suficiente para distâncias curtas < 50 km). */
function toLocalXY(p: LngLat, ref: LngLat): [number, number] {
  const x = toRad(p[0] - ref[0]) * Math.cos(toRad(ref[1])) * EARTH_RADIUS_KM;
  const y = toRad(p[1] - ref[1]) * EARTH_RADIUS_KM;
  return [x, y];
}

export interface LineProjection {
  /** Distância perpendicular do ponto até a linha, em km. */
  distanceKm: number;
  /** Distância percorrida ao longo da linha até o ponto projetado, em km. */
  alongKm: number;
  /** Ponto projetado na linha. */
  point: LngLat;
  segmentIndex: number;
}

/** Projeta um ponto na polilinha: distância até a rota e progresso ao longo dela. */
export function projectOnLine(point: LngLat, line: LngLat[]): LineProjection {
  if (line.length === 0) throw new Error('Linha vazia');
  if (line.length === 1) {
    return { distanceKm: haversineKm(point, line[0]), alongKm: 0, point: line[0], segmentIndex: 0 };
  }
  let best: LineProjection | null = null;
  let walked = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const [bx, by] = toLocalXY(b, a);
    const [px, py] = toLocalXY(point, a);
    const lenSq = bx * bx + by * by;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
    const proj: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const d = haversineKm(point, proj);
    const segLen = haversineKm(a, b);
    if (!best || d < best.distanceKm) {
      best = { distanceKm: d, alongKm: walked + segLen * t, point: proj, segmentIndex: i - 1 };
    }
    walked += segLen;
  }
  return best!;
}

/** Ponto ao longo da linha a `km` do início (limitado às extremidades). */
export function pointAlongLine(line: LngLat[], km: number): LngLat {
  if (km <= 0) return line[0];
  let walked = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = haversineKm(line[i - 1], line[i]);
    if (walked + seg >= km) {
      const t = seg === 0 ? 0 : (km - walked) / seg;
      const a = line[i - 1];
      const b = line[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    walked += seg;
  }
  return line[line.length - 1];
}

/** Rumo (graus, 0 = norte) de a para b. */
export function bearingDeg(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export function bbox(points: LngLat[]): [LngLat, LngLat] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [[minX, minY], [maxX, maxY]];
}
