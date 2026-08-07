import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lesson, VocabItem } from '@/lib/types';

export default function LessonViewer({
  lesson,
  vocab,
}: {
  lesson: Lesson;
  vocab: VocabItem[];
}) {
  return (
    <>
      {lesson.day !== null && (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Jour {lesson.day}
        </p>
      )}

      <article
        className="prose prose-neutral mt-2 max-w-none dark:prose-invert
          prose-table:block prose-table:overflow-x-auto prose-table:whitespace-nowrap
          prose-th:text-left prose-blockquote:not-italic"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {lesson.content_markdown}
        </ReactMarkdown>
      </article>

      {vocab.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Vocabulaire ({vocab.length})
          </h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {vocab.map((v) => (
                <tr key={v.id}>
                  <td className="arabic py-2 pr-4 text-right align-middle" dir="rtl">
                    {v.arabic}
                  </td>
                  <td className="py-2 pr-4 font-medium">{v.transliteration}</td>
                  <td className="py-2 text-neutral-600 dark:text-neutral-400">
                    {v.french}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
