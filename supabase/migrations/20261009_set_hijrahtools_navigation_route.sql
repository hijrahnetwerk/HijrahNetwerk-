-- HijrahTools krijgt een eigen route. /orientatie blijft fase 1.
-- Idempotent: veilig opnieuw uit te voeren.
update public.hn_navigation_items
set href = '/hijrahtools'
where label = 'HijrahTools';
