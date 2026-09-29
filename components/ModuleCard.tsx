import Link from 'next/link';
import { LEVEL_TONE } from '@/lib/level-tone';
import type { Level, Module, ModuleStatus } from '@/lib/types';

const STATUS_LABEL: Record<ModuleStatus, string | null> = {
  locked: 'Verrouillé',
  not_started: null,
  in_progress: 'En cours',
  completed: 'Terminé',
};

const LEVEL_NAME: Record<Level, string> = {
  A1: 'Débutant',
  A2: 'Élémentaire',
  B1: 'Intermédiaire',
  B2: 'Avancé',
  REF: 'Référence',
};

/**
 * Carte d'un module : un aplat plein à la couleur du niveau (turquoise, or, grenade,
 * indigo). Sur une liste de trente modules, c'est ce qui fait voir d'un coup d'œil où
 * finit le A1 et où commence le A2. Le statut se lit à la piste de progression et au
 * libellé en pied de carte.
 */
export default function ModuleCard({
  module,
  lessonCount,
  status = 'not_started',
  lessonsRead = 0,
}: {
  module: Module;
  lessonCount: number;
  status?: ModuleStatus;
  lessonsRead?: number;
}) {
  const tone = LEVEL_TONE[module.level] ?? LEVEL_TONE.REF;
  const started = lessonsRead > 0;
  const pct = lessonCount === 0 ? 0 : Math.round((lessonsRead / lessonCount) * 100);
  const isNumbered = module.order_index < 99;
  const label = STATUS_LABEL[status];

  const body = (
    <>
      <span className="flex items-center justify-between gap-3">
        {isNumbered ? (
          <span aria-hidden="true" className="pop-num">
            {module.number}
          </span>
        ) : (
          <span aria-hidden="true" className="pop-num text-lg">
            ✦
          </span>
        )}
        <span className="pop-chip rotate-2">
          {module.level} · {LEVEL_NAME[module.level]}
        </span>
      </span>

      <h2 className="display mt-4 text-[1.4rem] leading-[1.12]">{module.title}</h2>
      {module.subtitle && <p className="mt-1.5 text-sm font-medium">{module.subtitle}</p>}

      <span className="mt-auto flex items-center gap-3 pt-5 text-sm font-bold">
        {/* La piste n'apparaît qu'une fois le module entamé : trente barres à zéro sur la
            page des modules ressemblent à un échec, pas à un départ. */}
        {started ? (
          <>
            <span
              className="pop-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={lessonCount}
              aria-valuenow={lessonsRead}
              aria-label={`${lessonsRead} leçons lues sur ${lessonCount}`}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular">
              {status === 'completed' ? 'Terminé ✓' : `${lessonsRead}/${lessonCount}`}
            </span>
          </>
        ) : (
          <span>
            {lessonCount} leçons{label ? ` · ${label}` : ''} <span aria-hidden="true">→</span>
          </span>
        )}
      </span>
    </>
  );

  if (status === 'locked') {
    return (
      <div aria-disabled="true" className={`pop-card pop-card-muted ${tone}`}>
        {body}
      </div>
    );
  }

  return (
    <Link href={`/modules/${module.id}`} className={`pop-card ${tone}`}>
      {body}
    </Link>
  );
}
