update public.hn_site_pages
set title='Home — huidige versie', description='De echte huidige Home van Hijrah Netwerk. Deze beheerpagina verwijst rechtstreeks naar /.', page_type='home'
where slug='';

delete from public.hn_site_pages where slug in ('home','home-huidig');