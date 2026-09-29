import type { Metadata } from 'next';
import PopMockup from '../pop/PopMockup';
import './pop-orient.css';

/**
 * « Pop du Caire » aux couleurs du Conte oriental : même mise en page que /maquette/pop,
 * palette indigo, or, turquoise et grenade.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Pop du Caire, couleurs orientales',
  robots: { index: false, follow: false },
};

export default function PopOrientPage() {
  return <PopMockup variant="orient" />;
}
