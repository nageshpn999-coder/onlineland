import { useTranslations } from 'next-intl';

/** A village survey map (as on a pahani sketch): field parcels, a road, a canal, one plot highlighted. */
const PARCELS: { id: string; points: string; label: [number, number] }[] = [
  { id: '211', points: '20,20 200,10 230,150 40,170', label: [122, 92] },
  { id: '212', points: '200,10 380,30 360,160 230,150', label: [292, 88] },
  { id: '213/1', points: '380,30 620,20 630,140 360,160', label: [498, 88] },
  { id: '213/2', points: '40,170 230,150 250,282 30,300', label: [136, 232] },
  { id: '215', points: '360,160 630,140 622,232 400,270', label: [512, 205] },
  { id: '220', points: '30,334 262,312 282,500 20,508', label: [148, 418] },
  { id: '221/A', points: '262,312 432,296 470,500 282,500', label: [362, 405] },
  { id: '222', points: '432,296 624,272 630,500 470,500', label: [540, 392] },
];

const HIGHLIGHT = '230,150 360,160 400,270 250,282';

export function SurveyMap() {
  const t = useTranslations('hero');

  return (
    <figure className="relative">
      <div className="relative overflow-hidden rounded-[var(--radius-plot)] border border-line bg-paper">
        <svg viewBox="0 0 640 520" className="block h-auto w-full" role="img" aria-label={`${t('mapPlot')}, ${t('mapPlotDetail')}`}>
          <defs>
            <pattern id="furrows" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
              <line x1="0" y1="0" x2="0" y2="9" stroke="#0F6B3F" strokeOpacity="0.09" strokeWidth="3" />
            </pattern>
          </defs>

          <rect width="640" height="520" fill="#F7FAFE" />

          {/* Parcels */}
          <g stroke="#B7C7E2" strokeWidth="1.3" strokeLinejoin="round">
            {PARCELS.map((p, i) => (
              <polygon key={p.id} points={p.points} fill={i % 3 === 1 ? 'url(#furrows)' : '#FFFFFF'} />
            ))}
          </g>

          {/* Canal */}
          <path d="M150 0 C 172 110, 118 250, 196 520" fill="none" stroke="#9EBCEB" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

          {/* Village road */}
          <path d="M-10 324 L650 254" stroke="#DCE5F3" strokeWidth="26" />
          <path d="M-10 324 L650 254" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="10 9" />

          {/* Survey numbers */}
          <g fontFamily="var(--font-sans)" fontSize="13" fill="#7C8BA8" textAnchor="middle">
            {PARCELS.map((p) => (
              <text key={p.id} x={p.label[0]} y={p.label[1]}>
                {p.id}
              </text>
            ))}
          </g>

          {/* Highlighted plot */}
          <polygon points={HIGHLIGHT} fill="#0F6B3F" className="plot-fill" />
          <polygon
            points={HIGHLIGHT}
            fill="none"
            stroke="#0F6B3F"
            strokeWidth="3"
            strokeLinejoin="round"
            pathLength={1}
            className="plot-outline"
          />
          <text x="312" y="222" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="700" fill="#0F6B3F">
            214/2
          </text>

          {/* North arrow */}
          <g transform="translate(596 470)" fill="#4A5A78">
            <path d="M0 -22 L7 0 L0 -5 L-7 0 Z" />
            <text y="16" textAnchor="middle" fontSize="12" fontFamily="var(--font-sans)">
              N
            </text>
          </g>
        </svg>

        {/* Plot tag, anchored near the highlighted parcel */}
        <div className="plot-tag absolute right-[3%] top-[3%] max-w-[52%] sm:right-auto sm:left-[60%] sm:top-[23%] sm:max-w-[46%] rounded-[var(--radius-plot)] border border-field/30 bg-paper px-3.5 py-2.5 shadow-[0_10px_30px_-14px_rgba(15,107,63,0.55)]">
          <p className="font-display text-[1.05rem] font-semibold leading-tight text-field">{t('mapPlot')}</p>
          <p className="mt-0.5 text-sm leading-snug text-ink-soft">{t('mapPlotDetail')}</p>
        </div>
      </div>
      <figcaption className="mt-2 text-right text-xs text-ink-soft">{t('mapCaption')}</figcaption>
    </figure>
  );
}
