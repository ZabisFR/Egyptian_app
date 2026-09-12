import type { Streak } from '@/lib/streak';

function FlammeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21c-3.6 0-6.4-2.5-6.4-6 0-2 .9-3.4 2-4.8-.1 1.3.4 2.1 1.1 2.5-.4-2.6.5-5.2 3-7.2.2 1.8.9 3 2 3.9 1.5 1.2 2.7 2.7 2.7 5.1 0 3.6-2.8 6.5-4.4 6.5Z" />
    </svg>
  );
}

/**
 * Le compteur de série — visible partout où l'apprenant peut se demander « où j'en suis ? »
 * (tableau de bord, page du jour, écran de résultat).
 *
 * `current === 0` ne signifie pas forcément « jamais commencé » : ça peut aussi vouloir
 * dire « rompue depuis peu ». Le libellé distingue les deux, plutôt que d'afficher un zéro
 * sec qui découragerait quelqu'un qui a déjà dix jours de série à son actif la veille.
 */
export default function StreakBadge({
  streak,
  size = 'md',
}: {
  streak: Streak;
  size?: 'sm' | 'md';
}) {
  const { current, best, doneToday } = streak;

  if (current === 0) {
    return (
      <span
        className={`streak-badge streak-badge-${size} streak-badge-eteinte`}
      >
        <FlammeIcon className="streak-flamme" />
        {best > 0 ? `Série rompue — record : ${best} j` : 'Aucune série pour le moment'}
      </span>
    );
  }

  return (
    <span className={`streak-badge streak-badge-${size} streak-badge-allumee`}>
      <FlammeIcon className="streak-flamme" />
      <span className="tabular">
        {current} jour{current > 1 ? 's' : ''} d&apos;affilée
      </span>
      {!doneToday && <span className="streak-badge-alerte">à faire aujourd&apos;hui</span>}
    </span>
  );
}
