import type { Level } from '@/lib/types';

/**
 * La couleur d'aplat de chaque niveau (classes `pop-tone-*` de globals.css).
 *
 * Une couleur par palier plutôt qu'un dégradé vert-à-rouge, qui suggérerait à tort qu'un
 * niveau haut est un danger. Les deux premiers paliers sont des aplats clairs (encre
 * indigo), les deux derniers des aplats profonds (encre crème) : la progression se lit
 * aussi dans la profondeur de la couleur.
 */
export const LEVEL_TONE: Record<Level, string> = {
  A1: 'pop-tone-turquoise',
  A2: 'pop-tone-gold',
  B1: 'pop-tone-grenade',
  B2: 'pop-tone-indigo',
  REF: 'pop-tone-sand',
};
