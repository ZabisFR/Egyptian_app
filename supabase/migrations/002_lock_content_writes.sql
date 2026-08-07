-- Les tables de contenu n'ont pas de RLS : sans cela le rôle anon (clé publishable,
-- exposée dans le navigateur) pourrait aussi INSERT/UPDATE/DELETE, pas seulement lire.
revoke insert, update, delete on modules, lessons, vocab_items, quiz_questions from anon, authenticated;
grant select on modules, lessons, vocab_items, quiz_questions to anon, authenticated;
