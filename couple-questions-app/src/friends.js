// Вопросы для дружеских связей.
//
// ЧЕРНОВИК — писал Claude, а не автор. Здесь только заготовка, чтобы экран
// можно было собрать и посмотреть. Заменяй любой текст целиком: правь строки
// в кавычках после `ru:` (русский) и `en:` (английский). Порядок вопросов —
// порядок в этом списке. Чтобы убрать вопрос, удали всю его строку;
// чтобы добавить — скопируй соседнюю и поменяй номер после `id:`.
//
// Романтические 119 вопросов сюда не попадают: подруге не отправляют вопрос
// про секс и совместный бюджет. Здесь про ценности, границы и дружбу.
//
// Нумерация с 2001, чтобы не пересекаться с остальными наборами.

export const FRIEND_DECK = {
  id: "friends",
  ru: "Для друзей",
  en: "For Friends",
  note: "Короткий набор — на один вечер",
  draft: true,
  questions: [
    { id: 2001, ru: "Что для тебя значит «близкий друг» — чем он отличается от приятеля?", en: "What does 'close friend' mean to you — how is it different from an acquaintance?" },
    { id: 2002, ru: "Как ты понимаешь, что человеку можно доверять?", en: "How do you know someone can be trusted?" },
    { id: 2003, ru: "Что ты считаешь предательством в дружбе?", en: "What counts as betrayal in a friendship for you?" },
    { id: 2004, ru: "Ты скажешь другу неприятную правду или промолчишь, чтобы не ранить?", en: "Would you tell a friend an unpleasant truth, or stay quiet to avoid hurting them?" },
    { id: 2005, ru: "Как ты ведёшь себя, когда обиделся(ась) на друга?", en: "How do you behave when a friend has hurt you?" },
    { id: 2006, ru: "Сколько времени ты можешь не общаться и не считать, что дружба закончилась?", en: "How long can you go without talking and still feel the friendship is alive?" },
    { id: 2007, ru: "Что тебя восстанавливает, когда тяжело?", en: "What restores you when things are hard?" },
    { id: 2008, ru: "О чём ты просишь помощи легко, а о чём — почти никогда?", en: "What do you ask for help with easily, and what almost never?" },
    { id: 2009, ru: "Как ты относишься к деньгам между друзьями — одалживаешь, просишь, избегаешь?", en: "How do you feel about money between friends — lending, asking, avoiding?" },
    { id: 2010, ru: "Что для тебя личное настолько, что ты об этом не говоришь даже с близкими?", en: "What is so private you don't discuss it even with close people?" },
    { id: 2011, ru: "Ты чаще даёшь совет или слушаешь?", en: "Do you more often give advice or listen?" },
    { id: 2012, ru: "Какой поступок друга ты бы не смог(ла) простить?", en: "What action by a friend could you not forgive?" },
    { id: 2013, ru: "Что тебя раздражает в людях, но ты об этом обычно молчишь?", en: "What irritates you about people, but you usually keep quiet about?" },
    { id: 2014, ru: "Как ты понимаешь, что дружба изжила себя?", en: "How do you know a friendship has run its course?" },
    { id: 2015, ru: "Чему ты научился(ась) у своих друзей?", en: "What have you learned from your friends?" },
    { id: 2016, ru: "Что важное о тебе люди понимают не сразу?", en: "What important thing about you do people not understand right away?" },
    { id: 2017, ru: "Как ты хочешь, чтобы к тебе относились в трудный период?", en: "How do you want to be treated when you're going through a hard time?" },
    { id: 2018, ru: "Что ты ценишь во мне и о чём никогда не говорил(а) вслух?", en: "What do you value in me that you've never said out loud?" },
  ],
};

export const FRIEND_QUESTIONS = FRIEND_DECK.questions.map((q) => ({
  ...q,
  cat: FRIEND_DECK.id,
}));
