import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site-config';
import { createClient } from '@/lib/supabase/server';

// Le contenu pédagogique est public : les modules et leurs leçons ont vocation à être
// indexés. Le sitemap est généré depuis la base plutôt que codé en dur, pour rester juste
// après chaque `npm run import`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/modules`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE.url}/glossaire`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/ecriture`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/placement-test`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE.url}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: modules }, { data: lessons }] = await Promise.all([
      supabase.from('modules').select('id').returns<{ id: string }[]>(),
      supabase
        .from('lessons')
        .select('id, module_id')
        .returns<{ id: string; module_id: string }[]>(),
    ]);

    return [
      ...staticRoutes,
      ...(modules ?? []).map((m) => ({
        url: `${SITE.url}/modules/${m.id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
      ...(lessons ?? []).map((l) => ({
        url: `${SITE.url}/modules/${l.module_id}/${l.id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // Base injoignable au moment de la génération : mieux vaut un sitemap partiel qu'une
    // page d'erreur servie aux robots.
    return staticRoutes;
  }
}
