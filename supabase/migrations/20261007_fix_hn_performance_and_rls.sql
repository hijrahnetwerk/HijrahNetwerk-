begin;

do $$
declare
  r record;
  idx_name text;
begin
  for r in
    select n.nspname as schema_name,c.relname as table_name,a.attname as column_name
    from pg_constraint fk
    join pg_class c on c.oid=fk.conrelid
    join pg_namespace n on n.oid=c.relnamespace
    join pg_attribute a on a.attrelid=fk.conrelid and a.attnum=any(fk.conkey)
    where fk.contype='f'
      and n.nspname='public'
      and array_length(fk.conkey,1)=1
      and not exists (
        select 1 from pg_index i
        where i.indrelid=fk.conrelid
          and i.indisvalid and i.indisready
          and a.attnum=any(i.indkey)
      )
  loop
    idx_name:=left('idx_'||r.table_name||'_'||r.column_name||'_fk',60);
    execute format('create index if not exists %I on %I.%I (%I)',idx_name,r.schema_name,r.table_name,r.column_name);
  end loop;
end $$;

do $$
declare
  r record;
  q text;
begin
  for r in
    select schemaname,tablename,policyname,qual,with_check
    from pg_policies
    where schemaname='public'
      and (coalesce(qual,'') like '%auth.uid()%' or coalesce(with_check,'') like '%auth.uid()%')
  loop
    if r.qual is not null and r.qual like '%auth.uid()%' then
      q:=replace(r.qual,'auth.uid()','(select auth.uid())');
      execute format('alter policy %I on %I.%I using (%s)',r.policyname,r.schemaname,r.tablename,q);
    end if;
    if r.with_check is not null and r.with_check like '%auth.uid()%' then
      q:=replace(r.with_check,'auth.uid()','(select auth.uid())');
      execute format('alter policy %I on %I.%I with check (%s)',r.policyname,r.schemaname,r.tablename,q);
    end if;
  end loop;
end $$;

commit;