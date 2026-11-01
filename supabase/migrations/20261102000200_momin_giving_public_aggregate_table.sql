-- MOMIN Giving aggregate-only read model.
-- This follow-up replaces the SECURITY DEFINER aggregate view with a security-invoker
-- view (kept for compatibility) and an aggregate-only table used by the User app.

create table if not exists public.momin_giving_totals_public (
  campaign_id uuid not null references public.momin_giving_campaigns(id) on delete cascade,
  fund_category text not null,
  currency text not null,
  received_amount numeric(16,2) not null default 0,
  contribution_count integer not null default 0,
  primary key (campaign_id, fund_category, currency)
);

alter table public.momin_giving_totals_public enable row level security;
grant select on public.momin_giving_totals_public to authenticated;
grant all on public.momin_giving_totals_public to service_role;
drop policy if exists users_read_public_giving_totals_v2 on public.momin_giving_totals_public;
create policy users_read_public_giving_totals_v2
  on public.momin_giving_totals_public for select to authenticated using (true);

create or replace function public.momin_refresh_giving_totals_public()
returns trigger
language plpgsql
set search_path = ''
as $func$
begin
  if tg_op in ('UPDATE','DELETE') then
    delete from public.momin_giving_totals_public
    where campaign_id = old.campaign_id and fund_category = old.fund_category and currency = old.currency;
    insert into public.momin_giving_totals_public
      (campaign_id,fund_category,currency,received_amount,contribution_count)
    select campaign_id,fund_category,currency,coalesce(sum(amount),0)::numeric(16,2),count(*)::integer
    from public.momin_contributions
    where payment_status = 'verified' and campaign_id = old.campaign_id
      and fund_category = old.fund_category and currency = old.currency
    group by campaign_id,fund_category,currency
    on conflict (campaign_id,fund_category,currency) do update
      set received_amount = excluded.received_amount, contribution_count = excluded.contribution_count;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    delete from public.momin_giving_totals_public
    where campaign_id = new.campaign_id and fund_category = new.fund_category and currency = new.currency;
    insert into public.momin_giving_totals_public
      (campaign_id,fund_category,currency,received_amount,contribution_count)
    select campaign_id,fund_category,currency,coalesce(sum(amount),0)::numeric(16,2),count(*)::integer
    from public.momin_contributions
    where payment_status = 'verified' and campaign_id = new.campaign_id
      and fund_category = new.fund_category and currency = new.currency
    group by campaign_id,fund_category,currency
    on conflict (campaign_id,fund_category,currency) do update
      set received_amount = excluded.received_amount, contribution_count = excluded.contribution_count;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$func$;

drop trigger if exists momin_refresh_giving_totals_public on public.momin_contributions;
create trigger momin_refresh_giving_totals_public
after insert or update or delete on public.momin_contributions
for each row execute function public.momin_refresh_giving_totals_public();

insert into public.momin_giving_totals_public
  (campaign_id,fund_category,currency,received_amount,contribution_count)
select campaign_id,fund_category,currency,coalesce(sum(amount),0)::numeric(16,2),count(*)::integer
from public.momin_contributions
where payment_status = 'verified'
group by campaign_id,fund_category,currency
on conflict (campaign_id,fund_category,currency) do update
  set received_amount = excluded.received_amount, contribution_count = excluded.contribution_count;

create or replace view public.momin_public_giving_totals
with (security_invoker = true)
as
select campaign_id,fund_category,currency,
  sum(amount)::numeric(16,2) as received_amount,
  count(*)::integer as contribution_count
from public.momin_contributions
where payment_status = 'verified'
group by campaign_id,fund_category,currency;
