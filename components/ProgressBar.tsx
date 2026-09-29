export default function ProgressBar({
  value,
  max,
  label,
  showLabel = true,
}: {
  value: number;
  max: number;
  label?: string;
  /**
   * Le libellé reste toujours porté par `aria-label`. `showLabel={false}` ne fait que
   * masquer sa version écrite, quand la page l'affiche déjà ailleurs — un quiz qui
   * annonce « Question 3 / 12 » juste au-dessus n'a pas besoin de le répéter sous la
   * barre, mais un lecteur d'écran, lui, en a toujours besoin.
   */
  showLabel?: boolean;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progression'}
        className="h-3.5 w-full overflow-hidden rounded-full border-2 border-[var(--line-strong)] bg-[var(--surface)]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--pop-gold)] to-[var(--pop-turquoise)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && showLabel && <p className="mt-2 text-xs text-[var(--muted)]">{label}</p>}
    </div>
  );
}
