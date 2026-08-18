import { CATEGORIES, QUESTIONS } from "./data.js";

// Бесплатно открыты первые три блока в том порядке, в каком человек их видит.
// Темы, выбранные при знакомстве, поднимаются наверх — значит бесплатным будет
// именно то, что он просил. Остальное открывает Premium.
export const FREE_BLOCKS = 3;
export const FREE_CONNECTIONS = 1;

export const PRICE_STARS = 499;

/** Порядок блоков: выбранные при знакомстве идут первыми. */
export function blockOrder(topics = []) {
  return [
    ...CATEGORIES.filter((cat) => topics.includes(cat.id)),
    ...CATEGORIES.filter((cat) => !topics.includes(cat.id)),
  ];
}

export function freeBlockIds(topics = []) {
  return blockOrder(topics)
    .slice(0, FREE_BLOCKS)
    .map((cat) => cat.id);
}

export function isBlockOpen(catId, profile) {
  if (profile.premium) return true;
  return freeBlockIds(profile.topics).includes(catId);
}

export function canAddConnection(profile, connections) {
  return profile.premium || connections.length < FREE_CONNECTIONS;
}

/** Сколько вопросов скрыто за Premium — для текста на пейволле. */
export function lockedQuestionCount(profile) {
  if (profile.premium) return 0;
  const free = freeBlockIds(profile.topics);
  return QUESTIONS.filter((q) => !free.includes(q.cat)).length;
}
