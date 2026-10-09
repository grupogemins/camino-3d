/** Marca original: vieira estilizada formada por raios (caminhos) que convergem para um ponto (Santiago). */
export function ShellMark({ size = 40, className }: { size?: number; className?: string }) {
  const rays = [-60, -40, -20, 0, 20, 40, 60];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--blue)" />
      <path d="M32 54 C 12 40, 10 22, 32 12 C 54 22, 52 40, 32 54 Z" fill="var(--gold)" />
      {rays.map((a) => (
        <line key={a} x1="32" y1="52" x2={32 + Math.sin((a * Math.PI) / 180) * 30} y2={52 - Math.cos((a * Math.PI) / 180) * 36} stroke="var(--blue)" strokeWidth="2.2" strokeLinecap="round" />
      ))}
      <circle cx="32" cy="52" r="3" fill="var(--blue)" />
    </svg>
  );
}

export function Logo({ withText = true, inverted = false }: { withText?: boolean; inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ShellMark size={34} />
      {withText && (
        <span className={`font-display text-[1.35rem] font-semibold tracking-tight ${inverted ? 'text-white' : ''}`}>
          Camino <span className={inverted ? 'text-[var(--gold)]' : 'text-terracotta'}>3D</span>
        </span>
      )}
    </span>
  );
}
