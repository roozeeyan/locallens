-- Relationship Game — таблицы и правила доступа.
-- Выполняется один раз целиком в Supabase → SQL Editor.
--
-- Главное правило продукта: ответ партнёра открывается только когда оба
-- ответили на один и тот же вопрос. Оно живёт здесь, в базе, а не в
-- приложении — обойти его из клиента нельзя.
--
-- Порядок важен: сначала создаются все таблицы, потом правила доступа,
-- потому что правила ссылаются друг на друга.

-- ============================================================== 1. Таблицы

create table if not exists profiles (
  id               uuid primary key references auth.users on delete cascade,
  tg_id            bigint unique,
  name             text not null default '',
  status           text not null default 'taken' check (status in ('taken', 'free')),
  theme            text not null default 'cream',
  lang             text not null default 'ru' check (lang in ('ru', 'en')),
  hidden_blocks    text[] not null default '{}',
  premium          boolean not null default false,
  reminder         text not null default 'week' check (reminder in ('week', 'twoweeks', 'off')),
  last_reminded_at timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists connections (
  id          uuid primary key default gen_random_uuid(),
  a           uuid not null references profiles(id) on delete cascade,
  b           uuid references profiles(id) on delete cascade,
  kind        text not null default 'candidate' check (kind in ('partner', 'candidate')),
  invite_code text unique not null,
  status      text not null default 'pending' check (status in ('pending', 'active')),
  created_at  timestamptz not null default now(),
  constraint  no_self_link check (b is null or b <> a)
);

create table if not exists answers (
  user_id     uuid not null references profiles(id) on delete cascade,
  question_id int  not null,
  block       text not null,
  body        text not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists reactions (
  connection_id uuid not null references connections(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  question_id   int  not null,
  value         text not null check (value in ('match', 'talk', 'differ')),
  updated_at    timestamptz not null default now(),
  primary key (connection_id, user_id, question_id)
);

create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  product    text not null,
  stars      int  not null,
  charge_id  text unique,
  created_at timestamptz not null default now()
);

create index if not exists connections_a_idx on connections(a);
create index if not exists connections_b_idx on connections(b);
create index if not exists answers_user_idx on answers(user_id);

-- ========================================================= 2. Защита включена

alter table profiles    enable row level security;
alter table connections enable row level security;
alter table answers     enable row level security;
alter table reactions   enable row level security;
alter table payments    enable row level security;

-- ========================================================== 3. Правила: связи

drop policy if exists "связи: вижу свои" on connections;
create policy "связи: вижу свои"
  on connections for select
  using (a = auth.uid() or b = auth.uid());

drop policy if exists "связи: приглашаю от своего имени" on connections;
create policy "связи: приглашаю от своего имени"
  on connections for insert
  with check (a = auth.uid() and b is null and status = 'pending');

drop policy if exists "связи: удаляю свои" on connections;
create policy "связи: удаляю свои"
  on connections for delete
  using (a = auth.uid() or b = auth.uid());

-- ======================================================= 4. Правила: профили

drop policy if exists "профиль: читаю свой" on profiles;
create policy "профиль: читаю свой"
  on profiles for select
  using (id = auth.uid());

drop policy if exists "профиль: читаю тех, с кем связан" on profiles;
create policy "профиль: читаю тех, с кем связан"
  on profiles for select
  using (exists (
    select 1 from connections c
    where c.status = 'active'
      and ((c.a = auth.uid() and c.b = profiles.id)
        or (c.b = auth.uid() and c.a = profiles.id))
  ));

drop policy if exists "профиль: меняю только свой" on profiles;
create policy "профиль: меняю только свой"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "профиль: создаю только свой" on profiles;
create policy "профиль: создаю только свой"
  on profiles for insert
  with check (id = auth.uid());

-- Поле premium пользователь себе выставить не может: право на запись выдано
-- только по перечисленным колонкам. Премиум ставит вебхук платежей, который
-- работает сервисным ключом в обход этих правил.
revoke update on profiles from authenticated;
grant update (name, status, theme, lang, hidden_blocks, reminder) on profiles to authenticated;

-- ============================================ 5. Вспомогательные проверки

-- Эти функции нужны, чтобы правило для ответов не обращалось к таблице
-- ответов напрямую: иначе правило вызывает само себя и запрос падает
-- с бесконечной рекурсией. Функции читают данные в обход правил, но
-- отдают наружу только «да/нет» и список скрытых блоков.

create or replace function me_answered(qid int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from answers
    where user_id = auth.uid() and question_id = qid
  );
$$;

create or replace function connected_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from connections
    where status = 'active'
      and ((a = auth.uid() and b = other) or (b = auth.uid() and a = other))
  );
$$;

create or replace function blocks_hidden_by(owner uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select hidden_blocks from profiles where id = owner), '{}');
$$;

revoke all on function me_answered(int) from public;
revoke all on function connected_with(uuid) from public;
revoke all on function blocks_hidden_by(uuid) from public;
grant execute on function me_answered(int) to authenticated;
grant execute on function connected_with(uuid) to authenticated;
grant execute on function blocks_hidden_by(uuid) to authenticated;

-- ======================================================== 6. Правила: ответы


drop policy if exists "ответы: свои вижу всегда" on answers;
create policy "ответы: свои вижу всегда"
  on answers for select
  using (user_id = auth.uid());

-- Чужой ответ виден при трёх условиях сразу:
--   1. между нами есть активная связь;
--   2. я ответил на этот же вопрос;
--   3. автор не скрыл этот блок в настройках приватности.
drop policy if exists "ответы: чужие вижу по взаимности" on answers;
create policy "ответы: чужие вижу по взаимности"
  on answers for select
  using (
    connected_with(answers.user_id)
    and me_answered(answers.question_id)
    and not blocks_hidden_by(answers.user_id) @> array[answers.block]
  );

drop policy if exists "ответы: пишу только свои" on answers;
create policy "ответы: пишу только свои"
  on answers for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ======================================================= 7. Правила: отметки

-- Отметки видны обоим участникам связи: на них считается процент совпадений
-- и на них же будет опираться разбор от ИИ.
drop policy if exists "отметки: вижу по своей связи" on reactions;
create policy "отметки: вижу по своей связи"
  on reactions for select
  using (exists (
    select 1 from connections c
    where c.id = reactions.connection_id
      and (c.a = auth.uid() or c.b = auth.uid())
  ));

drop policy if exists "отметки: ставлю только свои" on reactions;
create policy "отметки: ставлю только свои"
  on reactions for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from connections c
      where c.id = reactions.connection_id
        and c.status = 'active'
        and (c.a = auth.uid() or c.b = auth.uid())
    )
  );

-- ======================================================= 8. Правила: платежи

drop policy if exists "платежи: вижу свои" on payments;
create policy "платежи: вижу свои"
  on payments for select
  using (user_id = auth.uid());

-- Записывать платежи может только вебхук под сервисным ключом:
-- правила на запись здесь намеренно нет.

-- ================================================== 9. Приём приглашения

-- Приглашение принимается только через эту функцию: код нельзя подобрать
-- перебором по таблице, а чужую связь нельзя присвоить.
create or replace function accept_invite(code text)
returns connections
language plpgsql
security definer
set search_path = public
as $$
declare
  conn connections;
begin
  select * into conn from connections
  where invite_code = code and status = 'pending' and b is null;

  if not found then
    raise exception 'Приглашение не найдено или уже использовано';
  end if;

  if conn.a = auth.uid() then
    raise exception 'Нельзя принять собственное приглашение';
  end if;

  update connections
     set b = auth.uid(), status = 'active'
   where id = conn.id
  returning * into conn;

  return conn;
end;
$$;

revoke all on function accept_invite(text) from public;
grant execute on function accept_invite(text) to authenticated;
