-- Коды тестировщиков.
--
-- Каждому тестировщику выдаётся свой код. Он не открывает доступ на
-- сервере — только разрешает пропустить оплату на его телефоне. Зато по
-- отметке видно, кто из позванных дошёл до экрана оплаты и когда.
--
-- Таблица закрыта наглухо: политик чтения нет вовсе, снаружи с ней можно
-- работать только через функцию ниже. Иначе любой желающий вычитал бы
-- все коды разом.

create table if not exists tester_codes (
  code       text primary key,
  label      text not null default '',            -- кому выдан
  used_by    uuid references profiles(id) on delete set null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table tester_codes enable row level security;
revoke all on tester_codes from anon, authenticated;

/**
 * Проверяет код и закрепляет его за тем, кто ввёл. Код одноразовый, но
 * тот же человек может ввести его снова — иначе после переустановки
 * приложения тестировщик остался бы ни с чем.
 */
create or replace function redeem_tester_code(code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hit boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  update tester_codes t
     set used_by = auth.uid(),
         used_at = now()
   where t.code = lower(btrim(redeem_tester_code.code))
     and (t.used_by is null or t.used_by = auth.uid())
  returning true into hit;

  return coalesce(hit, false);
end;
$$;

grant execute on function redeem_tester_code(text) to authenticated;

-- ------------------------------------------------------------------
-- Как выдавать коды (запускать по мере надобности):
--
--   insert into tester_codes (code, label) values
--     ('dima-2026',   'Дмитрий'),
--     ('polina-2026', 'Полина'),
--     ('vova-2026',   'Владимир');
--
-- Кто и когда воспользовался:
--
--   select t.code, t.label, p.name, t.used_at
--   from tester_codes t
--   left join profiles p on p.id = t.used_by
--   order by t.created_at;
-- ------------------------------------------------------------------
