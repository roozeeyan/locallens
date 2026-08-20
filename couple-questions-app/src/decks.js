// Дополнительные колоды под конкретный момент отношений.
//
// ВАЖНО: тексты ниже — черновик. Основные 119 вопросов написаны автором и
// менять их нельзя; эти набросаны как заготовка под ту же интонацию, чтобы
// колоды можно было собрать и посмотреть. Заменяются целиком.
//
// Нумерация с 1001, чтобы не пересекаться с основным курсом.
import { FRIEND_DECK, FRIEND_QUESTIONS } from "./friends.js";

export const DECKS = [
  {
    id: "firstdate",
    ru: "Первое свидание",
    en: "First Date",
    note: "Лёгкие, но не пустые",
    draft: true,
    questions: [
      { id: 1001, ru: "Что ты делаешь, когда у тебя свободный вечер и никаких планов?", en: "What do you do when you have a free evening and no plans?" },
      { id: 1002, ru: "О чём ты можешь говорить часами?", en: "What can you talk about for hours?" },
      { id: 1003, ru: "Что тебя рассмешило за последнюю неделю?", en: "What made you laugh in the past week?" },
      { id: 1004, ru: "Какое место тебе хочется показать человеку, который тебе нравится?", en: "What place do you want to show someone you like?" },
      { id: 1005, ru: "Что ты не станешь терпеть даже в самом начале?", en: "What won't you put up with, even at the very beginning?" },
      { id: 1006, ru: "Как ты понимаешь, что человек тебе интересен?", en: "How do you know someone genuinely interests you?" },
      { id: 1007, ru: "Что ты ищешь сейчас — отношений, общения, чего-то ещё?", en: "What are you looking for right now — a relationship, company, something else?" },
      { id: 1008, ru: "Какой у тебя обычный будний день?", en: "What does an ordinary weekday look like for you?" },
      { id: 1009, ru: "Что тебя разочаровывает в людях чаще всего?", en: "What disappoints you about people most often?" },
      { id: 1010, ru: "Что тебе важно, чтобы я знал(а) о тебе сразу?", en: "What matters to you that I know about you right away?" },
    ],
  },
  {
    id: "afterfight",
    ru: "После ссоры",
    en: "After a Fight",
    note: "Когда уже остыли",
    draft: true,
    questions: [
      { id: 1101, ru: "Что ты на самом деле хотел(а) сказать, но сказал(а) по-другому?", en: "What did you actually want to say, but said differently?" },
      { id: 1102, ru: "В какой момент разговор свернул не туда?", en: "At what moment did the conversation go wrong?" },
      { id: 1103, ru: "Что тебе было больнее всего услышать?", en: "What was the most painful thing to hear?" },
      { id: 1104, ru: "Чего ты испугался(ась) в этой ссоре?", en: "What frightened you in this argument?" },
      { id: 1105, ru: "Что я мог(ла) сделать, чтобы тебе стало легче?", en: "What could I have done to make it easier for you?" },
      { id: 1106, ru: "О чём мы спорили на самом деле?", en: "What were we really arguing about?" },
      { id: 1107, ru: "Что нам стоит сделать иначе в следующий раз?", en: "What should we do differently next time?" },
      { id: 1108, ru: "Что тебе нужно сейчас, чтобы закрыть эту тему?", en: "What do you need now to close this topic?" },
    ],
  },
  {
    id: "distance",
    ru: "На расстоянии",
    en: "Long Distance",
    note: "Когда вы в разных городах",
    draft: true,
    questions: [
      { id: 1201, ru: "Сколько времени мы готовы жить в разных городах?", en: "How long are we willing to live in different cities?" },
      { id: 1202, ru: "Что для тебя признак, что расстояние нас разрушает?", en: "What tells you the distance is damaging us?" },
      { id: 1203, ru: "Как часто тебе нужно созваниваться, чтобы чувствовать связь?", en: "How often do you need to talk to feel connected?" },
      { id: 1204, ru: "Что тебе тяжелее всего в разлуке?", en: "What's hardest for you about being apart?" },
      { id: 1205, ru: "Как мы поймём, что пора съезжаться?", en: "How will we know it's time to live together?" },
      { id: 1206, ru: "Кто из нас готов переехать и на каких условиях?", en: "Which of us is ready to move, and on what terms?" },
      { id: 1207, ru: "Что считается нарушением договорённостей на расстоянии?", en: "What counts as breaking our agreement at a distance?" },
      { id: 1208, ru: "Как ты справляешься с ревностью, когда меня нет рядом?", en: "How do you handle jealousy when I'm not around?" },
      { id: 1209, ru: "Что помогает тебе чувствовать, что мы всё ещё вместе?", en: "What helps you feel we're still together?" },
      { id: 1210, ru: "Что мы делаем, если переезд окажется невозможным?", en: "What do we do if moving turns out to be impossible?" },
    ],
  },
  {
    id: "wedding",
    ru: "Перед свадьбой",
    en: "Before the Wedding",
    note: "Практика, о которой забывают",
    draft: true,
    questions: [
      { id: 1301, ru: "Зачем нам официальный брак — что он меняет?", en: "Why do we want a legal marriage — what does it change?" },
      { id: 1302, ru: "Чья фамилия и почему?", en: "Whose surname, and why?" },
      { id: 1303, ru: "Где мы будем жить первый год?", en: "Where will we live the first year?" },
      { id: 1304, ru: "Как мы делим расходы на свадьбу?", en: "How do we split the wedding costs?" },
      { id: 1305, ru: "Кого из родственников ты не готов(а) видеть на свадьбе?", en: "Which relatives are you not willing to have at the wedding?" },
      { id: 1306, ru: "Как ты относишься к брачному договору?", en: "How do you feel about a prenuptial agreement?" },
      { id: 1307, ru: "Что для тебя изменится в отношениях после свадьбы?", en: "What will change in the relationship for you after the wedding?" },
      { id: 1308, ru: "Как мы будем строить границы с родителями, когда поженимся?", en: "How will we set boundaries with parents once we're married?" },
      { id: 1309, ru: "Что мы делаем, если через год поймём, что ошиблись?", en: "What do we do if in a year we realize we were wrong?" },
      { id: 1310, ru: "Какие традиции нашей семьи мы хотим создать сами?", en: "What traditions do we want to create as our own family?" },
      { id: 1311, ru: "Как мы принимаем решения, на которые не согласны оба?", en: "How do we make decisions neither of us fully agrees on?" },
      { id: 1312, ru: "Что для тебя будет знаком, что мы справляемся?", en: "What will tell you that we're doing well?" },
    ],
  },
];

export const DECK_QUESTIONS = [
  ...DECKS.flatMap((d) => d.questions.map((q) => ({ ...q, cat: d.id }))),
  ...FRIEND_QUESTIONS,
];

export function findDeck(id) {
  if (id === FRIEND_DECK.id) return FRIEND_DECK;
  return DECKS.find((d) => d.id === id) || null;
}
