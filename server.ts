/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  getSupabase,
  getLiveCatalogs,
  createLiveCatalog,
  insertLiveObservation,
  getLiveOrganizations,
  createLiveOrganization,
  createLiveCampaign,
  insertLiveVerification,
  getLiveUserStats,
  saveLiveUserStats
} from "./server/supabase.js";

dotenv.config();

// Define Cameroon location lookups to facilitate catalog resolution
const CAMEROON_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Centre": {
    "Yaoundé": ["Yaoundé I", "Yaoundé II", "Yaoundé III", "Yaoundé IV", "Yaoundé V", "Yaoundé VI (Melen)", "Yaoundé VII (Biyem-Assi)", "Bastos"],
    "Mbalmayo": ["Mbalmayo Centre", "Nkololoang", "Mbeka"],
  },
  "Littoral": {
    "Douala": ["Douala I (Akwa)", "Douala II (Nkololoun)", "Douala III", "Douala IV (Bonaberi)", "Douala V", "Kassa"],
    "Edéa": ["Edéa I", "Edéa II"],
  },
  "North West": {
    "Bamenda": ["Bamenda I", "Bamenda II (Nkwen)", "Bamenda III (Chomba)"],
    "Kumbo": ["Kumbo Centre", "Tobin"],
  },
  "South West": {
    "Buea": ["Molyko", "Great Soppo", "Dirty No Road", "Clerks Quarters"],
    "Limbe": ["Limbe I (Half Mile)", "Limbe II (Bota)", "Limbe III"],
  },
  "West": {
    "Bafoussam": ["Bafoussam I", "Bafoussam II", "Bafoussam III"],
    "Dschang": ["Dschang Centre", "Foret d'Alen"],
  },
  "Adamaoua": {
    "Ngaoundéré": ["Ngaoundéré I", "Ngaoundéré II", "Ngaoundéré III"],
    "Meiganga": ["Meiganga Centre"],
  },
  "Far North": {
    "Maroua": ["Maroua I", "Maroua II", "Maroua III"],
    "Yagoua": ["Yagoua Centre"],
  },
  "North": {
    "Garoua": ["Garoua I", "Garoua II", "Garoua III"],
    "Guider": ["Guider Centre"],
  },
  "East": {
    "Bertoua": ["Bertoua I", "Bertoua II"],
    "Batouri": ["Batouri Centre"],
  },
  "South": {
    "Ebolowa": ["Ebolowa I", "Ebolowa II"],
    "Kribi": ["Kribi I", "Kribi II"],
  }
};

const TAG_WEIGHTS: Record<string, number> = {
  "Clean": 0,
  "Slightly Polluted": 25,
  "Moderately Polluted": 50,
  "Highly Polluted": 75,
  "Extremely Polluted": 100
};

function calculateDirtyScoreAndTrend(catalog: any) {
  const obsList = catalog.observations || [];
  
  // Unique Contributors Calculation
  const uniqueContributors = new Set(obsList.map((o: any) => o.reporterName)).size;

  // Support contributor cap for verification purposes (Max Counted Observations Per Contributor = 2)
  // Process observations chronologically from oldest to newest to tag first 2 correctly
  const sortedObs = [...obsList].sort((a: any, b: any) => {
    return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
  });

  const contributorCounts: Record<string, number> = {};
  let countedObs = 0;
  let additionalObs = 0;

  sortedObs.forEach((subObs: any) => {
    // Tag the correct observation references in the target list
    const obs = obsList.find((originalObs: any) => originalObs.id === subObs.id) || subObs;
    const reporter = obs.reporterName || "anonymous";
    if (!contributorCounts[reporter]) {
      contributorCounts[reporter] = 0;
    }
    
    if (contributorCounts[reporter] < 2) {
      contributorCounts[reporter]++;
      countedObs++;
      obs.isCountedForActivation = true;
    } else {
      additionalObs++;
      obs.isCountedForActivation = false;
    }
  });

  // Track system validation rules natively
  catalog.observationCount = obsList.length;
  catalog.countedObservations = countedObs;
  catalog.additionalObservations = additionalObs;
  catalog.contributorCount = uniqueContributors;
  catalog.minimumRequiredObservations = 5;
  
  const obsProg = Math.min(1, countedObs / 5);
  const contProg = Math.min(1, catalog.contributorCount / 3);
  catalog.verificationProgress = Math.round(((obsProg + contProg) / 2) * 100);

  // Exception mode: If area already exists as an Active Environmental Catalog, allow unlimited observations and do not downgrade.
  const isAlreadyActive = catalog.isActive === true || catalog.status === "Active" || catalog.status === "VERIFIED CATALOG";

  if (!isAlreadyActive && (countedObs < 5 || catalog.contributorCount < 3)) {
    catalog.dirtinessScore = "Insufficient Data";
    catalog.dirtinessTrend = "Insufficient Data";
    catalog.status = "UNVERIFIED ALERT";
    catalog.isActive = false;
    catalog.envScore = null;
    return;
  }

  // Set to active if passed verification or already active
  catalog.status = "VERIFIED CATALOG";
  catalog.isActive = true;
  if (!catalog.activationDate) {
    catalog.activationDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric"});
  }

  // Assign Numerical Values & Recency Factor based on ALL observations
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const now = new Date();

  obsList.forEach((obs: any) => {
    let tag = obs.pollutionTag;
    if (!tag) {
      const severity = obs.aiClassification?.severity || "Medium";
      if (severity === "Critical") tag = "Extremely Polluted";
      else if (severity === "High") tag = "Highly Polluted";
      else if (severity === "Medium") tag = "Moderately Polluted";
      else tag = "Slightly Polluted";
    }

    const value = TAG_WEIGHTS[tag] !== undefined ? TAG_WEIGHTS[tag] : 50;

    // Recency Factor: Last 7 days -> 1.5, 7–30 days -> 1.2, Older -> 1.0
    const obsDate = new Date(obs.timestamp || new Date());
    const diffMs = now.getTime() - obsDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let weight = 1.0;
    if (diffDays <= 7) {
      weight = 1.5;
    } else if (diffDays <= 30) {
      weight = 1.2;
    }

    totalWeightedScore += value * weight;
    totalWeight += weight;
  });

  const weightedScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
  const areaScore = Math.max(0, Math.min(100, Math.round(weightedScore)));

  catalog.dirtinessScore = areaScore;
  
  // Maintain backward-compatible environmental cleanliness score
  catalog.envScore = 100 - areaScore;

  if (!catalog.trends) {
    catalog.trends = [];
  }

  const currentDateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const hasTodayTrend = catalog.trends.some((t: any) => t.date === currentDateLabel || t.date === "Current");
  
  if (hasTodayTrend) {
    const idx = catalog.trends.findIndex((t: any) => t.date === currentDateLabel || t.date === "Current");
    if (idx !== -1) {
      catalog.trends[idx].score = catalog.envScore;
    }
  } else {
    catalog.trends.push({
      date: currentDateLabel,
      score: catalog.envScore
    });
  }

  // Calculate trend based on last 7 updates
  const last7 = catalog.trends.slice(-7);
  if (last7.length < 2) {
    catalog.dirtinessTrend = "Stable";
  } else {
    // Dirtiness score is 100 - envScore
    const dirtinessScoresSlice = last7.map((t: any) => 100 - t.score);
    const firstScore = dirtinessScoresSlice[0];
    const lastScore = dirtinessScoresSlice[dirtinessScoresSlice.length - 1];
    
    if (lastScore < firstScore) {
      catalog.dirtinessTrend = "Improving";
    } else if (lastScore > firstScore) {
      catalog.dirtinessTrend = "Getting Worse";
    } else {
      catalog.dirtinessTrend = "Stable";
    }
  }
}

// Simulated high fidelity realistic base database
let catalogs: any[] = [
  {
    id: "LOC_MLN_YAO_CEN_CMR",
    region: "Centre",
    city: "Yaoundé",
    townOrArrondissement: "Yaoundé VI",
    neighborhood: "Melen",
    envScore: 72,
    coordinates: { lat: 3.8667, lon: 11.5167 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 3,
    observationCount: 6,
    minimumRequiredObservations: 5,
    status: "Active",
    activationDate: "2026-06-01",
    isActive: true,
    trends: [
      { date: "May 1", score: 60 },
      { date: "May 15", score: 64 },
      { date: "Jun 1", score: 68 },
      { date: "Jun 13", score: 72 }
    ],
    observations: [
      {
        id: "obs_melen_1",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
        description: "Open drainage canal blocked with plastic bottles and organic refuse alongside the university perimeter road in Melen.",
        reporterName: "Blaise Atanga Awah",
        timestamp: "2026-06-10T14:30:00Z",
        aiClassification: {
          pollutionType: "Plastic & Solid Waste",
          severity: "High",
          confidence: 0.94,
          tags: ["Waterway Blockage", "Plastic Pollution", "Public Health Hazard"],
          suggestedAction: "Organize clearance of secondary drainage and construct storm filters.",
          waterwayProximity: "Adjacent (within 10m of local creek)"
        }
      },
      {
        id: "obs_melen_2",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
        description: "Excessive street litter and household dumping near Yaoundé VI municipal office complex.",
        reporterName: "Marie Ngo",
        timestamp: "2026-06-12T09:12:00Z",
        pollutionTag: "Moderately Polluted",
        aiClassification: {
          pollutionType: "Urban Refuse Pile",
          severity: "Medium",
          confidence: 0.89,
          tags: ["Municipal Odors", "Littering Hotspot"],
          suggestedAction: "Install community collection bins and schedule bi-weekly collections.",
          waterwayProximity: "None detected"
        }
      },
      {
        id: "obs_melen_3",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        description: "Inundated pathway from plastic siltation along Melen secondary road sector.",
        reporterName: "Blaise Atanga Awah",
        timestamp: "2026-06-05T10:00:00Z",
        pollutionTag: "Highly Polluted",
        aiClassification: {
          pollutionType: "Plastic Siltation",
          severity: "High",
          confidence: 0.9,
          tags: ["Waterway Blockage", "Plastic Pollution"],
          suggestedAction: "Organize clearance of secondary drainage and construct storm filters.",
          waterwayProximity: "Near local creek"
        }
      },
      {
        id: "obs_melen_4",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
        description: "Polyethylene packaging heap near neighborhood residential zone.",
        reporterName: "Marie Ngo",
        timestamp: "2026-06-03T11:00:00Z",
        pollutionTag: "Moderately Polluted",
        aiClassification: {
          pollutionType: "Plastic Litter",
          severity: "Medium",
          confidence: 0.88,
          tags: ["Littering"],
          suggestedAction: "Deploy bins.",
          waterwayProximity: "None"
        }
      },
      {
        id: "obs_melen_5",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
        description: "Clean state observed briefly in Melen community garden sector.",
        reporterName: "Gabriel Nkolo",
        timestamp: "2026-05-25T14:00:00Z",
        pollutionTag: "Clean",
        aiClassification: {
          pollutionType: "Clean Zone",
          severity: "Low",
          confidence: 0.95,
          tags: ["Preserved Green"],
          suggestedAction: "Maintain state.",
          waterwayProximity: "None"
        }
      }
    ],
    campaigns: [
      {
        id: "camp_melen_1",
        organizationName: "Association Eco-Cameroon",
        title: "Yaoundé VI Drainage Clearance Day",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        description: "Clearing plastic sludge from the main open gutters around Melen and the university junction.",
        startDate: "2026-06-01",
        endDate: "2026-06-03",
        status: "Completed",
        beforeImage: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
        afterImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        verifications: [
          { id: "v_1", campaignId: "camp_melen_1", voterEmail: "awah@gmail.com", timestamp: "2026-06-04", improvementLevel: "Significant" },
          { id: "v_2", campaignId: "camp_melen_1", voterEmail: "ngando@gmail.com", timestamp: "2026-06-04", improvementLevel: "Significant" },
          { id: "v_3", campaignId: "camp_melen_1", voterEmail: "kamga@gmail.com", timestamp: "2026-06-05", improvementLevel: "Moderate" }
        ],
        verifiedImprovementScore: 88,
        verificationsCount: 3
      },
      {
        id: "camp_melen_2",
        organizationName: "Melen EcoScouts Initiative",
        title: "Community Refuse Collection Station Setup",
        catalogId: "LOC_MLN_YAO_CEN_CMR",
        description: "Setting up 4 marked garbage separation containers at Melen market zone.",
        startDate: "2026-06-15",
        endDate: "2026-06-18",
        status: "Active",
        beforeImage: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
        verifications: [],
        verifiedImprovementScore: 0,
        verificationsCount: 0
      }
    ]
  },
  {
    id: "LOC_BON_DOU_LIT_CMR",
    region: "Littoral",
    city: "Douala",
    townOrArrondissement: "Douala IV",
    neighborhood: "Bonaberi",
    envScore: 64,
    coordinates: { lat: 4.0833, lon: 9.6833 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 5,
    trends: [
      { date: "May 1", score: 58 },
      { date: "May 15", score: 60 },
      { date: "Jun 1", score: 62 },
      { date: "Jun 13", score: 64 }
    ],
    observations: [
      {
        id: "obs_bonaberi_1",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        photoUrl: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80",
        description: "Water well pollution trace near industrial runoff point in Bonaberi riverine interface.",
        reporterName: "Samuel Eto'o",
        timestamp: "2026-06-08T11:45:00Z",
        aiClassification: {
          pollutionType: "Industrial Runoff & Water Contamination",
          severity: "Critical",
          confidence: 0.96,
          tags: ["Heavy Chemical Trace", "Drinking Well Threat", "River Estuary Risk"],
          suggestedAction: "Deploy immediate barriers, alert municipal inspectors, and secure water safety alerts.",
          waterwayProximity: "Severe (adjacent to Wouri River bank)"
        }
      },
      {
        id: "obs_bonaberi_facebook",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        photoUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
        description: "Severe plastic accumulation and watercourse clogging in Bonaberi, Douala IV, obstructing the neighborhood drainage channels.",
        reporterName: "Community Contributor",
        timestamp: "2026-06-13T10:15:00Z",
        facebookPostUrl: "https://www.facebook.com/groups/755353359009501/posts/1625749358636559/",
        pollutionTag: "Extremely Polluted",
        aiClassification: {
          pollutionType: "Plastic & Solid Waste Clogging",
          severity: "Critical",
          confidence: 0.98,
          tags: ["Plastic Clogging", "Watercourse Obstruction", "Douala IV Hotspot"],
          suggestedAction: "Mobilize a local youth cleaning campaign to clear bottlenecks, and coordinate with Douala IV Council for sustainable bins.",
          waterwayProximity: "Direct (obstructing municipal secondary branch channels)"
        }
      },
      {
        id: "obs_bonaberi_3",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        photoUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
        description: "Plastic bottle build-up near the market drain pipes.",
        reporterName: "Samuel Eto'o",
        timestamp: "2026-06-01T09:00:00Z",
        pollutionTag: "Highly Polluted",
        aiClassification: {
          pollutionType: "Plastic Accumulation",
          severity: "High",
          confidence: 0.85,
          tags: ["Market Drain", "Plastic Pile"],
          suggestedAction: "Run cleanup day.",
          waterwayProximity: "Direct"
        }
      },
      {
        id: "obs_bonaberi_4",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        photoUrl: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80",
        description: "Minor oily spills along the workshops interface.",
        reporterName: "Samuel Eto'o",
        timestamp: "2026-05-28T15:00:00Z",
        pollutionTag: "Slightly Polluted",
        aiClassification: {
          pollutionType: "Industrial Spills",
          severity: "Low",
          confidence: 0.82,
          tags: ["Workshop Oil", "Slight Spill"],
          suggestedAction: "Check workshop disposal lines.",
          waterwayProximity: "Moderate"
        }
      },
      {
        id: "obs_bonaberi_5",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
        description: "Heaps of old car tires blocking pedestrian pathways.",
        reporterName: "Frank Zambo",
        timestamp: "2026-05-15T08:00:00Z",
        pollutionTag: "Extremely Polluted",
        aiClassification: {
          pollutionType: "Solid Tires Disposal",
          severity: "Critical",
          confidence: 0.89,
          tags: ["Hazardous Tire Garbage", "Pedestrian Blockage"],
          suggestedAction: "Schedule flatbed truck disposal.",
          waterwayProximity: "None"
        }
      }
    ],
    campaigns: [
      {
        id: "camp_bonaberi_1",
        organizationName: "Douala Green Action Coalition",
        title: "Industrial Drainage Filter Installation",
        catalogId: "LOC_BON_DOU_LIT_CMR",
        description: "Placing bio-filters across the localized secondary canals emptying into the Wouri river basin.",
        startDate: "2026-06-05",
        endDate: "2026-06-12",
        status: "Completed",
        beforeImage: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80",
        afterImage: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
        verifications: [
          { id: "v_b1", campaignId: "camp_bonaberi_1", voterEmail: "douala_scout@gmail.com", timestamp: "2026-06-12", improvementLevel: "Moderate" },
          { id: "v_b2", campaignId: "camp_bonaberi_1", voterEmail: "wouri_hero@gmail.com", timestamp: "2026-06-13", improvementLevel: "Significant" }
        ],
        verifiedImprovementScore: 78,
        verificationsCount: 2
      }
    ]
  },
  {
    id: "LOC_NKW_BAM_NW_CMR",
    region: "North West",
    city: "Bamenda",
    townOrArrondissement: "Bamenda II",
    neighborhood: "Nkwen",
    envScore: null,
    coordinates: { lat: 5.9667, lon: 10.1500 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 2,
    observationCount: 4,
    contributorCount: 2,
    minimumRequiredObservations: 5,
    status: "UNVERIFIED ALERT",
    verificationProgress: 73,
    isActive: false,
    trends: [
      { date: "May 1", score: 78 },
      { date: "May 15", score: 79 },
      { date: "Jun 1", score: 80 },
      { date: "Jun 13", score: 81 }
    ],
    observations: [
      {
        id: "obs_nkwen_1",
        catalogId: "LOC_NKW_BAM_NW_CMR",
        photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
        description: "Localized agricultural runoff and soil erosion in Nkwen high slopes farm plots.",
        reporterName: "Grace Amabo",
        timestamp: "2026-06-11T16:00:00Z",
        aiClassification: {
          pollutionType: "Soil Erosion & Agro-Chemical Runoff",
          severity: "Medium",
          confidence: 0.85,
          tags: ["Slope Deterioration", "Chemical Siltation"],
          suggestedAction: "Implement terraced farming barriers and deploy local vetiver grass planting.",
          waterwayProximity: "Moderate (downhill stream active)"
        }
      }
    ],
    campaigns: []
  },
  {
    id: "LOC_MOL_BUE_SW_CMR",
    region: "South West",
    city: "Buea",
    townOrArrondissement: "Molyko",
    neighborhood: "University Area",
    envScore: 78,
    coordinates: { lat: 4.1500, lon: 9.2333 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 74 },
      { date: "Jun 13", score: 78 }
    ],
    observations: [
      {
        id: "obs_buea_1",
        catalogId: "LOC_MOL_BUE_SW_CMR",
        photoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
        description: "Clogged stormwater drains near the student residential hubs in Molyko, causing temporary flooding.",
        reporterName: "Blaise Atanga Awah",
        timestamp: "2026-06-12T10:00:00Z",
        aiClassification: {
          pollutionType: "Plastic Clogging & Flood Silt",
          severity: "Medium",
          confidence: 0.90,
          tags: ["Drain Blockage", "Flooding Risk"],
          suggestedAction: "Coordinate student clean-up squads to install simple filter grates.",
          waterwayProximity: "Moderate"
        }
      }
    ],
    campaigns: []
  },
  {
    id: "LOC_BAF_BAF_WST_CMR",
    region: "West",
    city: "Bafoussam",
    townOrArrondissement: "Bafoussam I",
    neighborhood: "Bafoussam Centre",
    envScore: 82,
    coordinates: { lat: 5.4667, lon: 10.4167 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 80 },
      { date: "Jun 13", score: 82 }
    ],
    observations: [],
    campaigns: []
  },
  {
    id: "LOC_SAB_NGA_ADA_CMR",
    region: "Adamaoua",
    city: "Ngaoundéré",
    townOrArrondissement: "Ngaoundéré I",
    neighborhood: "Sabongari",
    envScore: 69,
    coordinates: { lat: 7.3275, lon: 13.5667 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 65 },
      { date: "Jun 13", score: 69 }
    ],
    observations: [
      {
        id: "obs_ada_1",
        catalogId: "LOC_SAB_NGA_ADA_CMR",
        photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
        description: "Organic slaughterhouse refuse and solid waste dumping in the local market secondary channel in Sabongari.",
        reporterName: "Ousmanou Bello",
        timestamp: "2026-06-11T08:15:00Z",
        aiClassification: {
          pollutionType: "Organic & Solid Market Waste",
          severity: "High",
          confidence: 0.88,
          tags: ["Market Dumping", "Sanitation Hazard"],
          suggestedAction: "Enforce separation guidelines and distribute custom closed-lid skips to traders.",
          waterwayProximity: "Moderate"
        }
      }
    ],
    campaigns: []
  },
  {
    id: "LOC_PAL_MAR_FN_CMR",
    region: "Far North",
    city: "Maroua",
    townOrArrondissement: "Maroua I",
    neighborhood: "Palas",
    envScore: 61,
    coordinates: { lat: 10.5917, lon: 14.3167 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 58 },
      { date: "Jun 13", score: 61 }
    ],
    observations: [
      {
        id: "obs_fn_1",
        catalogId: "LOC_PAL_MAR_FN_CMR",
        photoUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
        description: "Severe windblown plastic packaging accumulating along seasonal river beds (mayos) in Maroua Palas area.",
        reporterName: "Fadimatou Harouna",
        timestamp: "2026-06-09T15:20:00Z",
        aiClassification: {
          pollutionType: "Windblown Plastic litter",
          severity: "High",
          confidence: 0.87,
          tags: ["Mayo Siltation", "Plastic Pollution"],
          suggestedAction: "Mobilize youth collectives for dry-season mayo sweep campaigns.",
          waterwayProximity: "Critical (direct dried riverbed siltation)"
        }
      }
    ],
    campaigns: []
  },
  {
    id: "LOC_YEL_GAR_NOR_CMR",
    region: "North",
    city: "Garoua",
    townOrArrondissement: "Garoua I",
    neighborhood: "Yelwa Garoua",
    envScore: 70,
    coordinates: { lat: 9.3000, lon: 13.4000 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 68 },
      { date: "Jun 13", score: 70 }
    ],
    observations: [],
    campaigns: []
  },
  {
    id: "LOC_BIR_BER_EST_CMR",
    region: "East",
    city: "Bertoua",
    townOrArrondissement: "Bertoua I",
    neighborhood: "Birponi",
    envScore: 75,
    coordinates: { lat: 4.5833, lon: 13.6833 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 72 },
      { date: "Jun 13", score: 75 }
    ],
    observations: [],
    campaigns: []
  },
  {
    id: "LOC_NKO_EBO_SOU_CMR",
    region: "South",
    city: "Ebolowa",
    townOrArrondissement: "Ebolowa I",
    neighborhood: "Nko'ovos",
    envScore: 84,
    coordinates: { lat: 2.9167, lon: 11.1500 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
    trends: [
      { date: "May 15", score: 82 },
      { date: "Jun 13", score: 84 }
    ],
    observations: [],
    campaigns: []
  }
];

// Pre-seeded local organizations
let organizations: any[] = [
  {
    id: "org_1",
    name: "Association Eco-Cameroon",
    type: "NGO",
    email: "info@eco-cameroon.org",
    phone: "+237 677 890 123",
    areaCatalogId: "LOC_MLN_YAO_CEN_CMR",
    description: "Pioneering community-based micro-waste collection systems and drainage engineering across Yaoundé suburb neighborhoods.",
    impactScore: 85
  },
  {
    id: "org_2",
    name: "Douala Green Action Coalition",
    type: "Community Group",
    email: "douala.green@gmail.com",
    phone: "+237 699 112 233",
    areaCatalogId: "LOC_BON_DOU_LIT_CMR",
    description: "A grassroots effort based in Bonaberi tracking estuary industrial pollution and leading water well inspections.",
    impactScore: 78
  },
  {
    id: "org_3",
    name: "Melen EcoScouts Initiative",
    type: "School",
    email: "scouts.melen@yahoo.com",
    phone: "+237 655 443 322",
    areaCatalogId: "LOC_MLN_YAO_CEN_CMR",
    description: "Student environmental scouts implementing street garbage separation corners and plastic retrieval.",
    impactScore: 92
  }
];

// Registered users database map in memory
let registeredUsersMap: Record<string, any> = {
  "awahblaiseatanga@gmail.com": {
    email: "awahblaiseatanga@gmail.com",
    fullName: "Awah Blaise Atanga",
    contributionsCount: 3,
    verificationsCount: 5,
    level: "Eco Scout",
    xp: 140,
    ecoPulseScore: 78,
    carbonFootprint: 112,
    region: "Centre",
    city: "Yaoundé",
    townOrArrondissement: "Yaoundé VI (Melen)",
    neighborhood: "Melen",
    phone: "+237 677 890 123",
    role: "Eco Scout"
  }
};

// User stats engine referenced to the current active session user
let userStats: any = registeredUsersMap["awahblaiseatanga@gmail.com"];

// Perform initial deterministic score calculations for catalogs
catalogs.forEach((c) => {
  // Distribute pollutionTag retrospectively on remaining observations
  c.observations.forEach((obs: any, idx: number) => {
    if (!obs.pollutionTag) {
      const tags: ("Clean" | "Slightly Polluted" | "Moderately Polluted" | "Highly Polluted" | "Extremely Polluted")[] = [
        "Extremely Polluted", "Highly Polluted", "Moderately Polluted", "Slightly Polluted", "Clean"
      ];
      obs.pollutionTag = tags[idx % tags.length];
    }
  });
  calculateDirtyScoreAndTrend(c);
});

// Lazy initialization logic for the @google/genai client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        geminiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });
        console.log("Successfully initialized Gemini Client on server-side.");
      } catch (err) {
        console.error("Failed to initialize server-side Gemini client: ", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not set or placeholder. Falling back to robust offline Cameroon AI simulation!");
    }
  }
  return geminiClient;
}

// Start building full-stack express listener
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Fix Netlify function paths by stripping the prefix directly inside Express
  app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      req.url = req.url.replace('/.netlify/functions/api', '/api');
    }
    next();
  });

  // API 1: Fetch all catalogs
  app.get("/api/catalogs", async (req, res) => {
    try {
      const live = await getLiveCatalogs();
      if (live !== null) {
        return res.json(live);
      }
    } catch (err) {
      console.warn("Could not retrieve catalogs from database:", err?.message || err);
    }
    // Fallback to in-memory catalogs
    res.json(catalogs);
  });

  // API 2: Create a catalog (manual unmapped catalog creation)
  app.post("/api/catalogs", async (req, res) => {
    const { region, city, townOrArrondissement, neighborhood, coordinates } = req.body;
    
    if (!region || !city || !townOrArrondissement || !neighborhood) {
      return res.status(400).json({ error: "All geography fields are required to establish an Environmental Catalog." });
    }

    // Generate specific ID key
    const regionCode = region.substring(0, 3).toUpperCase();
    const cityCode = city.substring(0, 3).toUpperCase();
    const neighborhoodCode = neighborhood.substring(0, 3).toUpperCase();
    const id = `LOC_${neighborhoodCode}_${cityCode}_${regionCode}_CMR`;

    const lat = coordinates?.lat || (3.8 + Math.random() * 2);
    const lon = coordinates?.lon || (11.5 + Math.random() * 2);

    const newCatalog = {
      id,
      region,
      city,
      townOrArrondissement,
      neighborhood,
      envScore: null,
      coordinates: { lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) },
      lastUpdated: new Date().toLocaleDateString(),
      activeCampaignsCount: 0,
      observationCount: 0,
      contributorCount: 0,
      minimumRequiredObservations: 5,
      status: "UNVERIFIED ALERT",
      verificationProgress: 0,
      isActive: false,
      trends: [],
      observations: [],
      campaigns: []
    };

    try {
      const live = await createLiveCatalog(newCatalog);
      if (live) {
        return res.status(201).json(live);
      }
    } catch (err) {
      console.warn("Could not save new catalog to database:", err?.message || err);
    }

    const existing = catalogs.find(c => c.id === id);
    if (existing) {
      return res.json(existing);
    }

    catalogs.push(newCatalog);
    res.status(201).json(newCatalog);
  });

  // API 3: Get single catalog detail
  app.get("/api/catalogs/:id", async (req, res) => {
    try {
      const live = await getLiveCatalogs();
      if (live !== null) {
        const cat = live.find(c => c.id === req.params.id);
        if (!cat) {
          return res.status(404).json({ error: "Environmental Catalog location not defined." });
        }
        return res.json(cat);
      }
    } catch (err) {
      console.warn("Direct live database catalog lookup failed:", err?.message || err);
    }

    const catalog = catalogs.find(c => c.id === req.params.id);
    if (!catalog) {
      return res.status(404).json({ error: "Environmental Catalog location not defined." });
    }
    res.json(catalog);
  });

  // API to log rejection events
  const rejectionLogs: any[] = [];
  app.post("/api/rejections", (req, res) => {
    const { reason, timestamp, userId, areaId } = req.body;
    const logEvent = {
      id: "rej_" + Math.random().toString(36).substring(2, 11),
      reason: reason || "duplicate_image",
      timestamp: timestamp || new Date().toISOString(),
      userId: userId || "anonymous",
      areaId: areaId || "unknown_area",
    };
    rejectionLogs.unshift(logEvent);
    console.info("Rejection event logged on server:", logEvent);
    res.json({ success: true, log: logEvent });
  });

  app.get("/api/rejections", (req, res) => {
    res.json(rejectionLogs);
  });

  // API to log referral tracking entries
  const referralsLogs: any[] = [];
  app.post("/api/referrals", async (req, res) => {
    const { inviterId, newContributorId, alertId } = req.body;
    
    if (!inviterId || !newContributorId || !alertId) {
      return res.status(400).json({ error: "inviterId, newContributorId, and alertId are all required." });
    }

    // Check if duplicate relation already recorded
    const duplicate = referralsLogs.find(r => r.inviterId === inviterId && r.newContributorId === newContributorId && r.alertId === alertId);
    if (duplicate) {
      return res.json({ success: true, alreadyTracked: true, log: duplicate });
    }

    const logEntry = {
      id: "ref_" + Math.random().toString(36).substring(2, 11),
      inviterId,
      newContributorId,
      alertId,
      timestamp: new Date().toISOString()
    };
    referralsLogs.unshift(logEntry);
    console.info("Referral tracking event logged on server:", logEntry);

    // Reward points (Environmental Impact Points / XP) to the inviter
    try {
      const liveStats = await getLiveUserStats(inviterId);
      const targetStats = liveStats || registeredUsersMap[inviterId];
      if (targetStats) {
        targetStats.xp = (targetStats.xp || 0) + 40; // Award 40 Environmental Impact XP Points
        targetStats.referralsCount = (targetStats.referralsCount || 0) + 1;
        
        if (targetStats.xp < 100) targetStats.level = "Observer";
        else if (targetStats.xp < 250) targetStats.level = "Eco Scout";
        else if (targetStats.xp < 500) targetStats.level = "Community Guardian";
        else if (targetStats.xp < 1000) targetStats.level = "Environmental Advocate";
        else targetStats.level = "Green Champion";

        await saveLiveUserStats(targetStats);
        // Sync static fast memory cache
        registeredUsersMap[inviterId] = targetStats;
      }
    } catch (e) {
      console.warn("Failed to update inviter's referral reward points on database:", e);
    }

    res.json({ success: true, log: logEntry, rewarded: true });
  });

  app.get("/api/referrals", (req, res) => {
    const { inviterId } = req.query;
    if (inviterId) {
      const filtered = referralsLogs.filter(r => r.inviterId === inviterId);
      return res.json(filtered);
    }
    res.json(referralsLogs);
  });

  // Helper to obtain intelligent, offline local environmental classifications mapped to Cameroon contexts
  function getOfflineKeywordsClassification(description: string) {
    const lowerText = (description || "").toLowerCase();
    if (lowerText.includes("plastic") || lowerText.includes("bottle") || lowerText.includes("gutter") || lowerText.includes("commercial")) {
      return {
        pollutionType: "Plastic Sludge & Drain Blockage",
        severity: "High" as any,
        confidence: 0.94,
        tags: ["Drain Blockage", "Plastic Bottled Refuse", "Douala Urban Runoff"],
        suggestedAction: "Install active physical gutter grates as trash catches and coordinate community 'Investissement Humain' cleanup waves.",
        waterwayProximity: "Impacts roadside storm gutters"
      };
    } else if (lowerText.includes("drain") || lowerText.includes("clog") || lowerText.includes("canal") || lowerText.includes("water") || lowerText.includes("river") || lowerText.includes("stream")) {
      return {
        pollutionType: "Blocked Primary Urban Drainage Course",
        severity: "Critical" as any,
        confidence: 0.92,
        tags: ["Urban Drainage Clog", "Stagnant Water Risks", "Rain Season Overflow Alert"],
        suggestedAction: "Direct mechanical excavation to clear natural water tributaries and install public mesh filters.",
        waterwayProximity: "Severe (directly blocks primary drainage paths)"
      };
    } else if (lowerText.includes("smoke") || lowerText.includes("burn") || lowerText.includes("burning") || lowerText.includes("fire") || lowerText.includes("toxic") || lowerText.includes("chemical")) {
      return {
        pollutionType: "Open Trash Burning & Toxic Air Contamination",
        severity: "Critical" as any,
        confidence: 0.90,
        tags: ["Toxic Smoke Emissions", "Spontaneous Burn Pit", "Respiratory Public Danger"],
        suggestedAction: "Notify local district inspectors and arrange alternative organic/plastic sorted compost dumpsters.",
        waterwayProximity: "Adjacent to residential blocks"
      };
    }
    return {
      pollutionType: "Mixed General Anthropogenic Waste",
      severity: "Medium" as any,
      confidence: 0.85,
      tags: ["General Dumping", "Littering Pit"],
      suggestedAction: "Organize neighborhood physical sweep drives and establish localized trash receptacles.",
      waterwayProximity: "None immediately detected"
    };
  }

  // API 4: Add user observation with deterministic scoring engine recalculations
  app.post("/api/observations", async (req, res) => {
    const { catalogId, region, city, townOrArrondissement, neighborhood, description, photoUrl, photoUrls, imageHash, reporterName, reporterEmail, pollutionTag } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Observation description is required." });
    }

    // Resolve or Auto-create Catalog from live db/memory
    let targetCatalog: any = null;
    let fallbackToMemory = false;

    try {
      const liveCats = await getLiveCatalogs();
      if (liveCats !== null) {
        targetCatalog = liveCats.find(c => c.id === catalogId);
        if (!targetCatalog) {
          const regionCode = (region || "CEN").substring(0, 3).toUpperCase();
          const cityCode = (city || "YAO").substring(0, 3).toUpperCase();
          const neighborhoodCode = (neighborhood || "MLN").substring(0, 3).toUpperCase();
          const newId = `LOC_${neighborhoodCode}_${cityCode}_${regionCode}_CMR`;

          targetCatalog = liveCats.find(c => c.id === newId);
          if (!targetCatalog) {
            const freshCat = {
              id: newId,
              region: region || "Centre",
              city: city || "Yaoundé",
              townOrArrondissement: townOrArrondissement || "Yaoundé VI",
              neighborhood: neighborhood || "Melen",
              envScore: 50,
              coordinates: { lat: 3.8667 + Math.random() * 0.1, lon: 11.5167 + Math.random() * 0.1 },
            };
            targetCatalog = await createLiveCatalog(freshCat);
          }
        }
      } else {
        fallbackToMemory = true;
      }
    } catch (err) {
      console.warn("Could not query live database for catalog validation:", err?.message || err);
      fallbackToMemory = true;
    }

    if (fallbackToMemory || !targetCatalog) {
      // Memory fallback loop
      targetCatalog = catalogs.find(c => c.id === catalogId);
      if (!targetCatalog) {
        const regionCode = (region || "CEN").substring(0, 3).toUpperCase();
        const cityCode = (city || "YAO").substring(0, 3).toUpperCase();
        const neighborhoodCode = (neighborhood || "MLN").substring(0, 3).toUpperCase();
        const newId = `LOC_${neighborhoodCode}_${cityCode}_${regionCode}_CMR`;

        targetCatalog = catalogs.find(c => c.id === newId);
        if (!targetCatalog) {
          targetCatalog = {
            id: newId,
            region: region || "Centre",
            city: city || "Yaoundé",
            townOrArrondissement: townOrArrondissement || "Yaoundé VI",
            neighborhood: neighborhood || "Melen",
            envScore: 50,
            coordinates: { lat: 3.8667 + Math.random() * 0.1, lon: 11.5167 + Math.random() * 0.1 },
            lastUpdated: new Date().toLocaleDateString(),
            activeCampaignsCount: 0,
            trends: [{ date: "Current", score: 50 }],
            observations: [],
            campaigns: []
          };
          catalogs.push(targetCatalog);
        }
      }
    }

    // Call real Gemini if client initialised, start with our intelligent local keywords categorization fallback
    const client = getGeminiClient();
    let aiClassification = getOfflineKeywordsClassification(description);

    if (client) {
      try {
        console.log("Generating analysis from Gemini Model...");
        const imageMatches = photoUrl ? photoUrl.match(/^data:(image\/\w+);base64,(.+)$/) : null;
        let contents: any[] = [];
        
        let promptText = `You are GreenLens AI, an Environmental Intelligence systems analyst mapped to Cameroon context.
        Review this observation: "${description}".
        
        Provide your strict response formatted as JSON with the following schema:
        {
          "pollutionType": "string (the main type, e.g., Plastic Clogged Drain, Agricultural Runoff, Medical Trash, Urban Dump Pile, Toxic Liquid Spill, Air Refuse)",
          "severity": "string ('Low' | 'Medium' | 'High' | 'Critical')",
          "confidence": number,
          "tags": ["array", "of", "high-relevance", "terms"],
          "suggestedAction": "string (short actionable recommendation for local Cameroon cleanup organizations)",
          "waterwayProximity": "string (does it look like it threatens a local drainage path or river such as the Wouri River or Chantal Biya complex gutters?)"
        }
        Do not add any markup before or after. Return ONLY valid stringified JSON.`;

        if (imageMatches) {
          const mimeType = imageMatches[1];
          const base64Data = imageMatches[2];
          contents = [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: promptText }
          ];
        } else {
          contents = [promptText];
        }

        const modelRes = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: contents },
          config: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        if (modelRes.text) {
          const cleanedText = modelRes.text.trim();
          const parsed = JSON.parse(cleanedText);
          if (parsed.pollutionType) aiClassification = parsed;
        }
      } catch (err) {
        console.error("Failed executing actual Gemini call, invoking graceful local camera keywords fallback:", err);
      }
    }

    let finalPhotoUrl = photoUrl;
    if (!finalPhotoUrl) {
      const lowerDesc = (description || "").toLowerCase();
      if (lowerDesc.includes("plastic") || lowerDesc.includes("bottle") || lowerDesc.includes("polyethylene")) {
        finalPhotoUrl = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80"; // plastic litter
      } else if (lowerDesc.includes("drain") || lowerDesc.includes("gutter") || lowerDesc.includes("clog") || lowerDesc.includes("canal") || lowerDesc.includes("sewage")) {
        finalPhotoUrl = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"; // clogged drain
      } else if (lowerDesc.includes("smoke") || lowerDesc.includes("burn") || lowerDesc.includes("burning") || lowerDesc.includes("fire")) {
        finalPhotoUrl = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"; // refuse burning
      } else if (lowerDesc.includes("water") || lowerDesc.includes("river") || lowerDesc.includes("stream") || lowerDesc.includes("well") || lowerDesc.includes("borehole")) {
        finalPhotoUrl = "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80"; // contaminated well
      } else if (lowerDesc.includes("erosion") || lowerDesc.includes("soil") || lowerDesc.includes("mud") || lowerDesc.includes("silt")) {
        finalPhotoUrl = "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=600&q=80"; // erosion / soil degradation
      } else {
        finalPhotoUrl = "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80"; // general refuse dump
      }
    }

    const newObservation = {
      id: `obs_${Date.now()}`,
      catalogId: targetCatalog.id,
      photoUrl: finalPhotoUrl,
      photoUrls: photoUrls || [finalPhotoUrl],
      imageHash: imageHash || null,
      description,
      reporterName: reporterName || userStats.fullName,
      timestamp: new Date().toISOString(),
      pollutionTag: pollutionTag || "Moderately Polluted",
      aiClassification
    };

    // Live Supabase Writer
    try {
      const liveObs = await insertLiveObservation(newObservation);
      if (liveObs) {
        // Fetch freshly calculated target catalog (which updated its environmental scores inside PgSQL triggers)
        const reloadedCats = await getLiveCatalogs();
        const updatedTargetCatalog = (reloadedCats || []).find(c => c.id === targetCatalog.id);

        // Update User Statistics Profile
        const emailToUpdate = reporterEmail || userStats?.email || "awahblaiseatanga@gmail.com";
        const currentStats = await getLiveUserStats(emailToUpdate) || userStats;
        currentStats.contributionsCount += 1;
        currentStats.xp += 30; // 30 XP per observation reward

        if (currentStats.xp < 100) currentStats.level = "Observer";
        else if (currentStats.xp < 250) currentStats.level = "Eco Scout";
        else if (currentStats.xp < 500) currentStats.level = "Community Guardian";
        else if (currentStats.xp < 1000) currentStats.level = "Environmental Advocate";
        else currentStats.level = "Green Champion";

        const savedStats = await saveLiveUserStats(currentStats);

        return res.status(201).json({
          observation: liveObs,
          catalog: updatedTargetCatalog,
          userStats: savedStats || currentStats
        });
      }
    } catch (err) {
      console.warn("Database registration for report failed, degrading gracefully to client simulation:", err?.message || err);
    }

    // Fallback Simulated Persistence Flow
    targetCatalog.observations.unshift(newObservation);
    
    // Recalculate physical score with deterministic scoring engine!
    calculateDirtyScoreAndTrend(targetCatalog);
    
    targetCatalog.lastUpdated = new Date().toLocaleDateString();

    // Reward XP point to reporter
    userStats.contributionsCount += 1;
    userStats.xp += 30; // 30 XP per valid observation
    
    // Recalculate level
    if (userStats.xp < 100) userStats.level = "Observer";
    else if (userStats.xp < 250) userStats.level = "Eco Scout";
    else if (userStats.xp < 500) userStats.level = "Community Guardian";
    else if (userStats.xp < 1000) userStats.level = "Environmental Advocate";
    else userStats.level = "Green Champion";

    res.status(201).json({ observation: newObservation, catalog: targetCatalog, userStats });
  });

  // API 5: Fetch all organizations
  app.get("/api/organizations", async (req, res) => {
    try {
      const live = await getLiveOrganizations();
      if (live !== null) {
        return res.json(live);
      }
    } catch (err) {
      console.warn("Database-backed query for organization groups failed:", err?.message || err);
    }
    res.json(organizations);
  });

  // API 6: Register organization
  app.post("/api/organizations", async (req, res) => {
    const { name, type, email, phone, areaCatalogId, description } = req.body;

    if (!name || !email || !areaCatalogId) {
      return res.status(400).json({ error: "Organization Name, Contact Email, and Primary Administrative Catalog Area are required." });
    }

    const id = `org_${Date.now()}`;
    const newOrg = {
      id,
      name,
      type: type || "Community Group",
      email,
      phone: phone || "+237",
      areaCatalogId,
      description: description || "",
      impactScore: 50 // starting average score
    };

    try {
      const live = await createLiveOrganization(newOrg);
      if (live) {
        return res.status(201).json(live);
      }
    } catch (err) {
      console.warn("Database organization insert failed:", err?.message || err);
    }

    organizations.push(newOrg);
    res.status(201).json(newOrg);
  });

  // API 7: Register Campaign
  app.post("/api/campaigns", async (req, res) => {
    const { organizationName, title, catalogId, description, startDate, endDate, beforeImage } = req.body;

    if (!organizationName || !title || !catalogId || !description || !startDate) {
      return res.status(400).json({ error: "Missing required catalog or organization parameters to register campaign." });
    }

    // Safe retrieve target
    let targetCatalog: any = null;
    try {
      const liveCats = await getLiveCatalogs();
      targetCatalog = (liveCats || catalogs).find(c => c.id === catalogId);
    } catch {
      targetCatalog = catalogs.find(c => c.id === catalogId);
    }

    if (!targetCatalog) {
      return res.status(404).json({ error: "Selected Administrative Catalog does not exist yet." });
    }

    let finalBeforeImage = beforeImage;
    if (!finalBeforeImage) {
      const lowerText = (title + " " + description).toLowerCase();
      if (lowerText.includes("gutter") || lowerText.includes("drain") || lowerText.includes("clog") || lowerText.includes("canal") || lowerText.includes("sewage")) {
        finalBeforeImage = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"; // plastic clogged gutter
      } else if (lowerText.includes("tree") || lowerText.includes("plant") || lowerText.includes("forest") || lowerText.includes("green")) {
        finalBeforeImage = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80"; // sprout re-greening
      } else if (lowerText.includes("bin") || lowerText.includes("sorting") || lowerText.includes("container") || lowerText.includes("recycle") || lowerText.includes("litter")) {
        finalBeforeImage = "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=600&q=80"; // clean bin setup
      } else {
        finalBeforeImage = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80"; // stream cleanup
      }
    }

    const id = `camp_${Date.now()}`;
    const newCampaign = {
      id,
      organizationName,
      title,
      catalogId,
      description,
      startDate,
      endDate: endDate || null,
      status: "Active",
      beforeImage: finalBeforeImage,
      verifications: [],
      verifiedImprovementScore: 0,
      verificationsCount: 0
    };

    try {
      const live = await createLiveCampaign(newCampaign);
      if (live) {
        // Update catalogs total campaigns count
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from("catalogs").update({
            active_campaigns_count: (targetCatalog.activeCampaignsCount || 0) + 1
          }).eq("id", catalogId);
        }

        const freshCats = await getLiveCatalogs();
        const updatedCat = (freshCats || []).find(c => c.id === catalogId);
        return res.status(201).json({ campaign: live, catalog: updatedCat });
      }
    } catch (err) {
      console.warn("Database-backed campaign creation failed:", err?.message || err);
    }

    if (!targetCatalog.campaigns) {
      targetCatalog.campaigns = [];
    }
    targetCatalog.campaigns.unshift(newCampaign);
    targetCatalog.activeCampaignsCount += 1;

    res.status(201).json({ campaign: newCampaign, catalog: targetCatalog });
  });

  // API 8: Upload campaign after image (Trigger completion of campaign)
  app.post("/api/campaigns/:id/complete", async (req, res) => {
    const { afterImage } = req.body;
    const campaignId = req.params.id;

    let foundCampaign: any = null;
    let foundCatalog: any = null;

    // Search Live first
    let liveCatalogs: any[] | null = null;
    try {
      liveCatalogs = await getLiveCatalogs();
      if (liveCatalogs !== null) {
        for (const cat of liveCatalogs) {
          if (cat.campaigns) {
            const camp = cat.campaigns.find((c: any) => c.id === campaignId);
            if (camp) {
              foundCampaign = camp;
              foundCatalog = cat;
              break;
            }
          }
        }
      }
    } catch (err) {
       console.warn("Could not validate live campaign row for completion:", err?.message || err);
    }

    // Direct edit in Live DB
    if (foundCampaign && foundCatalog) {
      let finalAfterImage = afterImage;
      if (!finalAfterImage) {
        const titleLower = (foundCampaign.title + " " + foundCampaign.description).toLowerCase();
        if (titleLower.includes("gutter") || titleLower.includes("drain") || titleLower.includes("clog") || titleLower.includes("canal") || titleLower.includes("sewage")) {
          finalAfterImage = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80";
        } else if (titleLower.includes("tree") || titleLower.includes("plant") || titleLower.includes("forest") || titleLower.includes("green")) {
          finalAfterImage = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80";
        } else if (titleLower.includes("bin") || titleLower.includes("sorting") || titleLower.includes("container") || titleLower.includes("recycle") || titleLower.includes("litter")) {
          finalAfterImage = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80";
        } else {
          finalAfterImage = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80";
        }
      }

      const supabase = getSupabase();
      if (supabase) {
        try {
          // Update campaign status
          await supabase.from("campaigns").update({
            status: "Completed",
            after_image: finalAfterImage,
            end_date: new Date().toISOString().split("T")[0]
          }).eq("id", campaignId);

          // Decrement catalog active counter
          await supabase.from("catalogs").update({
            active_campaigns_count: Math.max(0, (foundCatalog.activeCampaignsCount || 1) - 1)
          }).eq("id", foundCatalog.id);

          const refreshed = await getLiveCatalogs();
          const targetCat = (refreshed || []).find(c => c.id === foundCatalog.id);
          const targetCamp = targetCat?.campaigns?.find((c: any) => c.id === campaignId);

          return res.json({ campaign: targetCamp, catalog: targetCat });
        } catch (err) {
          console.warn("Dynamic campaign completion insert failed:", err?.message || err);
        }
      }
    }

    // Memory database operations fallback
    foundCampaign = null;
    foundCatalog = null;

    for (const cat of catalogs) {
      if (cat.campaigns) {
        const camp = cat.campaigns.find((c: any) => c.id === campaignId);
        if (camp) {
          foundCampaign = camp;
          foundCatalog = cat;
          break;
        }
      }
    }

    if (!foundCampaign) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    let finalAfterImage = afterImage;
    if (!finalAfterImage) {
      const titleLower = (foundCampaign.title + " " + foundCampaign.description).toLowerCase();
      if (titleLower.includes("gutter") || titleLower.includes("drain") || titleLower.includes("clog") || titleLower.includes("canal") || titleLower.includes("sewage")) {
        finalAfterImage = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80"; // pristine clean watercourse stream
      } else if (titleLower.includes("tree") || titleLower.includes("plant") || titleLower.includes("forest") || titleLower.includes("green")) {
        finalAfterImage = "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80"; // pristine eco trail/reforested wood path
      } else if (titleLower.includes("bin") || titleLower.includes("sorting") || titleLower.includes("container") || titleLower.includes("recycle") || titleLower.includes("litter")) {
        finalAfterImage = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80"; // pristine public space garden layout
      } else {
        finalAfterImage = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80"; // healthy organic soil
      }
    }

    foundCampaign.afterImage = finalAfterImage;
    foundCampaign.status = "Completed";
    foundCampaign.endDate = new Date().toISOString().split("T")[0];
    if (foundCatalog.activeCampaignsCount > 0) {
      foundCatalog.activeCampaignsCount -= 1;
    }

    res.json({ campaign: foundCampaign, catalog: foundCatalog });
  });

  // API 9: Vote community verification of Before/After comparing trust layer
  app.post("/api/campaigns/:id/verify", async (req, res) => {
    const { email, improvementLevel } = req.body;
    const campaignId = req.params.id;

    if (!improvementLevel) {
      return res.status(400).json({ error: "Improvement answer rating is required." });
    }

    let foundCampaign: any = null;
    let foundCatalog: any = null;

    // Search live first
    try {
      const liveCats = await getLiveCatalogs();
      if (liveCats !== null) {
        for (const cat of liveCats) {
          if (cat.campaigns) {
            const camp = cat.campaigns.find((c: any) => c.id === campaignId);
            if (camp) {
              foundCampaign = camp;
              foundCatalog = cat;
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Interactive verification voter lookup failed:", err?.message || err);
    }

    if (foundCampaign && foundCatalog) {
      // live Supabase operation
      const newVerification = {
        id: `v_${Date.now()}`,
        campaignId,
        voterEmail: email || userStats.email,
        timestamp: new Date().toISOString(),
        improvementLevel
      };

      try {
        const liveV = await insertLiveVerification(newVerification);
        if (liveV) {
          // Re-calculate average improvement score inside Postgres (simulated on queries)
          const scoreMap: Record<string, number> = { Significant: 100, Moderate: 70, Little: 30, No: 0 };
          const activeVerifications = [...(foundCampaign.verifications || []), liveV];
          const totalScore = activeVerifications.reduce((sum: number, v: any) => sum + scoreMap[v.improvementLevel], 0);
          const computedScore = Math.round(totalScore / activeVerifications.length);

          const supabase = getSupabase();
          if (supabase) {
            // Write completed improvement rating
            await supabase.from("campaigns").update({
              verified_improvement_score: computedScore
            }).eq("id", campaignId);

            // Boost Env Score slightly as active proof of cleanliness is verified
            const scoreIncrease = Math.round((scoreMap[improvementLevel] / 100) * 12);
            const freshEnvScore = Math.min(100, (foundCatalog.envScore || 50) + scoreIncrease);
            await supabase.from("catalogs").update({
              env_score: freshEnvScore
            }).eq("id", foundCatalog.id);

            // Log trend snap
            await supabase.from("catalog_trends").insert({
              catalog_id: foundCatalog.id,
              score: freshEnvScore
            });

            // XP and status for verify
            const currentStats = await getLiveUserStats(email || userStats?.email) || userStats;
            currentStats.verifiedCleanupsCount += 1;
            currentStats.xp += 15; // 15 XP reward

            if (currentStats.xp < 100) currentStats.level = "Observer";
            else if (currentStats.xp < 250) currentStats.level = "Eco Scout";
            else if (currentStats.xp < 500) currentStats.level = "Community Guardian";
            else if (currentStats.xp < 1000) currentStats.level = "Environmental Advocate";
            else currentStats.level = "Green Champion";

            const savedStats = await saveLiveUserStats(currentStats);

            // Update campaign NGO stats
            const liveOrgs = await getLiveOrganizations();
            const matchingOrg = (liveOrgs || []).find(o => o.name === foundCampaign.organizationName);
            if (matchingOrg) {
              const updatedImpactScore = Math.min(100, Math.round((matchingOrg.impactScore + computedScore) / 2));
              await supabase.from("organizations").update({ impact_score: updatedImpactScore }).eq("id", matchingOrg.id);
            }

            // Return updated objects
            const freshCats = await getLiveCatalogs();
            const freshOrgs = await getLiveOrganizations();
            const lastCatalog = (freshCats || []).find(c => c.id === foundCatalog.id);
            const lastCampaign = lastCatalog?.campaigns?.find((c: any) => c.id === campaignId);

            return res.json({
              campaign: lastCampaign,
              catalog: lastCatalog,
              userStats: savedStats || currentStats,
              organizations: freshOrgs || organizations
            });
          }
        }
      } catch (err) {
        console.warn("Could not register vote or update ranks on database:", err?.message || err);
      }
    }

    // Memory search fallback
    foundCampaign = null;
    foundCatalog = null;

    for (const cat of catalogs) {
      if (cat.campaigns) {
        const camp = cat.campaigns.find((c: any) => c.id === campaignId);
        if (camp) {
          foundCampaign = camp;
          foundCatalog = cat;
          break;
        }
      }
    }

    if (!foundCampaign) {
      return res.status(404).json({ error: "Target completed campaign not found." });
    }

    const newVerification = {
      id: `v_${Date.now()}`,
      campaignId: foundCampaign.id,
      voterEmail: email || userStats.email,
      timestamp: new Date().toLocaleDateString(),
      improvementLevel
    };

    foundCampaign.verifications.push(newVerification);
    foundCampaign.verificationsCount += 1;

    // Recalculate campaign verifiedImprovementScore based on voter weights
    const scoreMap: Record<string, number> = { Significant: 100, Moderate: 70, Little: 30, No: 0 };
    const totalScore = foundCampaign.verifications.reduce((sum: number, v: any) => sum + scoreMap[v.improvementLevel], 0);
    foundCampaign.verifiedImprovementScore = Math.round(totalScore / foundCampaign.verifications.length);

    // Dynamic catalyst: improve catalog Env Score since community cleanup actually yielded verified progress!
    const scoreIncrease = Math.round((scoreMap[improvementLevel] / 100) * 12); // max +12 indicator point
    foundCatalog.envScore = Math.min(100, foundCatalog.envScore + scoreIncrease);
    foundCatalog.trends.push({
      date: `Verified ${new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`,
      score: foundCatalog.envScore
    });

    // Award XP to voter & recalculate user stats
    userStats.verificationsCount += 1;
    userStats.xp += 15; // 15 XP per audit verification
    if (userStats.xp < 100) userStats.level = "Observer";
    else if (userStats.xp < 250) userStats.level = "Eco Scout";
    else if (userStats.xp < 500) userStats.level = "Community Guardian";
    else if (userStats.xp < 1000) userStats.level = "Environmental Advocate";
    else userStats.level = "Green Champion";

    // Update cleanup organization impact score
    const matchingOrg = organizations.find(o => o.name === foundCampaign.organizationName);
    if (matchingOrg) {
      matchingOrg.impactScore = Math.min(100, Math.round((matchingOrg.impactScore + foundCampaign.verifiedImprovementScore) / 2));
    }

    res.json({ campaign: foundCampaign, catalog: foundCatalog, userStats, organizations });
  });

  // API 10: EcoPulse Daily Check-in submit
  app.post("/api/ecopulse", async (req, res) => {
    const { transportMode, wasteSegregation, organicComposting, plasticReduction, energyConserved, email } = req.body;

    // General dynamic formula to derive new Eco score out of contributions and actions
    let dailyScore = 50;

    if (transportMode === "Walking/Biking/Public Transit") dailyScore += 25;
    else if (transportMode === "Shared Taxi / Carpooling") dailyScore += 15;
    else if (transportMode === "Single Occupancy Vehicle") dailyScore += 0;
    else if (transportMode && transportMode.trim().length > 0) dailyScore += 20;

    if (wasteSegregation === true || wasteSegregation === "yes" || (typeof wasteSegregation === "string" && wasteSegregation.trim().length > 0 && wasteSegregation !== "no")) dailyScore += 15;
    if (organicComposting === true || organicComposting === "yes" || (typeof organicComposting === "string" && organicComposting.trim().length > 0 && organicComposting !== "no")) dailyScore += 15;

    if (plasticReduction === "Strict Avoidance") dailyScore += 15;
    else if (plasticReduction === "Regular Reuse") dailyScore += 10;
    else if (plasticReduction === "None / Average Disposal") dailyScore += 0;
    else if (plasticReduction && plasticReduction.trim().length > 0) dailyScore += 12;

    if (energyConserved === true || energyConserved === "yes" || (typeof energyConserved === "string" && energyConserved.trim().length > 0 && energyConserved !== "no")) dailyScore += 10;

    // Calculate simulated Carbon footprint impact (kg CO2 estimate)
    const baseFootprint = 140; // baseline Cameroon citizen per week
    let reduction = 0;
    if (transportMode === "Walking/Biking/Public Transit") reduction += 30;
    else if (transportMode === "Shared Taxi / Carpooling") reduction += 15;
    else if (transportMode && transportMode !== "Single Occupancy Vehicle" && transportMode.trim().length > 0) reduction += 20;

    if (wasteSegregation === true || wasteSegregation === "yes" || (typeof wasteSegregation === "string" && wasteSegregation.trim().length > 0 && wasteSegregation !== "no")) reduction += 10;
    if (organicComposting === true || organicComposting === "yes" || (typeof organicComposting === "string" && organicComposting.trim().length > 0 && organicComposting !== "no")) reduction += 15;

    if (plasticReduction === "Strict Avoidance") reduction += 20;
    else if (plasticReduction === "Regular Reuse") reduction += 10;
    else if (plasticReduction && plasticReduction !== "None / Average Disposal" && plasticReduction.trim().length > 0) reduction += 12;

    if (energyConserved === true || energyConserved === "yes" || (typeof energyConserved === "string" && energyConserved.trim().length > 0 && energyConserved !== "no")) reduction += 15;

    // Save Live Supabase Stats
    try {
      const activeStats = await getLiveUserStats(email || userStats?.email) || userStats;
      activeStats.ecoPulseScore = Math.min(100, dailyScore);
      activeStats.carbonFootprint = Math.max(25, baseFootprint - reduction);
      activeStats.xp += 25; // 25 XP for EcoPulse daily commitment routine
      
      if (activeStats.xp < 100) activeStats.level = "Observer";
      else if (activeStats.xp < 250) activeStats.level = "Eco Scout";
      else if (activeStats.xp < 500) activeStats.level = "Community Guardian";
      else if (activeStats.xp < 1000) activeStats.level = "Environmental Advocate";
      else activeStats.level = "Green Champion";

      const savedStats = await saveLiveUserStats(activeStats);
      if (savedStats) {
        return res.json({ userStats: savedStats });
      }
    } catch (err) {
      console.warn("Self-reported daily checklist score not saved to live database:", err?.message || err);
    }

    userStats.ecoPulseScore = Math.min(100, dailyScore);
    userStats.carbonFootprint = Math.max(25, baseFootprint - reduction);
    userStats.xp += 25; // 25 XP
    
    if (userStats.xp < 100) userStats.level = "Observer";
    else if (userStats.xp < 250) userStats.level = "Eco Scout";
    else if (userStats.xp < 500) userStats.level = "Community Guardian";
    else if (userStats.xp < 1000) userStats.level = "Environmental Advocate";
    else userStats.level = "Green Champion";

    res.json({ userStats });
  });

  // API 11: Get single user stats profile
  app.get("/api/user-stats", async (req, res) => {
    try {
      const email = typeof req.query.email === "string" ? req.query.email : userStats?.email;
      const liveStats = await getLiveUserStats(email);
      if (liveStats) {
        return res.json(liveStats);
      }
    } catch (err) {
      console.warn("Direct score statistics row query failed:", err?.message || err);
    }
    
    // Provide memory fallback if email was provided and exists in map
    const emailToUse = typeof req.query.email === "string" ? req.query.email : userStats?.email;
    if (emailToUse && registeredUsersMap[emailToUse]) {
        return res.json(registeredUsersMap[emailToUse]);
    }
    
    // If client requested a specific email that doesn't exist, don't return the global seed
    if (typeof req.query.email === "string" && req.query.email !== userStats?.email) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userStats);
  });

  // API 11b: Direct Catalog Override, Score Modification & Reset
  app.post("/api/catalogs/:id/override", async (req, res) => {
    const catalogId = req.params.id;
    const { envScore, dirtinessScore, status, resetAll } = req.body;

    let targetCatalog: any = null;
    const supabase = getSupabase();

    // Look up and update in live DB if enabled
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("catalogs")
          .select("*")
          .eq("id", catalogId)
          .maybeSingle();

        if (data) {
          const updates: any = {};
          if (resetAll) {
            updates.env_score = null;
            updates.dirtiness_score = null;
            updates.status = "UNVERIFIED ALERT";
            updates.verification_progress = 0;
            updates.active_campaigns_count = 0;
          } else {
            if (envScore !== undefined) {
              updates.env_score = envScore === null || envScore === "" ? null : parseInt(envScore);
            }
            if (dirtinessScore !== undefined) {
              updates.dirtiness_score = dirtinessScore === "Insufficient Data" || dirtinessScore === null || dirtinessScore === "" ? null : parseInt(dirtinessScore);
            }
            if (status !== undefined) {
              updates.status = status;
              if (status === "VERIFIED CATALOG") {
                updates.verification_progress = 100;
              } else if (status === "UNVERIFIED ALERT") {
                updates.verification_progress = 0;
                updates.active_campaigns_count = 0;
              }
            }
          }
          updates.last_updated = new Date().toLocaleDateString();

          const { error: updateError } = await supabase
            .from("catalogs")
            .update(updates)
            .eq("id", catalogId);

          if (!updateError) {
             // also insert a trend snapshot
             if (updates.env_score !== undefined && updates.env_score !== null) {
               await supabase.from("catalog_trends").insert({
                 catalog_id: catalogId,
                 score: updates.env_score
               });
             }
             
             if (resetAll) {
               // clear related observations & campaigns in live DB if possible
               await supabase.from("observations").delete().eq("catalog_id", catalogId);
               await supabase.from("campaigns").delete().eq("catalog_id", catalogId);
             }

             const refreshed = await getLiveCatalogs();
             const updatedCat = (refreshed || []).find((c: any) => c.id === catalogId);
             return res.json({ success: true, catalog: updatedCat });
          }
        }
      } catch (err) {
        console.warn("Direct live override exception:", err?.message || err);
      }
    }

    // Backup / Fallback in-memory Catalogs array operation
    targetCatalog = catalogs.find((c) => c.id === catalogId);
    if (!targetCatalog) {
      return res.status(404).json({ error: "Catalog area not found." });
    }

    if (resetAll) {
      targetCatalog.envScore = null;
      targetCatalog.dirtinessScore = "Insufficient Data";
      targetCatalog.status = "UNVERIFIED ALERT";
      targetCatalog.verificationProgress = 0;
      targetCatalog.countedObservations = 0;
      targetCatalog.contributorCount = 0;
      targetCatalog.activeCampaignsCount = 0;
      targetCatalog.observations = [];
      targetCatalog.campaigns = [];
      targetCatalog.trends = [];
    } else {
      if (envScore !== undefined) {
        targetCatalog.envScore = envScore === null || envScore === "" ? null : parseInt(envScore);
      }
      if (dirtinessScore !== undefined) {
        targetCatalog.dirtinessScore = dirtinessScore === "Insufficient Data" || dirtinessScore === null || dirtinessScore === "" ? "Insufficient Data" : parseInt(dirtinessScore);
      }
      if (status !== undefined) {
        targetCatalog.status = status;
        if (status === "VERIFIED CATALOG") {
          targetCatalog.verificationProgress = 100;
          targetCatalog.minimumRequiredObservations = 0;
        } else if (status === "UNVERIFIED ALERT") {
          targetCatalog.verificationProgress = 0;
          targetCatalog.minimumRequiredObservations = 5;
          targetCatalog.countedObservations = 0;
          targetCatalog.contributorCount = 0;
          targetCatalog.observations = [];
          targetCatalog.campaigns = [];
        }
      }
    }
    targetCatalog.lastUpdated = new Date().toLocaleDateString();

    // Trigger trend snapshot point log
    if (targetCatalog.envScore !== null) {
      targetCatalog.trends.push({
        date: new Date().toLocaleDateString(),
        score: targetCatalog.envScore
      });
    }

    res.json({ success: true, catalog: targetCatalog });
  });

  // API 11c: Dyn Supabase configuration loader for browser clients
  app.get("/api/supabase-config", (req, res) => {
    const rawUrl = process.env.SUPABASE_URL || "";
    let cleanUrl = rawUrl.trim().replace(/\/+$/, "").replace(/\/(rest|auth)\/v1\/?$/, "");
    if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    res.json({
      supabaseUrl: cleanUrl,
      supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || "").trim()
    });
  });

  // API 11a: Auth Sign Up Register
  app.post("/api/auth/register", async (req, res) => {
    const { email, fullName, password, phone, region, city, townOrArrondissement, neighborhood, role, organizationName } = req.body;
    if (!email || !fullName || !password) {
      return res.status(400).json({ error: "Email, full name, and password are required to register." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    
    const newUser = {
      email: normalizedEmail,
      fullName: fullName.trim(),
      contributionsCount: 0,
      verificationsCount: 0,
      level: "Observer" as any,
      xp: 0,
      ecoPulseScore: 50,
      carbonFootprint: 140,
      region: region || "Centre",
      city: city || "Yaoundé",
      townOrArrondissement: townOrArrondissement || "Yaoundé VI (Melen)",
      neighborhood: neighborhood || "Melen",
      phone: phone || "+237 ",
      role: role || "Citizen Scientist",
      organizationName: organizationName || undefined
    };

    registeredUsersMap[normalizedEmail] = newUser;
    userStats = newUser;

    try {
      await saveLiveUserStats(newUser);
    } catch (e) {
      console.warn("Could not save registered user stats to database:", e);
    }

    res.status(201).json({ userStats: newUser });
  });

  // API 11b: Auth Sign In Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    
    let foundUser = null;
    try {
      const liveStats = await getLiveUserStats(normalizedEmail);
      if (liveStats) {
        foundUser = liveStats;
        registeredUsersMap[normalizedEmail] = liveStats;
      }
    } catch (e) {
      console.warn("Could not fetch user stats from live database:", e);
    }
    
    if (!foundUser) {
      foundUser = registeredUsersMap[normalizedEmail];
    }

    if (!foundUser) {
      return res.status(404).json({ error: "Profile not found with this email registration. Try using the default demo account, or select 'Create Account'." });
    }

    userStats = foundUser;

    try {
      await saveLiveUserStats(foundUser);
    } catch (e) {
      console.warn("Could not update live session database statistics:", e);
    }

    res.json({ userStats: foundUser });
  });

  // API 11d: Auth Google Sign-In or Automatic Registration
  app.post("/api/auth/google", async (req, res) => {
    const { email, fullName, picture } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required for Google Sign-In verification." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    
    let foundUser = null;
    try {
      const liveStats = await getLiveUserStats(normalizedEmail);
      if (liveStats) {
        foundUser = liveStats;
        registeredUsersMap[normalizedEmail] = liveStats;
      }
    } catch (e) {}
    
    if (!foundUser) {
      foundUser = registeredUsersMap[normalizedEmail];
    }

    if (!foundUser) {
      // Auto-register user with default values for Cameroon locations
      const name = fullName || email.split("@")[0] || "Eco Ranger";
      foundUser = {
        email: normalizedEmail,
        fullName: name,
        contributionsCount: 0,
        verificationsCount: 0,
        level: "Observer",
        xp: 0,
        ecoPulseScore: 50,
        carbonFootprint: 140,
        region: "South West", // Default region
        city: "Buea",       // Default city
        townOrArrondissement: "Molyko",  // Default town
        neighborhood: "Mayour street", // Sensible default
        phone: "+237 ",
        role: "Citizen Scientist"
      };

      registeredUsersMap[normalizedEmail] = foundUser;
      try {
        await saveLiveUserStats(foundUser);
      } catch (e) {
        console.warn("Could not save new Google user to DB:", e);
      }
    } else {
      // We can preserve or update their avatar/fullName if they prefer, but keeping the registered details is safer.
      if (fullName && !foundUser.fullName) {
        foundUser.fullName = fullName;
      }
    }

    userStats = foundUser;

    try {
      await saveLiveUserStats(foundUser);
    } catch (e) {
      console.warn("Could not edit live session for Google signin:", e);
    }

    res.json({ userStats: foundUser });
  });

  // API 11c: Auth Sign Out Logout
  app.post("/api/auth/logout", (req, res) => {
    userStats = registeredUsersMap["awahblaiseatanga@gmail.com"];
    res.json({ success: true, userStats });
  });


  // API 12: Get general Cameroon location lists (Region -> City -> Neighborhoods)
  app.get("/api/locations", (req, res) => {
    res.json(CAMEROON_LOCATIONS);
  });

  // API 13: Direct intelligent hotspots summary analysis
  app.get("/api/insights/summary", async (req, res) => {
    const client = getGeminiClient();
    let analysisCatalogs = catalogs;
    try {
      const live = await getLiveCatalogs();
      if (live !== null) {
        analysisCatalogs = live;
      }
    } catch (err) {
      console.warn("Live analytical database fetch failed, running insights on memory fallback:", err?.message || err);
    }
    
    // Core structural summary text
    let promptText = `Review this high level environmental status database for Cameroon:
    ${JSON.stringify(analysisCatalogs.map(c => ({
      name: `${c.neighborhood}, ${c.city}`,
      score: c.envScore,
      observationsCount: c.observations.length,
      activeCampaigns: c.activeCampaignsCount
    })))}
    
    Synthesize the information:
    1. Which zones are the most active hotspots of concern?
    2. Suggest a 30-word environmental policy or local community action recommendation for Douala vs Yaoundé based on the current scores.
    Respond with a simple clean HTML breakdown or Markdown paragraph without mentioning you parsed any JSON. Keep it professional.`;

    if (client) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          const modelRes = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText
          });
          if (modelRes.text) {
            return res.json({ insight: modelRes.text });
          }
          break;
        } catch (err: any) {
          attempts++;
          const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err) || "");
          console.warn(`Gemini intelligence insight attempt ${attempts} skipped or timed out:`, errMsg);
          
          const isCongested = errMsg.includes("503") || 
                              errMsg.includes("UNAVAILABLE") || 
                              errMsg.includes("high demand") || 
                              errMsg.includes("429") || 
                              errMsg.includes("quota") ||
                              errMsg.includes("exhausted") ||
                              errMsg.includes("limit") ||
                              errMsg.includes("556");

          if (isCongested || attempts >= maxAttempts) {
            console.warn("Congestion or exhaustion detected. Instantly breaking retry loop to invoke localized high-fidelity fallback.");
            break;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        }
      }
    }

    // Generate a beautiful, dynamic, customized fallback report based on real database state:
    const activeHotspots = analysisCatalogs
      .filter(c => c.envScore < 60)
      .map(c => `**${c.neighborhood} (${c.city})**`);
    
    const sortedCatalogs = [...analysisCatalogs].sort((a, b) => b.observations.length - a.observations.length);
    const topActive = sortedCatalogs[0];
    
    const hotspotClause = activeHotspots.length > 0 
      ? `* **Primary Hotspots Detected:** ${activeHotspots.slice(0, 3).join(", ")} are marked as **High Concern** due to low environmental sanity scores and active sanitation reports.`
      : `* **Primary Hotspots Detected:** All major zones present stable environmental indicators, though continued civic watch remains active in Douala Basin.`;
      
    const activityClause = topActive 
      ? `* **Highest Reporting Activity:** **${topActive.neighborhood} (${topActive.city})** has registered ${topActive.observations.length} active environmental logs, showing strong community vigilante reporting.`
      : `* **Highest Reporting Activity:** Clean-up campaign trackers are active across key districts of Yaoundé and Douala cities.`;

    const fallbackInsight = `### GreenLens Environmental Intelligence Summary (Offline Fallback Engine)

${hotspotClause}
${activityClause}
* **Geographical Recommendations:**
  - **Yaoundé VI Arrondissement (Melen, etc.):** Drainage channel unclogging remains the single highest priority to mitigate sudden monsoon water flow backups. We advise scheduling local 'Investissement Humain' cleaning weekends.
  - **Douala Basin (Bonaberi):** Heavy coastal rain overflow risks and informal dumping threaten local waterways. Focus on community awareness campaigns and containerized public waste bins.
* **NGO Status:** Civic teams are actively tracking and validating improvements. Continue uploading post-cleanup proofs to support your localized Eco Ranger XP ratings.`;

    res.json({
      insight: fallbackInsight
    });
  });

  // Support both versions of callback path with and without trailing slash
  app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sign In Callback</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background-color: #090d16;
              color: #ffffff;
              display: flex;
              height: 100vh;
              align-items: center;
              justify-content: center;
              margin: 0;
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-top: 3px solid #10b981;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="spinner"></div>
            <h3>Authenticating, please wait...</h3>
            <p>We are verifying your Google Ranger identity token.</p>
          </div>
          <script>
            // Supabase OAuth returns access_token / refresh_token in URL Hash
            const hash = window.location.hash || window.location.search;
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', hash: hash }, '*');
              window.close();
            } else {
              // Fallback
              window.location.href = '/' + hash;
            }
          </script>
        </body>
      </html>
    `);
  });

  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const appPromise = startServer();

import serverless from "serverless-http";

export const handler = async (event: any, context: any) => {
  const app = await appPromise;
  
  // Clone the event to safely modify the path
  const proxyEvent = Object.assign({}, event);
  
  // Normalize Netlify function path suffix to match standard Express routes
  if (proxyEvent.path && proxyEvent.path.startsWith('/.netlify/functions/api')) {
    proxyEvent.path = proxyEvent.path.replace('/.netlify/functions/api', '/api');
  }

  const handlerFn = serverless(app);
  return handlerFn(proxyEvent, context);
};

// Export appPromise for Vercel
export { appPromise };

if (process.env.NODE_ENV !== "test" && typeof require !== 'undefined' && require.main === module || process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs')) {
  appPromise.then(app => {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`GreenLens Express Server running on port ${PORT}`);
    });
  });
}

export default appPromise;
