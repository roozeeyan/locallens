-- Права на колонки профиля.
--
-- RLS проверяет строку, но не столбцы: в Postgres столбцы закрываются
-- только грантами. Из-за этого любой вошедший мог включить себе premium
-- одним запросом к собственной строке, а вписав чужой tg_id — перехватить
-- вход того, кто ещё ни разу не заходил через Telegram.
--
-- Отзыв по колонкам не работает, пока выдано право на всю таблицу:
-- Postgres не умеет вычитать столбцы из табличного гранта. Поэтому право
-- снимается целиком и выдаётся обратно поимённо.
--
-- Не выдаём клиенту:
--   premium, premium_for — ставит вебхук платежей и share_access
--   tg_id                — ставит telegram-auth
--   last_reminded_at     — ставит send-reminders
--   created_at           — ставит база

revoke update on public.profiles from anon, authenticated;
revoke insert on public.profiles from anon, authenticated;

grant update (name, status, theme, lang, reminder, hidden_blocks, topics, consent_at)
  on public.profiles to authenticated;

grant insert (id, name, status, theme, lang, reminder, hidden_blocks, topics, consent_at)
  on public.profiles to authenticated;

comment on column public.profiles.premium is
  'Ставит только вебхук платежей. Право записи у клиента отозвано намеренно — не выдавать заново.';
comment on column public.profiles.tg_id is
  'Ставит только telegram-auth. Право записи у клиента отозвано намеренно: чужой tg_id перехватывает вход.';

-- Связи меняет только accept_invite (SECURITY DEFINER). Политики UPDATE
-- на таблице нет, так что право и так не работало — убираем, чтобы оно
-- не выглядело разрешением.
revoke update on public.connections from anon, authenticated;
