-- Патч для баз, созданных до появления раздела «Доступ к таблицам».
-- Без этих прав любой запрос падает с ошибкой «permission denied for table».
-- Выполняется поверх существующей базы, ничего не стирает.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on connections to authenticated;
grant select, insert, update, delete on answers     to authenticated;
grant select, insert, update, delete on reactions   to authenticated;
grant select, insert                 on profiles    to authenticated;
grant select                         on payments    to authenticated;

-- premium остаётся недоступным для записи: его ставит только вебхук платежей.
revoke update on profiles from authenticated;
grant update (name, status, theme, lang, hidden_blocks, reminder) on profiles to authenticated;
