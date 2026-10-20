begin;

drop policy if exists "Public can view privacy contact settings" on public.hn_site_settings;
create policy "Public can view privacy contact settings"
on public.hn_site_settings
for select to anon, authenticated
using (key = 'privacy_contact');

insert into public.hn_site_settings (key, value)
values ('privacy_contact', '{"responsible_name":"","privacy_email":"","postal_address":"","country":"Marokko"}'::jsonb)
on conflict (key) do nothing;

commit;
