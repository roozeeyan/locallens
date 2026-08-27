-- Догоняющий патч: добавляет всё, чего не хватает в базе.
--
-- Собран из тех кусков schema.sql, которые появились после первой
-- установки. Каждый шаг проверяет, есть ли уже нужное, поэтому скрипт
-- можно запускать сколько угодно раз — лишнего он не сделает и ничего
-- не сотрёт.

-- ------------------------------------------------- 1. Поля профиля

alter table profiles add column if not exists premium          boolean not null default false;
alter table profiles add column if not exists reminder         text    not null default 'week';
alter table profiles add column if not exists consent_at       timestamptz;
alter table profiles add column if not exists last_reminded_at timestamptz;
alter table profiles add column if not exists topics           text[]  not null default '{}';
alter table profiles add column if not exists premium_for      uuid references profiles(id) on delete set null;

alter table profiles drop constraint if exists profiles_reminder_check;
alter table profiles add  constraint profiles_reminder_check
  check (reminder in ('twice', 'week', 'off'));

-- ------------------------------------------------- 2. Вид связи

alter table connections drop constraint if exists connections_kind_check;
alter table connections add  constraint connections_kind_check
  check (kind in ('partner', 'candidate', 'friend'));

-- ------------------------------------------------- 3. Совместная выгрузка

create table if not exists export_consents (
  connection_id uuid not null references connections(id) on delete cascade,
  user_id       uuid not null references profiles(id)    on delete cascade,
  granted_at    timestamptz not null default now(),
  primary key (connection_id, user_id)
);

alter table export_consents enable row level security;
grant select, insert, delete on export_consents to authenticated;

drop policy if exists "выгрузка: вижу по своей связи" on export_consents;
create policy "выгрузка: вижу по своей связи"
  on export_consents for select
  using (exists (
    select 1 from connections c
    where c.id = export_consents.connection_id
      and (c.a = auth.uid() or c.b = auth.uid())
  ));

drop policy if exists "выгрузка: разрешаю только за себя" on export_consents;
create policy "выгрузка: разрешаю только за себя"
  on export_consents for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from connections c
      where c.id = export_consents.connection_id
        and c.status = 'active'
        and (c.a = auth.uid() or c.b = auth.uid())
    )
  );

drop policy if exists "выгрузка: отзываю только своё" on export_consents;
create policy "выгрузка: отзываю только своё"
  on export_consents for delete
  using (user_id = auth.uid());

-- ------------------------------------------------- 4. Разбор от ИИ

create table if not exists verdicts (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections(id) on delete cascade,
  lang          text not null default 'ru' check (lang in ('ru', 'en')),
  body          text not null,
  pairs_used    int  not null default 0,
  created_at    timestamptz not null default now()
);

-- Кто заказал разбор: первый бесплатен, значит их надо считать.
alter table verdicts add column if not exists made_by uuid references profiles(id) on delete set null;

create index if not exists verdicts_conn_idx    on verdicts(connection_id, lang, created_at desc);
create index if not exists verdicts_made_by_idx on verdicts(made_by);

alter table verdicts enable row level security;
grant select on verdicts to authenticated;

drop policy if exists "разбор: вижу по своей связи" on verdicts;
create policy "разбор: вижу по своей связи"
  on verdicts for select
  using (exists (
    select 1 from connections c
    where c.id = verdicts.connection_id
      and (c.a = auth.uid() or c.b = auth.uid())
  ));

-- ------------------------------------------------- 5. Ответы партнёра: только счёт

create or replace function partner_answer_counts()
returns table (other_id uuid, block text, n int)
language sql
security definer
set search_path = public
as $$
  select a.user_id, a.block, count(*)::int
  from answers a
  where a.user_id in (
    select case when c.a = auth.uid() then c.b else c.a end
    from connections c
    where c.status = 'active'
      and c.b is not null
      and (c.a = auth.uid() or c.b = auth.uid())
  )
  group by a.user_id, a.block;
$$;

grant execute on function partner_answer_counts() to authenticated;

-- ------------------------------------------------- 6. Доступ одному человеку

create or replace function share_access(target uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  -- Только тот, кто оплатил, и только пока никому ещё не открыл.
  if not exists (
    select 1 from profiles
    where id = auth.uid() and premium and premium_for is null
  ) then
    return false;
  end if;

  -- И только тому, с кем есть активная связь.
  select exists (
    select 1 from connections c
    where c.status = 'active'
      and ((c.a = auth.uid() and c.b = target) or (c.b = auth.uid() and c.a = target))
  ) into ok;

  if not ok then return false; end if;

  update profiles set premium_for = target where id = auth.uid();
  return true;
end;
$$;

grant execute on function share_access(uuid) to authenticated;

-- ------------------------------------------------- 7. Права на таблицы

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on connections to authenticated;
grant select, insert, update, delete on answers     to authenticated;
grant select, insert, update, delete on reactions   to authenticated;
grant select, insert, update         on profiles    to authenticated;
grant select                         on payments    to authenticated;
