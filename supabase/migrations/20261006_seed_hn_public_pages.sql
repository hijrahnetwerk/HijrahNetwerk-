-- Seed the existing public HN routes into the central management layer.
-- These records do NOT replace the existing public HTML pages. They give the admin
-- editor a canonical management record for the real route.

insert into public.hn_site_pages (slug,title,description,page_type,status,seo_title,seo_description)
values
('','Hijrah Netwerk','Een netwerk voor emigranten, van oriëntatie tot integratie.','home','published','Hijrah Netwerk | Van oriëntatie tot integratie','Een netwerk voor emigranten, van oriëntatie tot integratie.'),
('landen','Landen & Steden','Ontdek landen en steden en verzamel praktische informatie voor je hijrah.','directory','published','Landen & Steden | Hijrah Netwerk','Ontdek landen en steden en praktische informatie voor je hijrah.'),
('kennisbank','Kennisbank','Praktische informatie, uitleg en ervaringen over landen, steden en het leven als emigrant.','knowledge','published','Kennisbank | Hijrah Netwerk','Praktische informatie, uitleg en ervaringen over landen, steden en het leven als emigrant.'),
('navigatie','Hijrah Navigatie','Zoek concrete plekken en diensten voor je leven als emigrant.','navigation','published','Hijrah Navigatie | Hijrah Netwerk','Zoek concrete plekken en diensten voor je leven als emigrant.'),
('smart-search','Smart Search','Zoek gericht binnen de informatie van Hijrah Netwerk.','search','published','Smart Search | Hijrah Netwerk','Zoek gericht binnen de informatie van Hijrah Netwerk.'),
('community','Community','Een netwerk van zusters voor zusters, van emigrant tot emigrant.','community','published','Community | Hijrah Netwerk','Een netwerk van zusters voor zusters, van emigrant tot emigrant.'),
('stappenplan','Hijrah Stappenplan','Van eerste oriëntatie tot voorbereiding, vertrek en integratie.','tool','published','Hijrah Stappenplan | Hijrah Netwerk','Van eerste oriëntatie tot voorbereiding, vertrek en integratie.'),
('orientatie','Oriëntatie','Begin met helder krijgen wat jij nodig hebt voor jouw hijrah.','tool','published','Oriëntatie | Hijrah Netwerk','Begin met helder krijgen wat jij nodig hebt voor jouw hijrah.'),
('orientatietest','Oriëntatietest','Breng je situatie, wensen en aandachtspunten in kaart.','tool','published','Oriëntatietest | Hijrah Netwerk','Breng je situatie, wensen en aandachtspunten in kaart.'),
('voorbereiding','Voorbereiding','Bereid je praktische vertrek stap voor stap voor.','tool','published','Voorbereiding | Hijrah Netwerk','Bereid je praktische vertrek stap voor stap voor.'),
('vertrek','Vertrek','Alles rond de praktische overgang naar je nieuwe woonplaats.','tool','published','Vertrek | Hijrah Netwerk','Alles rond de praktische overgang naar je nieuwe woonplaats.'),
('integratie','Integratie','Informatie en hulpmiddelen voor het leven na aankomst.','tool','published','Integratie | Hijrah Netwerk','Informatie en hulpmiddelen voor het leven na aankomst.'),
('realiteitscheck','Realiteitscheck','Kijk nuchter naar wat een hijrah in de praktijk vraagt.','tool','published','Realiteitscheck | Hijrah Netwerk','Kijk nuchter naar wat een hijrah in de praktijk vraagt.'),
('verhalen','Verhalen','Lees ervaringen van emigranten en zusters uit de praktijk.','experiences','published','Verhalen | Hijrah Netwerk','Lees ervaringen van emigranten en zusters uit de praktijk.'),
('stedengids','Stedengids','Praktische gidsen per stad.','directory','published','Stedengids | Hijrah Netwerk','Praktische gidsen per stad.'),
('vergelijken','Vergelijken','Vergelijk landen en steden op punten die voor jouw situatie belangrijk zijn.','tool','published','Vergelijken | Hijrah Netwerk','Vergelijk landen en steden op punten die voor jouw situatie belangrijk zijn.'),
('hulp','Hulp','Praktische hulp en antwoorden voor je hijrah.','support','published','Hulp | Hijrah Netwerk','Praktische hulp en antwoorden voor je hijrah.')
on conflict (slug) do update set
  title=excluded.title,
  description=excluded.description,
  page_type=excluded.page_type,
  status='published',
  seo_title=excluded.seo_title,
  seo_description=excluded.seo_description;