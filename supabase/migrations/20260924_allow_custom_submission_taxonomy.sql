alter table public.submissions
  add column if not exists country_name text,
  add column if not exists city_name text,
  add column if not exists category_name text,
  add column if not exists subcategory_name text;

alter table public.submissions
  add constraint submissions_country_name_length_check
    check (country_name is null or char_length(btrim(country_name)) between 1 and 100),
  add constraint submissions_city_name_length_check
    check (city_name is null or char_length(btrim(city_name)) between 1 and 100),
  add constraint submissions_category_name_length_check
    check (category_name is null or char_length(btrim(category_name)) between 1 and 100),
  add constraint submissions_subcategory_name_length_check
    check (subcategory_name is null or char_length(btrim(subcategory_name)) between 1 and 100);