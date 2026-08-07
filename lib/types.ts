export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'REF';

export type Module = {
  id: string;
  number: number;
  title: string;
  subtitle: string | null;
  level: Level;
  description: string | null;
  order_index: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  day: number | null;
  section: string | null;
  title: string;
  content_markdown: string;
  order_index: number;
};

export type VocabItem = {
  id: string;
  lesson_id: string;
  arabic: string | null;
  transliteration: string;
  french: string;
  audio_url: string | null;
};

export type QuizQuestion = {
  id: string;
  module_id: string;
  question_text: string;
  type: 'mcq' | 'fill_blank' | 'translation' | 'comprehension';
  options: Record<string, unknown> | null;
  correct_answer: string;
  difficulty: string | null;
};

export type ModuleStatus = 'locked' | 'not_started' | 'in_progress' | 'completed';
