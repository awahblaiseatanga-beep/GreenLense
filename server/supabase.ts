import { createClient } from "@supabase/supabase-js";

let supabaseInstance: any = null;

function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim();
  clean = clean.replace(/\/+$/, "");
  clean = clean.replace(/\/(rest|auth)\/v1\/?$/, "");
  if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

/**
 * Lazy Initializer for the Supabase Client.
 * Runs on-demand and degrades gracefully if environment credentials are not present.
 */
export function getSupabase(): any {
  if (!supabaseInstance) {
    const rawUrl = process.env.SUPABASE_URL;
    const url = sanitizeSupabaseUrl(rawUrl);
    // Prefer service role key on the server to bypass RLS for administrative synchronization,
    // fallback to anon key if preferred by the infrastructure.
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

    if (url && key && url.includes(".")) {
      try {
        supabaseInstance = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log("⚡ GreenLens Database: Live Supabase Backend activated successfully on sanitized URL:", url);
      } catch (err) {
        console.warn("❌ Failed to initiate Supabase database connection:", err);
      }
    } else {
      console.warn("⚠️ SUPABASE_URL or keys are missing in the runtime environment. Running in stateful Offline Simulation Mode.");
    }
  }
  return supabaseInstance;
}

export function handleSupabaseError(context: string, err: any): void {
  const isTableMissing = err && (
    (err?.code === "42P01") ||
    (typeof err?.message === "string" && err.message.includes("relation") && err.message.includes("does not exist"))
  );
  if (isTableMissing) {
    console.warn(`💡 Supabase Setup Warning: The database tables needed for "${context}" do not exist yet in your Supabase project. Copy the contents of '/supabase/schema.sql' and run it in the SQL Editor of your Supabase dashboard to activate.`);
  } else {
    console.warn(`⚠️ Supabase Warning [${context}]:`, err?.message || err);
  }
}

// --------------------------------------------------------------------
// DATABASE FIELD MAPPERS (PgSQL snake_case <=> TypeScript camelCase)
// --------------------------------------------------------------------

export function mapCatalogToClient(row: any, observations: any[] = [], campaigns: any[] = []): any {
  if (!row) return null;
  return {
    id: row.id,
    region: row.region,
    city: row.city,
    townOrArrondissement: row.town_or_arrondissement,
    neighborhood: row.neighborhood,
    envScore: row.env_score,
    dirtinessScore: row.dirtiness_score === -1 ? "Insufficient Data" : row.dirtiness_score,
    dirtinessTrend: row.dirtiness_trend,
    activeCampaignsCount: row.active_campaigns_count,
    lastUpdated: row.last_updated ? new Date(row.last_updated).toLocaleDateString() : "N/A",
    coordinates: {
      lat: row.coordinates_lat,
      lon: row.coordinates_lon,
    },
    trends: [], // Loaded from catalog_trends if necessary or calculated
    observations: (observations || []).map((o: any) => mapObservationToClient(o)).filter(Boolean),
    campaigns: (campaigns || []).map((c: any) => mapCampaignToClient(c)).filter(Boolean),
  };
}

export function mapObservationToClient(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    catalogId: row.catalog_id,
    photoUrl: row.photo_url,
    description: row.description,
    reporterName: row.reporter_name,
    timestamp: row.timestamp,
    pollutionTag: row.pollution_tag,
    aiClassification: typeof row.ai_classification === "string" 
      ? JSON.parse(row.ai_classification) 
      : row.ai_classification,
  };
}

export function mapOrganizationToClient(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    email: row.email,
    phone: row.phone || "",
    areaCatalogId: row.area_catalog_id,
    description: row.description || "",
    impactScore: row.impact_score,
  };
}

export function mapCampaignToClient(row: any, verifications: any[] = []): any {
  if (!row) return null;
  return {
    id: row.id,
    organizationName: row.organization_name,
    title: row.title,
    catalogId: row.catalog_id,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    beforeImage: row.before_image,
    afterImage: row.after_image,
    verifiedImprovementScore: row.verified_improvement_score,
    verifications: verifications.map(mapVerificationToClient).filter(Boolean),
    verificationsCount: verifications.length,
  };
}

export function mapVerificationToClient(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    campaignId: row.campaign_id,
    voterEmail: row.voter_email,
    timestamp: row.timestamp,
    improvementLevel: row.improvement_level,
  };
}

export function mapUserStatsToClient(row: any): any {
  if (!row) return null;
  return {
    fullName: row.full_name,
    email: row.email,
    level: row.level,
    xp: row.xp,
    contributionsCount: row.contributions_count,
    verifiedCleanupsCount: row.verified_cleanups_count,
    ecoPulseScore: row.eco_pulse_score,
    carbonFootprint: row.carbon_footprint,
  };
}

// --------------------------------------------------------------------
// DATABASE OPERATIONS (API HANDLERS BACKED BY LIVE SUPABASE)
// --------------------------------------------------------------------

/**
 * Fetch all catalogs, complete with nested observations, campaigns, and verifications
 */
export async function getLiveCatalogs(): Promise<any[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // 1. Fetch catalogs
    const { data: catalogs, error: cErr } = await supabase
      .from("catalogs")
      .select("*")
      .order("id", { ascending: true });

    if (cErr) throw cErr;
    if (!catalogs) return [];

    // 2. Fetch observations
    const { data: observations, error: oErr } = await supabase
      .from("observations")
      .select("*")
      .order("timestamp", { ascending: false });

    if (oErr) throw oErr;

    // 3. Fetch campaigns
    const { data: campaigns, error: caErr } = await supabase
      .from("campaigns")
      .select("*")
      .order("start_date", { ascending: false });

    if (caErr) throw caErr;

    // 4. Fetch verifications
    const { data: verifications, error: vErr } = await supabase
      .from("campaign_verifications")
      .select("*");

    if (vErr) throw vErr;

    // 5. Fetch trends list
    const { data: trends, error: tErr } = await supabase
      .from("catalog_trends")
      .select("*")
      .order("snapshot_date", { ascending: true });

    if (tErr) throw tErr;

    // Map everything to nested Client representations
    return catalogs.map((catRow) => {
      const catObs = (observations || []).filter((o) => o.catalog_id === catRow.id);
      const catCamps = (campaigns || []).filter((ca) => ca.catalog_id === catRow.id).map((cRow) => {
        const campVers = (verifications || []).filter((v) => v.campaign_id === cRow.id);
        return mapCampaignToClient(cRow, campVers);
      });

      const clientCat = mapCatalogToClient(catRow, catObs, []);
      clientCat.campaigns = catCamps;

      // Group trends
      const catTrends = (trends || [])
        .filter((t) => t.catalog_id === catRow.id)
        .map((t) => ({
          date: new Date(t.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: t.score,
        }));

      clientCat.trends = catTrends.length > 0 ? catTrends : [{ date: "Current", score: catRow.env_score }];
      return clientCat;
    });
  } catch (err) {
    handleSupabaseError("catalogs", err);
    return null;
  }
}

/**
 * Persist an auto-constructed or citizen-reported Environmental Catalog
 */
export async function createLiveCatalog(cat: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: cat.id,
      region: cat.region,
      city: cat.city,
      town_or_arrondissement: cat.townOrArrondissement,
      neighborhood: cat.neighborhood,
      coordinates_lat: cat.coordinates.lat,
      coordinates_lon: cat.coordinates.lon,
      env_score: cat.envScore || 50,
      dirtiness_score: cat.dirtinessScore === "Insufficient Data" ? -1 : (cat.dirtinessScore || 50),
      dirtiness_trend: cat.dirtinessTrend || "Stable",
      active_campaigns_count: cat.activeCampaignsCount || 0,
      last_updated: new Date(),
    };

    const { data, error } = await supabase
      .from("catalogs")
      .upsert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapCatalogToClient(data, [], []);
  } catch (err) {
    handleSupabaseError("catalogs-write", err);
    return null;
  }
}

/**
 * Register a new Citizen Observation Log to the database
 */
export async function insertLiveObservation(obs: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: obs.id,
      catalog_id: obs.catalogId,
      photo_url: obs.photoUrl,
      description: obs.description,
      reporter_name: obs.reporterName,
      pollution_tag: obs.pollutionTag || "Moderately Polluted",
      ai_classification: obs.aiClassification,
      timestamp: obs.timestamp || new Date(),
    };

    const { data, error } = await supabase
      .from("observations")
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapObservationToClient(data);
  } catch (err) {
    handleSupabaseError("observations", err);
    return null;
  }
}

/**
 * Fetch all registered NGO sanitary groups
 */
export async function getLiveOrganizations(): Promise<any[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapOrganizationToClient);
  } catch (err) {
    handleSupabaseError("organizations", err);
    return null;
  }
}

/**
 * Register a new organization
 */
export async function createLiveOrganization(org: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: org.id,
      name: org.name,
      type: org.type,
      email: org.email,
      phone: org.phone,
      area_catalog_id: org.areaCatalogId,
      description: org.description,
      impact_score: org.impactScore || 50,
    };

    const { data, error } = await supabase
      .from("organizations")
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapOrganizationToClient(data);
  } catch (err) {
    handleSupabaseError("organizations-write", err);
    return null;
  }
}

/**
 * Create a green campaign
 */
export async function createLiveCampaign(camp: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: camp.id,
      organization_name: camp.organizationName,
      title: camp.title,
      catalog_id: camp.catalogId,
      description: camp.description,
      start_date: camp.startDate,
      end_date: camp.endDate || null,
      status: camp.status || "Active",
      before_image: camp.beforeImage || null,
      after_image: camp.afterImage || null,
      verified_improvement_score: camp.verifiedImprovementScore || 0,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapCampaignToClient(data, []);
  } catch (err) {
    handleSupabaseError("campaigns-write", err);
    return null;
  }
}

/**
 * Lodge a validation voter proof
 */
export async function insertLiveVerification(v: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: v.id,
      campaign_id: v.campaignId,
      voter_email: v.voterEmail,
      improvement_level: v.improvementLevel,
      timestamp: v.timestamp || new Date(),
    };

    const { data, error } = await supabase
      .from("campaign_verifications")
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapVerificationToClient(data);
  } catch (err) {
    handleSupabaseError("campaign-verifications", err);
    return null;
  }
}

/**
 * Up-to-date user levels, XP, and footprint analytics
 */
export async function getLiveUserStats(): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("users_stats")
      .select("*")
      .eq("id", "user_main")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found, establish default profile
        return null;
      }
      throw error;
    }
    return mapUserStatsToClient(data);
  } catch (err) {
    handleSupabaseError("users_stats", err);
    return null;
  }
}

/**
 * Upsert active updates to user profiles
 */
export async function saveLiveUserStats(stats: any): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbRow = {
      id: "user_main",
      full_name: stats.fullName,
      email: stats.fullName === "Awah Blaise Atanga" ? "awahblaiseatanga@gmail.com" : stats.email || "user@example.com",
      level: stats.level,
      xp: stats.xp,
      contributions_count: stats.contributionsCount,
      verified_cleanups_count: stats.verifiedCleanupsCount,
      eco_pulse_score: stats.ecoPulseScore,
      carbon_footprint: stats.carbonFootprint,
    };

    const { data, error } = await supabase
      .from("users_stats")
      .upsert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return mapUserStatsToClient(data);
  } catch (err) {
    handleSupabaseError("users_stats-write", err);
    return null;
  }
}
