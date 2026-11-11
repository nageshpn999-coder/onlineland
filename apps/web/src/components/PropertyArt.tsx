import type { PropertyCategory } from '@onlineland/shared';

/**
 * Drawn illustrations used until real photos arrive from Firebase Storage (Phase 5).
 * Same flat survey-sketch style as the hero map.
 */
export function PropertyArt({ category }: { category: PropertyCategory }) {
  return (
    <svg viewBox="0 0 320 200" className="block h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="200" fill="#EEF3FA" />
      {ART[category] ?? ART.villa}
    </svg>
  );
}

const ground = <rect y="150" width="320" height="50" fill="#E4F1E9" />;
const tree = (x: number, y: number, r = 16) => (
  <g key={`${x}-${y}`}>
    <rect x={x - 2} y={y} width="4" height={r + 6} fill="#7A8B6F" />
    <circle cx={x} cy={y} r={r} fill="#2F8A5B" />
  </g>
);

const ART: Partial<Record<PropertyCategory, React.ReactElement>> = {
  agricultural: (
    <>
      <circle cx="262" cy="46" r="18" fill="#FFFFFF" />
      <path d="M0 96 Q160 70 320 92 V200 H0Z" fill="#CFE6D7" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${-40 + i * 46} 200 L${110 + i * 26} 92`} stroke="#0F6B3F" strokeOpacity="0.35" strokeWidth="5" />
      ))}
      <rect x="58" y="112" width="10" height="26" fill="#1456C8" />
      <rect x="52" y="108" width="22" height="6" fill="#0E3F96" />
      {tree(282, 98, 14)}
    </>
  ),
  'open-plot': (
    <>
      <path d="M0 120 L320 96 V200 H0Z" fill="#FFFFFF" />
      <path d="M0 150 L320 126" stroke="#DCE5F3" strokeWidth="18" />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${30 + i * 68} ${172 - i * 5} l60 -4 l8 30 l-62 4 Z`}
          fill={i === 1 ? '#0F6B3F' : 'none'}
          fillOpacity={i === 1 ? 0.2 : 0}
          stroke={i === 1 ? '#0F6B3F' : '#B7C7E2'}
          strokeWidth={i === 1 ? 2.5 : 1.4}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path key={`b${i}`} d={`M${30 + i * 68} ${110 - i * 5} l60 -4 l4 22 l-62 4 Z`} fill="none" stroke="#B7C7E2" strokeWidth="1.4" />
      ))}
      <rect x="226" y="46" width="4" height="40" fill="#4A5A78" />
      <rect x="230" y="46" width="34" height="20" fill="#1456C8" />
    </>
  ),
  farmhouse: (
    <>
      {ground}
      <path d="M96 150 V104 L144 74 L192 104 V150Z" fill="#FFFFFF" stroke="#102347" strokeWidth="2" />
      <path d="M88 108 L144 68 L200 108" fill="none" stroke="#0F6B3F" strokeWidth="6" strokeLinejoin="round" />
      <rect x="134" y="118" width="20" height="32" fill="#1456C8" />
      {tree(42, 118)}
      {tree(232, 112, 20)}
      {tree(278, 124)}
    </>
  ),
  flat: (
    <>
      {ground}
      <rect x="104" y="36" width="78" height="114" fill="#FFFFFF" stroke="#102347" strokeWidth="2" />
      <rect x="182" y="66" width="56" height="84" fill="#DCE5F3" stroke="#102347" strokeWidth="2" />
      {Array.from({ length: 5 }, (_, r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}-${c}`} x={116 + c * 21} y={48 + r * 19} width="12" height="10" fill={r === 2 && c === 1 ? '#0F6B3F' : '#1456C8'} />
        )),
      )}
      {Array.from({ length: 3 }, (_, r) => (
        <rect key={r} x="196" y={80 + r * 20} width="28" height="9" fill="#1456C8" opacity="0.6" />
      ))}
      {tree(70, 124)}
    </>
  ),
  villa: (
    <>
      {ground}
      <rect x="70" y="92" width="180" height="58" fill="#FFFFFF" stroke="#102347" strokeWidth="2" />
      <rect x="150" y="62" width="100" height="30" fill="#FFFFFF" stroke="#102347" strokeWidth="2" />
      <path d="M60 92 H260" stroke="#0F6B3F" strokeWidth="6" />
      <path d="M142 62 H258" stroke="#0F6B3F" strokeWidth="6" />
      <rect x="92" y="108" width="34" height="22" fill="#1456C8" />
      <rect x="170" y="70" width="60" height="14" fill="#1456C8" opacity="0.7" />
      <rect x="196" y="112" width="22" height="38" fill="#0E3F96" />
      {tree(36, 122)}
      {tree(290, 118, 18)}
    </>
  ),
  rental: (
    <>
      {ground}
      <path d="M90 150 V98 L160 62 L230 98 V150Z" fill="#FFFFFF" stroke="#102347" strokeWidth="2" />
      <path d="M80 102 L160 56 L240 102" fill="none" stroke="#1456C8" strokeWidth="6" strokeLinejoin="round" />
      <rect x="148" y="112" width="24" height="38" fill="#0F6B3F" />
      <rect x="104" y="108" width="28" height="20" fill="#1456C8" opacity="0.7" />
      <rect x="188" y="108" width="28" height="20" fill="#1456C8" opacity="0.7" />
      {tree(272, 120)}
    </>
  ),
};
