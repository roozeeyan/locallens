-- Парный доступ: платит один — открывается обоим.
--
-- 1. Партнёр должен видеть, что доступ оплачен. Для этого читаемым
--    становится поле premium в профиле того, с кем есть активная связь
--    (правило чтения таких профилей уже есть, отдельного не нужно).
--
-- 2. Сколько партнёр ответил в закрытом блоке. Сами ответы остаются
--    закрытыми — наружу идёт только число. Это то, что делает покупку
--    осмысленной: видно, что там есть что открывать.

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

-- 3. Первый разбор от ИИ бесплатен — для этого нужно знать, кто его заказал.
alter table verdicts add column if not exists made_by uuid references profiles(id) on delete set null;
create index if not exists verdicts_made_by_idx on verdicts(made_by);

-- 4. Темы, выбранные при знакомстве, решают, какие три блока бесплатны.
--    Раньше они жили только на телефоне — на другом устройстве бесплатным
--    оказывалось не то, что человек просил.
alter table profiles add column if not exists topics text[] not null default '{}';
