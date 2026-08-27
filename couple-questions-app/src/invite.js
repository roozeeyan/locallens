// Приглашение: ссылка и слова к ней.
//
// Ссылка без объяснения не работает. Самое трудное в сценарии «позвать
// второго» — не отправить адрес, а объяснить, что это не проверка и не
// претензия. Поэтому текст живёт здесь, рядом со ссылкой, и одинаков
// везде, откуда приглашают.

export const BOT = "relationship_game_by_roo_bot";

export const inviteLink = (code) => `https://t.me/${BOT}?startapp=${code}`;

const DRAFT = {
  ru: (link) =>
    "Слушай, хочу кое-что пройти вместе. Это не тест и не претензия — просто список вопросов " +
    "про деньги, детей, границы и всё то, о чём мы вечно не доходим поговорить.\n\n" +
    "Отвечает каждый сам, со своего телефона. Твой ответ я увижу, только когда отвечу на тот же " +
    "вопрос сама, — и наоборот. Можно понемногу, по паре вопросов вечером.\n\n" +
    `Вот ссылка: ${link}`,
  en: (link) =>
    "Hey, I want us to go through something together. It is not a test and not a complaint — " +
    "just a list of questions about money, children, boundaries and all the things we never " +
    "get around to.\n\n" +
    "Each of us answers alone, on our own phone. I only see your answer once I answer the same " +
    "question myself — and the other way round. A couple of questions an evening is fine.\n\n" +
    `Here is the link: ${link}`,
};

export const inviteMessage = (link, lang = "ru") => (DRAFT[lang] || DRAFT.ru)(link);

/** Кладёт текст в буфер обмена. Возвращает, получилось ли. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
