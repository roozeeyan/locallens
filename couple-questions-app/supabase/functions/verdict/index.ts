// Разбор от ИИ: читает открытые пары ответов и отметки, возвращает текст.
//
// Ключ модели живёт только здесь. Клиент не может ни увидеть его, ни
// попросить разбор по чужой связи: функция сама проверяет, что человек
// участник этой связи, и сама отбирает вопросы, открытые обоим.
//
// Разбор пишет Claude. Прежняя модель на Groq путала, кто из двоих что
// сказал, и сглаживала расхождения в согласие — для приложения про
// отношения это не мелкая неточность, а прямой вред. Groq оставлен
// запасным: если Claude не ответит, разбор соберётся, а не сломается.
//
// Секреты:
//   ANTHROPIC_API_KEY — основная модель
//   GROQ_API_KEY      — запасная
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.71.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const GROQ_KEY = Deno.env.get("GROQ_API_KEY") || "";

const MODEL = "claude-opus-5";
const GROQ_MODEL = "openai/gpt-oss-120b";
// Разбор стоит настоящих денег: каждый вызов — обращение к Claude.
// Кэш на двенадцать часов защищает от случайных повторов, но кнопка
// «собрать заново» его обходит, а счёт один на всех. Отсюда два предела:
// личный — чтобы никто не крутил разбор по кругу, и общий — чтобы даже
// сговорившись, все вместе не выбрали месячный бюджет за вечер.
const DAY_LIMIT_PERSON = 5;
const DAY_LIMIT_ALL = 300;

const MIN_PAIRS = 5;
const MAX_PAIRS = 60;
const FRESH_HOURS = 12;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });

/**
 * Задание для модели лежит в базе, в таблице prompts.
 *
 * Это главный текст продукта: от него напрямую зависит, стоит ли разбор
 * своих денег, и переписываться он будет ещё много раз. В коде он
 * означал бы разворачивание функции ради правки одной фразы.
 *
 * Здесь остаётся только запасной вариант — на случай, если база почему-то
 * не отдала текст. Он нарочно короткий: подробный дубль разошёлся бы с
 * настоящим заданием на второй же правке.
 */
const FALLBACK_PROMPT =
  "Ты читаешь ответы двух людей на одни и те же вопросы об отношениях. " +
  "Покажи, где их картины совпадают, где расходятся принципиально, а где " +
  "только на словах. Каждое утверждение подкрепляй дословной цитатой того, " +
  "кто это сказал, и никогда не приписывай одному сказанное другим. " +
  "Не выдавай разное за одинаковое. Пиши столько, сколько требует материал.";

async function promptFor(db: ReturnType<typeof createClient>, lang: string) {
  const { data } = await db
    .from("prompts")
    .select("body")
    .eq("key", "verdict")
    .eq("lang", lang === "en" ? "en" : "ru")
    .maybeSingle();
  return data?.body || FALLBACK_PROMPT;
}

/** Разбор от Claude. Возвращает текст либо бросает — тогда пробуем запасную. */
async function askClaude(system: string, material: string) {
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

  const res = await client.beta.messages.create({
    model: MODEL,
    // Прежние четыре тысячи вместе с «300–600 слов» в задании и давали ту
    // самую поверхностность: модель физически не могла написать разбор,
    // который стоит читать.
    max_tokens: 16000,
    output_config: { effort: "xhigh" },
    // Материал откровенный, и модель может отказаться его разбирать.
    // Тогда тот же запрос доигрывает соседняя модель — вместо пустоты.
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-4-8" }],
    system,
    messages: [{ role: "user", content: material }],
  });

  if (res.stop_reason === "refusal") throw new Error("модель отказалась разбирать материал");

  const text = res.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("пустой ответ");
  return text;
}

/** Запасная модель. Хуже, но лучше, чем «разбор не собрался». */
async function askGroq(system: string, material: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: material },
      ],
    }),
  });

  if (!res.ok) throw new Error((await res.text()).slice(0, 200));
  const payload = await res.json();
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("пустой ответ");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const auth = req.headers.get("authorization") || "";
    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: userData } = await asUser.auth.getUser();
    const me = userData.user?.id;
    if (!me) return json({ error: "Нужен вход" }, 401);

    const { connectionId, lang = "ru", refresh = false, questions = {} } = await req.json();
    if (!connectionId) return json({ error: "Не указана связь" }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // Участник ли он этой связи — проверяем сами, не доверяя клиенту.
    const { data: conn } = await db
      .from("connections")
      .select("id, a, b, status")
      .eq("id", connectionId)
      .maybeSingle();

    if (!conn || conn.status !== "active" || (conn.a !== me && conn.b !== me)) {
      return json({ error: "Связь не найдена" }, 403);
    }
    const other = conn.a === me ? conn.b : conn.a;

    // Свежий разбор переиспользуем: модель стоит денег и времени.
    if (!refresh) {
      const { data: cached } = await db
        .from("verdicts")
        .select("body, created_at")
        .eq("connection_id", connectionId)
        .eq("lang", lang)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - Date.parse(cached.created_at);
        if (age < FRESH_HOURS * 3600 * 1000) return json({ body: cached.body, cached: true });
      }
    }

    // Первый разбор бесплатен — он и продаёт остальные. Дальше нужен
    // открытый доступ: свой или того, с кем есть активная связь.
    const { count: madeBefore } = await db
      .from("verdicts")
      .select("id", { count: "exact", head: true })
      .eq("made_by", me);

    if ((madeBefore || 0) > 0 && !(await hasAccess(db, me))) {
      return json({ error: "locked" }, 402);
    }

    const since = new Date(Date.now() - 86400_000).toISOString();
    const [{ count: mineToday }, { count: allToday }] = await Promise.all([
      db.from("verdicts").select("id", { count: "exact", head: true })
        .eq("made_by", me).gte("created_at", since),
      db.from("verdicts").select("id", { count: "exact", head: true })
        .gte("created_at", since),
    ]);

    if ((mineToday || 0) >= DAY_LIMIT_PERSON) {
      return json({ error: "too-often", limit: DAY_LIMIT_PERSON }, 429);
    }
    if ((allToday || 0) >= DAY_LIMIT_ALL) {
      console.error("общий предел разборов исчерпан", allToday);
      return json({ error: "too-busy" }, 429);
    }

    // Скрытые темы исключаем: разбор не должен обходить приватность.
    const [{ data: hiddenMine }, { data: hiddenTheirs }] = await Promise.all([
      db.from("profiles").select("hidden_blocks, name").eq("id", me).maybeSingle(),
      db.from("profiles").select("hidden_blocks, name").eq("id", other).maybeSingle(),
    ]);
    const hidden = new Set([
      ...(hiddenMine?.hidden_blocks || []),
      ...(hiddenTheirs?.hidden_blocks || []),
    ]);

    const [{ data: mineRows }, { data: theirRows }, { data: marks }] = await Promise.all([
      db.from("answers").select("question_id, block, body").eq("user_id", me),
      db.from("answers").select("question_id, block, body").eq("user_id", other),
      db.from("reactions").select("question_id, value").eq("connection_id", connectionId),
    ]);

    const theirMap = new Map((theirRows || []).map((r) => [r.question_id, r]));
    const markMap = new Map((marks || []).map((r) => [r.question_id, r.value]));

    const pairs = (mineRows || [])
      .filter((r) => theirMap.has(r.question_id) && !hidden.has(r.block))
      .slice(0, MAX_PAIRS)
      .map((r) => ({
        qid: r.question_id,
        block: r.block,
        mine: r.body,
        theirs: theirMap.get(r.question_id)!.body,
        mark: markMap.get(r.question_id) || null,
      }));

    if (pairs.length < MIN_PAIRS) {
      return json({ error: "Мало открытых ответов", need: MIN_PAIRS, have: pairs.length }, 422);
    }

    const nameA = (hiddenMine?.name || (lang === "en" ? "Person A" : "Первый")).trim();
    const nameB = (hiddenTheirs?.name || (lang === "en" ? "Person B" : "Второй")).trim();

    // Каждая реплика подписана в отдельной строке заглавным именем. Плоский
    // список без подписей модель путала: на десятой паре она уже приписывала
    // одному человеку сказанное другим.
    const material = pairs
      .map((p, i) => {
        const q = questions[String(p.qid)];
        return [
          `### Вопрос ${i + 1} · тема «${p.block}»${p.mark ? ` · их общая отметка: ${p.mark}` : ""}`,
          q ? `Спрашивали: ${q}` : null,
          `ОТВЕТ — ${nameA.toUpperCase()}: ${p.mine}`,
          `ОТВЕТ — ${nameB.toUpperCase()}: ${p.theirs}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const system = await promptFor(db, lang);

    let body = "";
    let usedFallback = false;
    try {
      if (!ANTHROPIC_KEY) throw new Error("ключ Claude не задан");
      body = await askClaude(system, material);
    } catch (e) {
      console.error("claude", e instanceof Error ? e.message : e);
      if (!GROQ_KEY) {
        return json({ error: `Модель не ответила: ${e instanceof Error ? e.message : e}` }, 502);
      }
      try {
        body = await askGroq(system, material);
        usedFallback = true;
      } catch (e2) {
        console.error("groq", e2 instanceof Error ? e2.message : e2);
        return json({ error: `Модель не ответила: ${e2 instanceof Error ? e2.message : e2}` }, 502);
      }
    }

    await db.from("verdicts").insert({
      connection_id: connectionId,
      made_by: me,
      lang,
      body,
      pairs_used: pairs.length,
    });

    return json({ body, cached: false, pairs: pairs.length, fallback: usedFallback });
  } catch (e) {
    return json({ error: `Сбой функции: ${e instanceof Error ? e.message : e}` }, 500);
  }
});

/**
 * Доступ открыт, если купил я сам, купил кто-то, с кем я связана, — или
 * я тестировщик.
 *
 * Про тестировщика здесь пришлось вспомнить отдельно. Код открывал путь
 * только в приложении, а сервер про него не знал и отвечал «нужна оплата».
 * Получался замкнутый круг: человек вводит код, приложение его пускает,
 * сервер отказывает, приложение снова показывает экран оплаты.
 */
async function hasAccess(db: ReturnType<typeof createClient>, me: string) {
  const { count: tester } = await db
    .from("tester_codes")
    .select("code", { count: "exact", head: true })
    .eq("used_by", me);
  if ((tester || 0) > 0) return true;

  const { data: links } = await db
    .from("connections")
    .select("a, b")
    .eq("status", "active")
    .or(`a.eq.${me},b.eq.${me}`);

  const ids = new Set<string>([me]);
  for (const link of links || []) {
    ids.add(link.a);
    if (link.b) ids.add(link.b);
  }

  const { data: paid } = await db
    .from("profiles")
    .select("id, premium_for")
    .in("id", [...ids])
    .eq("premium", true);

  // Чужая покупка засчитывается, только если открыта именно мне.
  return (paid || []).some((p) => p.id === me || p.premium_for === me);
}
