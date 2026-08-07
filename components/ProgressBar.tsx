export default function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
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
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--carmine)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && <p className="mt-2 text-xs text-[var(--muted)]">{label}</p>}
    </div>
  );
}
