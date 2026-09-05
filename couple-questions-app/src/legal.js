// Политика конфиденциальности и пользовательское соглашение.
//
// Тексты живут в коде, а не на внешнем сайте: так они открываются внутри
// мини-приложения без интернета за пределами Telegram и не ломаются, если
// сайт переедет. Дата обновления меняется вручную при правке текста.

export const LEGAL_UPDATED = "20 августа 2026";

export const CONTACT = "@relationship_game_by_roo_bot";

export const PRIVACY = {
  ru: {
    title: "Политика конфиденциальности",
    sections: [
      {
        h: "Коротко",
        p: [
          "Приложение хранит ваше имя и ваши ответы на вопросы. Ответы — самое личное, что здесь есть, и правило доступа к ним одно: другой человек видит ваш ответ только если вы связаны в приложении и он ответил на тот же вопрос сам.",
          "Мы не собираем телефон, электронную почту, геолокацию, контакты и платёжные реквизиты.",
        ],
      },
      {
        h: "Какие данные мы храним",
        p: [
          "Имя, которое вы ввели сами. Оно может быть любым — настоящее имя не требуется.",
          "Ваши ответы на вопросы анкеты.",
          "Связи: с кем вы прошли приглашение и какого типа эта связь — партнёр, кандидат, друг.",
          "Отметки «совпадаем», «обсудить», «расходимся», которые вы ставите открытым парам ответов.",
          "Настройки: язык, оформление, частота напоминаний, скрытые темы, статус.",
          "Факт покупки платного доступа и его сумма в звёздах Telegram.",
        ],
      },
      {
        h: "Чего мы не храним",
        p: [
          "Номер телефона, адрес электронной почты, геолокацию, список контактов, переписку в Telegram.",
          "Данные банковской карты. Оплата проходит внутри Telegram, реквизиты к нам не попадают.",
        ],
      },
      {
        h: "Кто видит ваши ответы",
        p: [
          "Люди, которых вы сами добавили, — и только те ответы, на вопросы которых они ответили сами. Это правило работает на уровне базы данных, а не в интерфейсе: обойти его из приложения нельзя.",
          "Блок, помеченный в настройках как скрытый, не видит никто из ваших связей, даже при взаимном ответе.",
          "Владелец сервиса имеет технический доступ к базе данных и, следовательно, к содержимому ответов. Так устроен любой сервис, который хранит данные у себя. Мы сообщаем об этом прямо, чтобы вы понимали это до того, как напишете что-то очень личное.",
        ],
      },
      {
        h: "Где хранятся данные",
        p: [
          "В базе данных Supabase (сервис управляемого PostgreSQL). Соединение шифруется.",
          "Ключ вашего входа дополнительно хранится в облачном хранилище Telegram, привязанном к вашему аккаунту, — чтобы вы не теряли доступ к своим ответам при смене устройства.",
        ],
      },
      {
        h: "Сколько мы храним данные",
        p: [
          "Пока вы пользуетесь приложением. Вы можете удалить всё в любой момент: Профиль → Данные → «Удалить аккаунт и все данные».",
          "После удаления ваши ответы стираются с сервера и перестают быть видны вашим связям. Файлы, которые ваши партнёры выгрузили себе ранее, остаются у них на устройствах — на них мы повлиять не можем.",
        ],
      },
      {
        h: "Ваши права",
        p: [
          "Посмотреть свои данные — они целиком показаны в приложении.",
          "Выгрузить свои ответы файлом.",
          "Исправить любой ответ в любой момент.",
          "Удалить аккаунт и все данные без объяснения причин.",
          "Отозвать согласие, удалив аккаунт.",
        ],
      },
      {
        h: "Возраст",
        p: [
          "Сервис предназначен для совершеннолетних. Вопросы затрагивают близость, деньги и семейные конфликты.",
        ],
      },
      {
        h: "Изменения",
        p: [
          "Если политика изменится существенно, мы покажем новое согласие при следующем входе.",
        ],
      },
      { h: "Связь", p: [`Вопросы о данных — через бота ${CONTACT}.`] },
    ],
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        h: "In short",
        p: [
          "The app stores your name and your answers. Answers are the most personal thing here, and the access rule is simple: another person sees your answer only if you are connected in the app and they have answered the same question themselves.",
          "We do not collect phone numbers, email addresses, location, contacts, or payment details.",
        ],
      },
      {
        h: "What we store",
        p: [
          "The name you entered yourself. It can be anything — a real name is not required.",
          "Your answers to the questionnaire.",
          "Connections: who accepted your invitation and the type of connection — partner, candidate, friend.",
          "The marks you place on revealed answer pairs: match, worth discussing, differ.",
          "Settings: language, theme, reminder frequency, hidden blocks, status.",
          "The fact of a paid purchase and its amount in Telegram Stars.",
        ],
      },
      {
        h: "What we do not store",
        p: [
          "Phone number, email address, location, contact list, Telegram messages.",
          "Card details. Payment happens inside Telegram and never reaches us.",
        ],
      },
      {
        h: "Who can see your answers",
        p: [
          "Only people you added yourself, and only the answers to questions they have answered themselves. This rule is enforced by the database, not by the interface — the app cannot bypass it.",
          "A block marked as hidden in settings is visible to no one, even when both of you answered.",
          "The service owner has technical access to the database and therefore to the content of answers. This is true of any service that stores data itself. We state it plainly so you know before writing something deeply personal.",
        ],
      },
      {
        h: "Where data is stored",
        p: [
          "In a Supabase database (managed PostgreSQL). Connections are encrypted.",
          "Your sign-in key is additionally stored in Telegram's cloud storage tied to your account, so you keep access to your answers when changing devices.",
        ],
      },
      {
        h: "How long we keep it",
        p: [
          "As long as you use the app. You can delete everything at any moment: Profile → Data → “Delete account and all data”.",
          "After deletion your answers are erased from the server and stop being visible to your connections. Files your partners exported earlier remain on their devices, which is outside our control.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "See your data — all of it is shown in the app.",
          "Export your answers as a file.",
          "Correct any answer at any time.",
          "Delete your account and all data without giving a reason.",
          "Withdraw consent by deleting your account.",
        ],
      },
      {
        h: "Age",
        p: [
          "The service is intended for adults. Questions touch on intimacy, money, and family conflict.",
        ],
      },
      {
        h: "Changes",
        p: ["If this policy changes materially, we will ask for consent again on your next visit."],
      },
      { h: "Contact", p: [`Questions about data — via the bot ${CONTACT}.`] },
    ],
  },
};

export const TERMS = {
  ru: {
    title: "Пользовательское соглашение",
    sections: [
      {
        h: "Что это за сервис",
        p: [
          "Приложение помогает двум людям по отдельности ответить на список вопросов об отношениях и затем сравнить ответы. Оно предназначено для разговора между людьми и ни для чего больше.",
        ],
      },
      {
        h: "Это не помощь специалиста",
        p: [
          "Приложение не оказывает медицинских, психологических, психотерапевтических и юридических услуг. Тексты вопросов, сводки и любые автоматические разборы — не диагноз и не рекомендация специалиста.",
          "Если вам тяжело, если в отношениях есть насилие или угроза жизни, обратитесь к профессионалу или в службу помощи. Приложение для этого не предназначено.",
        ],
      },
      {
        h: "Возраст",
        p: [
          "Пользоваться сервисом можно с 18 лет. Начиная работу, вы подтверждаете, что вам исполнилось 18.",
        ],
      },
      {
        h: "Ваш аккаунт",
        p: [
          "Вход происходит через ваш аккаунт Telegram. Отвечайте за то, что происходит под вашим аккаунтом, и не передавайте доступ к телефону тем, кому не хотите показывать свои ответы.",
        ],
      },
      {
        h: "Что нельзя",
        p: [
          "Публиковать чужие ответы без разрешения человека, который их написал.",
          "Использовать сервис для угроз, преследования, шантажа и давления.",
          "Автоматически собирать данные, вскрывать чужие аккаунты, обходить ограничения доступа.",
          "Выдавать себя за другого человека при приглашении.",
        ],
      },
      {
        h: "Ваши тексты",
        p: [
          "Ответы принадлежат вам. Мы не публикуем их, не продаём и не передаём третьим лицам. Мы храним и показываем их по правилам, описанным в политике конфиденциальности.",
        ],
      },
      {
        h: "Платный доступ",
        p: [
          "Часть тем открывается платно. Оплата проходит через Telegram Stars по правилам Telegram.",
          "Возврат средств возможен в порядке, установленном Telegram для звёзд. Обращайтесь через бота — поможем разобраться.",
        ],
      },
      {
        h: "Прекращение доступа",
        p: [
          "Вы можете уйти в любой момент, удалив аккаунт в профиле.",
          "Мы можем ограничить доступ, если сервис используется для причинения вреда другим людям.",
        ],
      },
      {
        h: "Ответственность",
        p: [
          "Сервис предоставляется как есть. Мы стараемся, чтобы он работал и данные не терялись, но не гарантируем непрерывной работы.",
          "Решения, которые вы принимаете в отношениях, — ваши. Приложение только задаёт вопросы.",
        ],
      },
      {
        h: "Изменения",
        p: [
          "Соглашение может меняться. О существенных изменениях мы сообщим при входе.",
        ],
      },
      { h: "Связь", p: [`Вопросы — через бота ${CONTACT}.`] },
    ],
  },
  en: {
    title: "Terms of Use",
    sections: [
      {
        h: "What this service is",
        p: [
          "The app helps two people answer a list of relationship questions separately and then compare their answers. It is meant for a conversation between people and nothing else.",
        ],
      },
      {
        h: "This is not professional help",
        p: [
          "The app does not provide medical, psychological, therapeutic, or legal services. The questions, summaries, and any automatic analysis are not a diagnosis or professional advice.",
          "If you are struggling, or if there is violence or danger in your relationship, contact a professional or a support service. This app is not built for that.",
        ],
      },
      {
        h: "Age",
        p: ["You must be 18 or older. By starting, you confirm that you are."],
      },
      {
        h: "Your account",
        p: [
          "Sign-in happens through your Telegram account. You are responsible for what happens under your account, and for who has access to your phone.",
        ],
      },
      {
        h: "What is not allowed",
        p: [
          "Publishing someone else's answers without the permission of the person who wrote them.",
          "Using the service for threats, harassment, blackmail, or pressure.",
          "Automated data collection, breaking into accounts, or bypassing access restrictions.",
          "Impersonating another person when inviting.",
        ],
      },
      {
        h: "Your writing",
        p: [
          "Your answers belong to you. We do not publish, sell, or hand them to third parties. We store and display them under the rules described in the privacy policy.",
        ],
      },
      {
        h: "Paid access",
        p: [
          "Some blocks require payment, processed through Telegram Stars under Telegram's rules.",
          "Refunds follow the process Telegram sets for Stars. Contact us through the bot and we will help.",
        ],
      },
      {
        h: "Ending access",
        p: [
          "You may leave at any time by deleting your account in the profile.",
          "We may restrict access if the service is used to harm other people.",
        ],
      },
      {
        h: "Liability",
        p: [
          "The service is provided as is. We work to keep it running and your data safe, but we do not guarantee uninterrupted operation.",
          "The decisions you make in your relationship are yours. The app only asks questions.",
        ],
      },
      {
        h: "Changes",
        p: ["These terms may change. We will notify you of material changes on sign-in."],
      },
      { h: "Contact", p: [`Questions — via the bot ${CONTACT}.`] },
    ],
  },
};
