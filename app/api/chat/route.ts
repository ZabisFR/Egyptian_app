import { NextResponse } from 'next/server';
import { streamText, type ModelMessage } from 'ai';
import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  CHAT_LIMITS,
  DEFAULT_CHAT_MODEL,
  FALLBACK_CHAT_MODEL,
  MAX_ASSISTANT_CHARS,
} from '@/lib/chat-config';
import { TUTOR_INSTRUCTIONS } from '@/lib/chat-prompt';

/**
 * Tuteur IA : reçoit l'historique de la conversation, renvoie la réponse en flux de texte.
 *
 * Ordre des vérifications, du moins coûteux au plus coûteux : connexion (401), forme de
 * la requête (400), quota en base (429), et seulement ensuite l'appel à Gemini. Un
 * message refusé ne coûte donc jamais d'appel à l'IA.
 *
 * Le corps de la réponse est du texte brut, morceau par morceau. Le nombre de messages
 * restants voyage dans l'en-tête `X-Chat-Remaining`.
 */
export const dynamic = 'force-dynamic';

// Une réponse de 400 jetons prend quelques secondes ; 30 s laissent de la marge à un
// Gemini lent sans laisser une fonction suspendue indéfiniment.
export const maxDuration = 30;

const messageSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('user'),
    content: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageChars),
  }),
  z.object({
    role: z.literal('assistant'),
    content: z.string().max(MAX_ASSISTANT_CHARS),
  }),
]);

// Les messages au-delà des 10 derniers sont écartés plutôt que refusés : l'interface
// garde toute la conversation à l'écran, c'est le serveur qui décide de ce que l'IA voit.
// La borne de 100 n'existe que pour ne pas analyser un tableau démesuré.
const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
});

function jsonError(status: number, error: string, extra?: Record<string, unknown>, headers?: HeadersInit) {
  return NextResponse.json({ error, ...extra }, { status, headers });
}

/** Les modèles « qui réfléchissent » comptent leur réflexion dans `maxOutputTokens` :
 * sans ce réglage, 400 jetons pouvaient partir en réflexion et laisser une réponse vide. */
function thinkingFor(model: string): GoogleLanguageModelOptions['thinkingConfig'] {
  if (/gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  if (/gemini-(1\.|2\.0)/.test(model)) return undefined;
  // `low` et non `minimal` : `gemini-flash-latest` refuse `minimal` (erreur 400 constatée
  // le 07/10/2026), alors que `low` est accepté par tous les Gemini 3.
  return { thinkingLevel: 'low' };
}

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export async function POST(request: Request) {
  // 1. Connexion
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, 'Connecte-toi pour discuter avec le tuteur.');
  }

  // 2. Forme de la requête. Exiger du JSON écarte aussi les formulaires envoyés depuis un
  // autre site, qui ne peuvent pas poser cet en-tête sans autorisation CORS.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonError(415, 'Format de requête non pris en charge.');
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Requête illisible.');
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      `Message invalide : ${CHAT_LIMITS.maxMessageChars} caractères au maximum, et il ne peut pas être vide.`,
    );
  }
  const history = parsed.data.messages.slice(-CHAT_LIMITS.maxHistory);
  // Couper aux 10 derniers d'une conversation alternée fait commencer l'historique par une
  // réponse du tuteur ; Gemini attend une conversation qui s'ouvre sur l'élève.
  while (history.length > 1 && history[0].role === 'assistant') history.shift();
  if (history.at(-1)?.role !== 'user') {
    return jsonError(400, 'Le dernier message doit venir de l’élève.');
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('Tuteur : GOOGLE_GENERATIVE_AI_API_KEY absente.');
    return jsonError(503, 'Le tuteur n’est pas disponible pour le moment.');
  }

  // 3. Quota, vérifié et consommé en une seule opération côté base (voir la migration
  // 007) : des requêtes parallèles ne peuvent pas passer toutes à la fois.
  const { data: quota, error: quotaError } = await supabase
    .rpc('consume_chat_message', {
      daily_limit: CHAT_LIMITS.dailyMessages,
      minute_limit: CHAT_LIMITS.perMinute,
    })
    .single<{ allowed: boolean; reason: 'daily' | 'minute' | null; remaining: number; retry_after_seconds: number }>();

  if (quotaError || !quota) {
    console.error('Tuteur : quota illisible :', quotaError?.message);
    return jsonError(503, 'Le tuteur n’est pas disponible pour le moment.');
  }

  if (!quota.allowed) {
    const wait = quota.retry_after_seconds;
    const message =
      quota.reason === 'daily'
        ? `Tu as utilisé tes ${CHAT_LIMITS.dailyMessages} messages d’aujourd’hui. Le compteur repart à zéro dans ${formatWait(wait)}.`
        : `Doucement : ${CHAT_LIMITS.perMinute} messages par minute au maximum. Réessaie dans ${formatWait(wait)}.`;
    return jsonError(
      429,
      message,
      { reason: quota.reason, retryAfter: wait, remaining: quota.remaining },
      { 'Retry-After': String(wait), 'X-Chat-Remaining': String(quota.remaining) },
    );
  }

  // 4. Appel à Gemini, en flux.
  //
  // Pas de `abortSignal: request.signal` : le signal de la requête peut se déclencher dès
  // que la route a renvoyé sa réponse, et coupait alors Gemini après quelques mots, sans
  // erreur (réponses tronquées constatées en production le 07/10/2026). Gemini n'est
  // arrêté que si le navigateur ferme vraiment la connexion : voir `cancel()` plus bas.
  const abort = new AbortController();
  const primary = process.env.CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
  const start = (model: string, thinkingConfig: GoogleLanguageModelOptions['thinkingConfig']) =>
    streamText({
      model: google(model),
      instructions: TUTOR_INSTRUCTIONS,
      messages: history as ModelMessage[],
      maxOutputTokens: CHAT_LIMITS.maxOutputTokens,
      abortSignal: abort.signal,
      providerOptions: {
        google: { thinkingConfig } satisfies GoogleLanguageModelOptions,
      },
    }).stream[Symbol.asyncIterator]();

  // On attend le premier morceau de texte AVANT de répondre : une erreur de Gemini (clé
  // refusée, quota Google dépassé, modèle inconnu) arrive presque toujours là. Elle devient
  // alors une vraie réponse 502 que l'interface sait afficher, au lieu d'un flux 200 vide.
  const firstText = async (it: ReturnType<typeof start>) => {
    for (;;) {
      const { value, done } = await it.next();
      if (done || value.type === 'abort') return '';
      if (value.type === 'text-delta' && value.text) return value.text;
      if (value.type === 'error') throw value.error;
    }
  };

  let model = primary;
  let parts = start(model, thinkingFor(model));
  let first = '';
  try {
    try {
      first = await firstText(parts);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/thinking/i.test(message)) {
        // Chaque modèle n'accepte pas chaque réglage de réflexion, et `CHAT_MODEL` peut
        // désigner n'importe lequel : si Google refuse ce réglage, on réessaie sans.
        console.warn('Tuteur : réglage de réflexion refusé, nouvel essai sans :', message);
        parts = start(model, undefined);
      } else if (/high demand|overloaded|unavailable|503/i.test(message)) {
        // Modèle saturé chez Google (fréquent sur l'offre gratuite) : un essai sur l'autre
        // modèle Flash, qui a sa propre capacité.
        model = FALLBACK_CHAT_MODEL[model] ?? DEFAULT_CHAT_MODEL;
        console.warn(`Tuteur : ${primary} saturé, nouvel essai avec ${model}.`);
        parts = start(model, thinkingFor(model));
      } else {
        throw e;
      }
      first = await firstText(parts);
    }
  } catch (e) {
    console.error('Tuteur : erreur Gemini :', e instanceof Error ? e.message : e);
    return jsonError(502, 'Le tuteur n’a pas pu répondre. Réessaie dans un instant.');
  }
  if (!first) {
    return jsonError(502, 'Le tuteur n’a rien répondu. Reformule ta question ?');
  }

  const encoder = new TextEncoder();
  let length = first.length;
  let finishReason = '?';
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(first));
    },
    // Chaque appel doit produire un morceau ou clore le flux : les événements sans texte
    // (début d'étape, fin, métadonnées) sont sautés dans la boucle, sinon le flux pourrait
    // attendre un `pull` qui ne viendrait jamais.
    async pull(controller) {
      try {
        for (;;) {
          const { value, done } = await parts.next();
          if (done || value.type === 'abort') {
            // Une ligne par réponse : si une réponse paraît coupée, les journaux Vercel
            // disent si Gemini a fini (`stop`), manqué de jetons (`length`) ou été coupé.
            console.info(
              `Tuteur : réponse terminée — ${model}, ${finishReason}${done ? '' : ' (interrompue)'}, ${length} caractères.`,
            );
            return controller.close();
          }
          if (value.type === 'finish') finishReason = value.finishReason;
          if (value.type === 'error') throw value.error;
          if (value.type === 'text-delta' && value.text) {
            length += value.text.length;
            controller.enqueue(encoder.encode(value.text));
            return;
          }
        }
      } catch (e) {
        // Erreur en plein milieu : on coupe le flux. Côté navigateur, la lecture échoue
        // et l'interface signale une réponse interrompue.
        console.error('Tuteur : flux interrompu :', e instanceof Error ? e.message : e);
        controller.error(e);
      }
    },
    // Le navigateur a fermé la connexion (page quittée) : inutile de laisser Gemini écrire.
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      // Demande aux intermédiaires de ne pas retenir le flux : sans tampon, chaque morceau
      // part dès qu'il arrive.
      'X-Accel-Buffering': 'no',
      'X-Chat-Remaining': String(quota.remaining),
    },
  });
}
