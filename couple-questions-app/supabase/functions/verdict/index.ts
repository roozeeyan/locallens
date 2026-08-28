// Разбор от ИИ: читает открытые пары ответов и отметки, возвращает текст.
//
// Ключ модели живёт только здесь. Клиент не может ни увидеть его, ни
// попросить разбор по чужой связи: функция сама проверяет, что человек
// участник этой связи, и сама отбирает вопросы, открытые обоим.
//
// Секреты:
//   supabase secrets set GROQ_API_KEY=...
// Деплой:
//   supabase functions deploy verdict
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_KEY = Deno.env.get("GROQ_API_KEY")!;

const MODEL = "openai/gpt-oss-120b";
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

const PROMPT = {
  ru: `Ты — внимательный семейный консультант. Тебе дали ответы двух людей на одни и те же вопросы об отношениях, а также их собственные отметки: где они видят совпадение, что хотят обсудить, где расходятся.

Напиши разбор по-русски, 250–400 слов, в четырёх частях с подзаголовками:
1. В чём вы совпадаете — назови конкретные темы, опираясь на их слова.
2. О чём стоит поговорить — различия, которые обычно всплывают позже.
3. На что обратить внимание — то, что может стать трудным. Мягко, без приговоров.
4. Один вопрос на вечер — который стоит задать друг другу вслух.

Правила: пиши на «вы», обращаясь к паре. Опирайся только на приведённые ответы, ничего не выдумывай. Не ставь диагнозов и не давай медицинских советов. Не советуй расстаться или пожениться — это их решение. Без вводных фраз вроде «на основе анализа».`,
  en: `You are an attentive relationship counsellor. You are given two people's answers to the same relationship questions, plus their own marks: where they see a match, what they want to discuss, where they differ.

Write an assessment in English, 250–400 words, in four parts with headings:
1. Where you agree — name concrete themes, grounded in their words.
2. What is worth talking about — differences that usually surface later.
3. What to watch — what could become hard. Gently, no verdicts.
4. One question for tonight — to ask each other out loud.

Rules: address the couple directly. Rely only on the answers given, invent nothing. No diagnoses, no medical advice. Do not advise breaking up or getting married — that is their decision. No preambles like "based on the analysis".`,
};

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

    const { connectionId, lang = "ru", refresh = false } = await req.json();
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

    // Скрытые блоки исключаем: разбор не должен обходить приватность.
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
        block: r.block,
        mine: r.body,
        theirs: theirMap.get(r.question_id)!.body,
        mark: markMap.get(r.question_id) || null,
      }));

    if (pairs.length < MIN_PAIRS) {
      return json({ error: "Мало открытых ответов", need: MIN_PAIRS, have: pairs.length }, 422);
    }

    const nameA = hiddenMine?.name || (lang === "en" ? "Person A" : "Первый");
    const nameB = hiddenTheirs?.name || (lang === "en" ? "Person B" : "Второй");

    const material = pairs
      .map(
        (p) =>
          `[${p.block}]${p.mark ? ` (отметка: ${p.mark})` : ""}\n${nameA}: ${p.mine}\n${nameB}: ${p.theirs}`
      )
      .join("\n\n");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 900,
        messages: [
          { role: "system", content: PROMPT[lang === "en" ? "en" : "ru"] },
          { role: "user", content: material },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: "Модель не ответила", detail: detail.slice(0, 300) }, 502);
    }

    const payload = await res.json();
    const body = payload.choices?.[0]?.message?.content?.trim();
    if (!body) return json({ error: "Пустой ответ модели" }, 502);

    await db.from("verdicts").insert({
      connection_id: connectionId,
      made_by: me,
      lang,
      body,
      pairs_used: pairs.length,
    });

    return json({ body, cached: false, pairs: pairs.length });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

/** Доступ открыт, если купил я сам или кто-то, с кем я связана. */
async function hasAccess(db: ReturnType<typeof createClient>, me: string) {
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
