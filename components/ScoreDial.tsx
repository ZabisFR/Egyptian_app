/**
 * Cadran de score.
 *
 * L'anneau se remplit à l'ouverture de l'écran de résultat, en CSS pur : les keyframes
 * partent de la circonférence entière et vont jusqu'à la valeur passée en style inline
 * (`--dash-end`). Aucun JavaScript, donc le composant reste rendu côté serveur et le
 * chiffre est déjà juste dans le HTML — un lecteur d'écran n'attend pas la fin de
 * l'animation pour lire le résultat.
 */
const R = 56;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function ScoreDial({
  value,
  tone = 'neutral',
  caption,
}: {
  /** Pourcentage, 0 à 100. */
  value: number;
  tone?: 'pass' | 'fail' | 'neutral';
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    tone === 'pass'
      ? 'var(--malachite)'
      : tone === 'fail'
        ? 'var(--carmine)'
        : 'var(--gold)';

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 128 128" aria-hidden="true" className="h-28 w-28 shrink-0">
        {/* -90° : l'anneau démarre en haut, pas à trois heures. */}
        <g transform="rotate(-90 64 64)">
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="var(--surface-sunken)"
            strokeWidth="11"
          />
          <circle
            className="dial-arc"
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={
              {
                '--dash-start': CIRCUMFERENCE,
                '--dash-end': CIRCUMFERENCE * (1 - pct / 100),
              } as React.CSSProperties
            }
          />
        </g>
      </svg>

      <div>
        <p className="display text-5xl leading-none tabular">
          {pct}
          <span className="text-2xl text-[var(--muted)]">&nbsp;%</span>
        </p>
        {caption && <p className="mt-2 text-sm text-[var(--muted)]">{caption}</p>}
      </div>
    </div>
  );
}
