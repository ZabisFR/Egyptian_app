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
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-300 dark:bg-white"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && <p className="mt-2 text-xs text-neutral-400">{label}</p>}
    </div>
  );
}
