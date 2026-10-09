/**
 * Ilustração original (SVG): peregrino visto de costas num caminho de terra, marco com vieira,
 * vila de pedra com telhados de terracota e colinas. Inspirada nas referências do projeto, sem copiar pessoas.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Ilustração de um peregrino com mochila e bastão caminhando por uma estrada de terra em direção a uma vila de pedra, ao lado de um marco com a vieira.">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d9a8" />
          <stop offset="1" stopColor="#f3ead8" />
        </linearGradient>
        <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b98c" />
          <stop offset="1" stopColor="#b98a5a" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky)" />
      <circle cx="300" cy="70" r="26" fill="#f8c66a" opacity="0.8" />
      <path d="M0 140 C 60 110, 120 120, 180 105 S 300 95, 400 120 V 260 H 0 Z" fill="#8fa77a" opacity="0.6" />
      <path d="M0 160 C 80 135, 160 150, 240 135 S 350 140, 400 150 V 260 H 0 Z" fill="#6f8f5a" />
      {/* vila de pedra */}
      <g transform="translate(250 112)">
        <rect x="0" y="12" width="26" height="20" fill="#cfc4ae" />
        <path d="M-3 13 L13 2 L29 13 Z" fill="#b5532f" />
        <rect x="30" y="16" width="20" height="16" fill="#d8ccb4" />
        <path d="M28 17 L40 8 L52 17 Z" fill="#a8492a" />
        <rect x="56" y="4" width="10" height="28" fill="#cfc4ae" />
        <path d="M54 5 L61 -6 L68 5 Z" fill="#8c6a4a" />
        <rect x="59" y="10" width="4" height="6" fill="#4b4031" />
      </g>
      {/* caminho */}
      <path d="M150 260 C 175 210, 200 175, 222 140 L 232 140 C 228 180, 240 220, 270 260 Z" fill="url(#path)" />
      {/* vegetação */}
      <g fill="#4f6f3f">
        <circle cx="60" cy="200" r="34" />
        <circle cx="105" cy="215" r="26" />
        <circle cx="350" cy="205" r="32" />
        <circle cx="390" cy="190" r="26" />
      </g>
      {/* marco com vieira */}
      <g transform="translate(290 168)">
        <path d="M0 0 L26 0 L30 80 L-4 80 Z" fill="#b8b2a4" />
        <rect x="4" y="8" width="18" height="18" fill="#24405e" />
        <path d="M13 24 C 5 19, 5 12, 13 10 C 21 12, 21 19, 13 24 Z" fill="#d4a017" />
        <path d="M6 40 h12 l-3 -3 m3 3 l-3 3" stroke="#d4a017" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      {/* peregrino de costas */}
      <g transform="translate(196 150)">
        <rect x="-2" y="78" width="9" height="22" rx="3" fill="#5a4a36" />
        <rect x="13" y="78" width="9" height="22" rx="3" fill="#5a4a36" />
        <rect x="-1" y="96" width="11" height="6" rx="2" fill="#3a2d22" />
        <rect x="12" y="96" width="11" height="6" rx="2" fill="#3a2d22" />
        <rect x="-3" y="44" width="26" height="38" rx="6" fill="#6b7a45" />
        <rect x="-6" y="18" width="32" height="44" rx="8" fill="#24405e" />
        <rect x="-8" y="14" width="36" height="9" rx="4.5" fill="#d1a43a" />
        <path d="M10 40 C 4 36, 4 30, 10 28 C 16 30, 16 36, 10 40 Z" fill="#f4efe4" />
        <circle cx="10" cy="8" r="8" fill="#c68863" />
        <ellipse cx="10" cy="4" rx="15" ry="4" fill="#a08a66" />
        <rect x="3" y="-5" width="14" height="9" rx="4" fill="#a08a66" />
        <line x1="32" y1="40" x2="40" y2="104" stroke="#7a5230" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="24" y="40" width="7" height="22" rx="3.5" fill="#6b7a45" />
      </g>
    </svg>
  );
}
