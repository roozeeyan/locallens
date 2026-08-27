-- Кто позвал.
--
-- Человек открывает ссылку от близкого и первым делом хочет понять, от кого
-- она. Показать имя надо до того, как он что-то заполнит, — поэтому функция
-- отдаёт только имя пригласившего и вид связи, и только по действующему коду.
-- Ничего другого о нём наружу не уходит.

create or replace function invite_info(code text)
returns table (inviter text, kind text)
language sql
security definer
set search_path = public
as $$
  select coalesce(p.name, ''), c.kind
  from connections c
  join profiles p on p.id = c.a
  where c.invite_code = code
    and c.status = 'pending'
  limit 1;
$$;

grant execute on function invite_info(text) to anon, authenticated;
