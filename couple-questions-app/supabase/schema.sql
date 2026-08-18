-- Relationship Game — схема и правила доступа.
-- Выполнить один раз в Supabase → SQL Editor.
--
-- Главное правило продукта: ответ партнёра открывается только когда оба
-- ответили на один и тот же вопрос. Оно реализовано политиками RLS, то есть
-- живёт в базе. Клиент не может его обойти — даже прямым запросом к API.

-- ---------------------------------------------------------------- профили

create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  tg_id         bigint unique,
  name          text not null default '',
  status        text not null default 'taken' check (status in ('taken', 'free')),
  theme         text not null default 'cream',
  hidden_blocks text[] not null default '{}',
  premium       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "профиль: читаю свой"
  on profiles for select
  using (id = auth.uid());

create policy "профиль: читаю тех, с кем связан"
  on profiles for select
  using (exists (
    select 1 from connections c
    where c.status = 'active'
      and ((c.a = auth.uid() and c.b = profiles.id)
        or (c.b = auth.uid() and c.a = profiles.id))
  ));

create policy "профиль: меняю только свой"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "профиль: создаю только свой"
  on profiles for insert
  with check (id = auth.uid());

-- Поле premium пользователь себе выставить не может: правом на запись
-- обладают только перечисленные колонки. Премиум ставит вебхук платежей,
-- работающий под сервисным ключом в обход RLS.
revoke update on profiles from authenticated;
grant update (name, status, theme, hidden_blocks) on profiles to authenticated;

-- ---------------------------------------------------------------- ответы

create table if not exists answers (
  user_id     uuid not null references profiles(id) on delete cascade,
  question_id int  not null,
  block       text not null,
  body        text not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table answers enable row level security;

create policy "ответы: свои вижу всегда"
  on answers for select
  using (user_id = auth.uid());

-- Чужой ответ виден при трёх условиях сразу:
--   1. между нами есть активная связь;
--   2. я ответил на этот же вопрос;
--   3. автор не скрыл этот блок в настройках приватности.
create policy "ответы: чужие вижу по взаимности"
  on answers for select
  using (
    exists (
      select 1 from connections c
      where c.status = 'active'
        and ((c.a = auth.uid() and c.b = answers.user_id)
          or (c.b = auth.uid() and c.a = answers.user_id))
    )
    and exists (
      select 1 from answers mine
      where mine.user_id = auth.uid()
        and mine.question_id = answers.question_id
    )
    and not (
      select hidden_blocks from profiles where id = answers.user_id
    ) @> array[answers.block]
  );

create policy "ответы: пишу только свои"
  on answers for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------- связи

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

create index if not exists connections_a_idx on connections(a);
create index if not exists connections_b_idx on connections(b);

alter table connections enable row level security;

create policy "связи: вижу свои"
  on connections for select
  using (a = auth.uid() or b = auth.uid());

create policy "связи: приглашаю от своего имени"
  on connections for insert
  with check (a = auth.uid() and b is null and status = 'pending');

create policy "связи: удаляю свои"
  on connections for delete
  using (a = auth.uid() or b = auth.uid());

-- Приглашение принимается только через эту функцию: код нигде не перебирается
-- построчно, а сама связь не может быть подменена на чужую.
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

-- ---------------------------------------------------------------- отметки

create table if not exists reactions (
  connection_id uuid not null references connections(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  question_id   int  not null,
  value         text not null check (value in ('match', 'talk', 'differ')),
  updated_at    timestamptz not null default now(),
  primary key (connection_id, user_id, question_id)
);

alter table reactions enable row level security;

-- Отметки видны обоим участникам связи: на них строится процент совпадений
-- и на них же будет опираться разбор от ИИ.
create policy "отметки: вижу по своей связи"
  on reactions for select
  using (exists (
    select 1 from connections c
    where c.id = reactions.connection_id
      and (c.a = auth.uid() or c.b = auth.uid())
  ));

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

-- ---------------------------------------------------------------- платежи

create table if not exists payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  product    text not null,
  stars      int  not null,
  charge_id  text unique,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "платежи: вижу свои"
  on payments for select
  using (user_id = auth.uid());

-- Записывать платежи может только вебхук под сервисным ключом:
-- политики на insert намеренно нет.
