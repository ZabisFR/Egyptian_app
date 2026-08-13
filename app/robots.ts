import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Espaces personnels : aucun intérêt pour l'indexation, et les exposer aux robots
      // reviendrait à publier des URL qui ne renvoient de toute façon que vers la
      // connexion.
      disallow: ['/profile', '/dashboard', '/daily', '/auth/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
