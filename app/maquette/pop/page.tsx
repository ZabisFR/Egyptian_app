import type { Metadata } from 'next';
import PopMockup from './PopMockup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Maquette — Pop du Caire',
  robots: { index: false, follow: false },
};

export default function PopPage() {
  return <PopMockup variant="pop" />;
}
