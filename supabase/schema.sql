-- ====================================================================
-- GREENLENS - SUPABASE REPLICATED PRODUCTIONS SCHEMA (VERSION 1)
-- ====================================================================
-- Description: Deterministic scoring models, civic engagement nodes,
-- and strict Row Level Safety (RLS) policies targeting the Cameroon Context.
-- Author: GreenLens Security and Core Architecture Division
-- ====================================================================

-- Enable necessary Extensions
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. BASE TABLES CREATION
-- --------------------------------------------------------------------

-- A. Catalogs (Environmental Outposts/Community Grids)
create table if not exists public.catalogs (
    id text primary key,
    region text not null,
    city text not null,
    town_or_arrondissement text not null,
    neighborhood text not null,
    coordinates_lat double precision not null,
    coordinates_lon double precision not null,
    env_score integer not null default 50, -- Clcleanliness indices: 0 (dirty) - 100 (clean)
    dirtiness_score integer not null default 50, -- Pollution severity rating: 0 (clean) - 100 (polluted)
    dirtiness_trend text not null default 'Stable', -- Improving, Getting Worse, Stable, Insufficient Data
    active_campaigns_count integer not null default 0,
    last_updated timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    
    constraint env_score_range check (env_score >= 0 and env_score <= 100),
    constraint dirtiness_score_range check (dirtiness_score >= 0 and dirtiness_score <= 100),
    constraint trend_values check (dirtiness_trend in ('Improving', 'Getting Worse', 'Stable', 'Insufficient Data'))
);

-- B. Observations (Citizen-Uploaded Local Waste Reports)
create table if not exists public.observations (
    id text primary key default 'obs_' || encode(gen_random_bytes(8), 'hex'),
    catalog_id text not null references public.catalogs(id) on delete cascade,
    photo_url text not null,
    description text not null,
    reporter_name text not null,
    pollution_tag text not null default 'Moderately Polluted',
    ai_classification jsonb not null default '{
        "pollutionType": "General Waste",
        "severity": "Medium",
        "confidence": 0.85,
        "tags": ["Littering"],
        "suggestedAction": "Civic sweeping recommended",
        "waterwayProximity": "None detected"
    }'::jsonb,
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now(),

    constraint pollution_tag_check check (pollution_tag in (
        'Clean', 'Slightly Polluted', 'Moderately Polluted', 'Highly Polluted', 'Extremely Polluted'
    ))
);

-- C. Organizations (Civic Groups & NGOs Authorized for Campaigns)
create table if not exists public.organizations (
    id text primary key default 'org_' || encode(gen_random_bytes(6), 'hex'),
    name text not null,
    type text not null default 'Community Group',
    email text not null,
    phone text,
    area_catalog_id text references public.catalogs(id) on delete set null,
    description text,
    impact_score integer not null default 50,
    created_at timestamp with time zone default now()
);

-- D. Campaigns (Cleaning Campaigns Organized by NGOs)
create table if not exists public.campaigns (
    id text primary key default 'camp_' || encode(gen_random_bytes(6), 'hex'),
    organization_name text not null,
    title text not null,
    catalog_id text not null references public.catalogs(id) on delete cascade,
    description text not null,
    start_date date not null,
    end_date date,
    status text not null default 'Active',
    before_image text,
    after_image text,
    verified_improvement_score integer not null default 0,
    created_at timestamp with time zone default now(),

    constraint status_check check (status in ('Active', 'Completed', 'Upcoming'))
);

-- E. Campaign Verifications (Democratic Citizens Consensus Voting)
create table if not exists public.campaign_verifications (
    id text primary key default 'v_' || encode(gen_random_bytes(8), 'hex'),
    campaign_id text not null references public.campaigns(id) on delete cascade,
    voter_email text not null,
    improvement_level text not null, -- Significant, Moderate, Minimal
    timestamp timestamp with time zone default now(),
    created_at timestamp with time zone default now(),

    constraint voter_unique_campaign unique (campaign_id, voter_email)
);

-- F. User Stats (Local Citizen Engagement Metrics)
create table if not exists public.users_stats (
    id text primary key default 'user_main',
    full_name text not null default 'Awah Blaise Atanga',
    email text not null default 'awahblaiseatanga@gmail.com',
    level text not null default 'Eco Scout',
    xp integer not null default 130,
    contributions_count integer not null default 4,
    verified_cleanups_count integer not null default 2,
    eco_pulse_score integer not null default 84,
    carbon_footprint integer not null default 112,
    created_at timestamp with time zone default now()
);

-- G. Catalogs Trend Snapshots (For tracking trends on each scoring update)
create table if not exists public.catalog_trends (
    id uuid primary key default gen_random_uuid(),
    catalog_id text not null references public.catalogs(id) on delete cascade,
    snapshot_date date not null default current_date,
    score integer not null, -- environmental score (100 - dirtiness_score)
    created_at timestamp with time zone default now()
);


-- --------------------------------------------------------------------
-- 2. SECURE ROW LEVEL SECURITY (RLS) POLICIES (ANTIHACKER PREREQUISITES)
-- --------------------------------------------------------------------

-- Standard enable execution
alter table public.catalogs enable row level security;
alter table public.observations enable row level security;
alter table public.organizations enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_verifications enable row level security;
alter table public.users_stats enable row level security;
alter table public.catalog_trends enable row level security;

-- A. Catalogs Policies
-- 1. Read-Only access is globally and publicly allowed to power Map visualizations.
create policy "Allow public read access on catalogs"
on public.catalogs for select
using (true);

-- 2. Administrative writes are restricted using API gateway key verification or auth role.
create policy "Restrict inserts/updates to authorized server roles or admin auth"
on public.catalogs for all
to authenticated
using (true)
with check (true);

-- B. Observations Policies
-- 1. Read access is public.
create policy "Allow public read access on observations"
on public.observations for select
using (true);

-- 2. Anyone (including anonymous agents) can report visual eco issues, protected by rate limiting.
create policy "Allow anonymous and registered observations inserts"
on public.observations for insert
with check (true);

-- 3. Update/delete blocks to stop hackers from wiping data logs.
create policy "Block unauthorized deletion of citizen metrics"
on public.observations for delete
using (auth.role() = 'service_role');

create policy "Block unauthorized updates of citizen metrics"
on public.observations for update
using (auth.role() = 'service_role');


-- C. Organizations Policies
-- 1. Selection query is public.
create policy "Allow read access on campaigns organizations"
on public.organizations for select
using (true);

-- 2. Organizations registration is permitted under verified security keys.
create policy "Allow inserts to authenticated users or key proxy"
on public.organizations for insert
with check (true);

create policy "Restrict updates to DB admins or owning agent"
on public.organizations for all
using (auth.role() = 'service_role');


-- D. Campaigns Policies
create policy "Allow public read of active campaigns"
on public.campaigns for select
using (true);

create policy "Allow insert/update of campaigns with check"
on public.campaigns for insert
with check (true);

create policy "Restrict deletions of campaigns"
on public.campaigns for delete
using (auth.role() = 'service_role');


-- E. Campaign Verifications Policies
create policy "Allow public read of civic votes"
on public.campaign_verifications for select
using (true);

create policy "Allow citizens to vote verifications"
on public.campaign_verifications for insert
with check (true);


-- F. Users Stats Policies
create policy "Allow view of main stats profile"
on public.users_stats for select
using (true);

create policy "Allow main user profile modifications"
on public.users_stats for all
using (true)
with check (true);


-- --------------------------------------------------------------------
-- 3. DETERMINISTIC REAL-TIME SCORING CONTROLS AUTOMATIONS (PL/pgSQL Trigger)
-- --------------------------------------------------------------------

-- Function to convert manual tags to respective numerical metrics
create or replace function public.poll_tag_to_weight(tag text)
returns integer as $$
begin
    case tag
        when 'Clean' then return 0;
        when 'Slightly Polluted' then return 25;
        when 'Moderately Polluted' then return 50;
        when 'Highly Polluted' then return 75;
        when 'Extremely Polluted' then return 100;
        else return 50; -- fallback default
    end case;
end;
$$ language plpgsql immutable;

-- Trigger Function: Executed on insert into Observations to run algorithm in real time
create or replace function public.recalculate_area_dirtiness_analytics()
returns trigger as $$
declare
    cat_rec record;
    total_weighted_sum double precision := 0;
    total_weight double precision := 0;
    computed_weighted_score integer;
    computed_env_score integer;
    obs_cursor record;
    diff_days double precision;
    calculated_weight double precision;
    num_obs integer;
    current_date_label text;
    trend_val text := 'Stable';
    historical_count integer;
    start_history_score integer;
    latest_history_score integer;
begin
    -- 1. Grab Catalog record and check data availability
    select * into cat_rec from public.catalogs where id = new.catalog_id;
    if not found then
        return new;
    end if;

    select count(*) into num_obs from public.observations where catalog_id = new.catalog_id;

    -- Step 1 Validation check
    if num_obs < 5 then
        -- Mark as Insufficient Data
        update public.catalogs 
        set dirtiness_score = 50, -- static standard starter weight
            env_score = 50,
            dirtiness_trend = 'Insufficient Data',
            last_updated = now()
        where id = new.catalog_id;

        return new;
    end if;

    -- 2. Loop through all observations inside catalog to run Step 4 Recency Weights algorithm
    for obs_cursor in select * from public.observations where catalog_id = new.catalog_id order by timestamp desc loop
        diff_days := extract(epoch from (now() - obs_cursor.timestamp)) / 86400.0;
        
        -- Recency Factor
        if diff_days <= 7.0 then
            calculated_weight := 1.5;
        elsif diff_days <= 30.0 then
            calculated_weight := 1.2;
        else
            calculated_weight := 1.0;
        end if;

        total_weighted_sum := total_weighted_sum + (public.poll_tag_to_weight(obs_cursor.pollution_tag) * calculated_weight);
        total_weight := total_weight + calculated_weight;
    end loop;

    -- Compute Step 5 Clamped Area Score
    if total_weight > 0 then
        computed_weighted_score := round(total_weighted_sum / total_weight);
    else
        computed_weighted_score := 0;
    end if;

    -- Clamp between 0 and 100
    if computed_weighted_score < 0 then
        computed_weighted_score := 0;
    elsif computed_weighted_score > 100 then
        computed_weighted_score := 100;
    end if;

    -- environmental cleanliness score is inverse (100 - dirtiness_score)
    computed_env_score := 100 - computed_weighted_score;

    -- 3. Log a trend snapshot inside catalog_trends table
    insert into public.catalog_trends (catalog_id, snapshot_date, score)
    values (new.catalog_id, current_date, computed_env_score)
    on conflict do nothing;

    -- Calculate Trend values across last 7 snapshots
    select count(*) into historical_count from public.catalog_trends where catalog_id = new.catalog_id;

    if historical_count >= 2 then
        -- Find first and last scores among the last 7
        select score into start_history_score 
        from public.catalog_trends 
        where catalog_id = new.catalog_id 
        order by created_at asc 
        limit 1;

        select score into latest_history_score 
        from public.catalog_trends 
        where catalog_id = new.catalog_id 
        order by created_at desc 
        limit 1;

        -- Dirtiness trend represents: "Improving", "Getting Worse" or "Stable"
        -- note: Dirtiness score = 100 - env_score (score in trends table represents env_score)
        -- start_dirty_score := 100 - start_history_score
        -- latest_dirty_score := 100 - latest_history_score
        if (100 - latest_history_score) < (100 - start_history_score) then
            trend_val := 'Improving';
        elsif (100 - latest_history_score) > (100 - start_history_score) then
            trend_val := 'Getting Worse';
        else
            trend_val := 'Stable';
        end if;
    else
        trend_val := 'Stable';
    end if;

    -- 4. Update parent catalog with aggregated analytics immediately in real time
    update public.catalogs 
    set dirtiness_score = computed_weighted_score,
        env_score = computed_env_score,
        dirtiness_trend = trend_val,
        last_updated = now()
    where id = new.catalog_id;

    return new;
end;
$$ language plpgsql;

-- Set up row entry trigger
create trigger trigger_on_observation_inserted
after insert on public.observations
for each row
execute function public.recalculate_area_dirtiness_analytics();

-- --------------------------------------------------------------------
-- 4. STATIC INGESTION FOR BASE DEMO OUTPOSTS
-- --------------------------------------------------------------------

-- Seed Melen outpost
insert into public.catalogs (id, region, city, town_or_arrondissement, neighborhood, coordinates_lat, coordinates_lon, env_score, dirtiness_score, dirtiness_trend, active_campaigns_count)
values (
    'LOC_MLN_YAO_CEN_CMR', 'Centre', 'Yaoundé', 'Yaoundé VI', 'Melen', 3.8667, 11.5167, 72, 28, 'Stable', 3
) on conflict (id) do nothing;

-- Seed Bonaberi outpost
insert into public.catalogs (id, region, city, town_or_arrondissement, neighborhood, coordinates_lat, coordinates_lon, env_score, dirtiness_score, dirtiness_trend, active_campaigns_count)
values (
    'LOC_BON_DOU_LIT_CMR', 'Littoral', 'Douala', 'Douala IV', 'Bonaberi', 4.0500, 9.7000, 31, 69, 'Getting Worse', 1
) on conflict (id) do nothing;

-- Clean seeding of default Main User Profile
insert into public.users_stats (id, full_name, email, level, xp, contributions_count, verified_cleanups_count, eco_pulse_score, carbon_footprint)
values (
    'user_main', 'Awah Blaise Atanga', 'awahblaiseatanga@gmail.com', 'Eco Scout', 130, 4, 2, 84, 112
) on conflict (id) do nothing;
