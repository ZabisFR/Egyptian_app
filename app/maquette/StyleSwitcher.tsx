import Link from 'next/link';
import './switcher.css';

/**
 * Barre flottante pour passer d'une maquette à l'autre. Neutre à dessein (noir et blanc) :
 * elle ne doit favoriser aucun des quatre styles qu'elle sert à comparer.
 */

const STYLES = [
  { href: '/maquette', label: 'Conte oriental' },
  { href: '/maquette/aventure', label: 'Jeu d’aventure' },
  { href: '/maquette/pop', label: 'Pop du Caire' },
  { href: '/maquette/papyrus', label: 'Papyrus enchanté' },
] as const;

export default function StyleSwitcher({ current }: { current: (typeof STYLES)[number]['href'] }) {
  return (
    <nav className="mq-switcher" aria-label="Comparer les maquettes">
      <span className="mq-switcher-label" aria-hidden="true">
        Style
      </span>
      <ul>
        {STYLES.map((s) => (
          <li key={s.href}>
            <Link href={s.href} aria-current={s.href === current ? 'page' : undefined}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
