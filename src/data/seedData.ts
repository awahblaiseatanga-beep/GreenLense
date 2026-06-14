/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnvironmentalCatalog, Organization, UserStats } from "../types";

export const SEED_CATALOGS: EnvironmentalCatalog[] = [
  {
    id: "LOC_MLN_YAO_CEN_CMR",
    region: "Centre",
    city: "Yaoundé",
    townOrArrondissement: "Yaoundé VI",
    neighborhood: "Melen",
    envScore: 72,
    dirtinessScore: 28,
    dirtinessTrend: "Improving",
    coordinates: { lat: 3.8667, lon: 11.5167 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 1,
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
        pollutionTag: "Highly Polluted",
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
          { id: "v_2", campaignId: "camp_melen_1", voterEmail: "ngando@gmail.com", timestamp: "2026-06-04", improvementLevel: "Significant" }
        ],
        verifiedImprovementScore: 88,
        verificationsCount: 2
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
    dirtinessScore: 36,
    dirtinessTrend: "Stable",
    coordinates: { lat: 4.0833, lon: 9.6833 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 1,
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
        pollutionTag: "Highly Polluted",
        aiClassification: {
          pollutionType: "Industrial Runoff & Water Contamination",
          severity: "Critical",
          confidence: 0.96,
          tags: ["Heavy Chemical Trace", "Drinking Well Threat", "River Estuary Risk"],
          suggestedAction: "Deploy immediate barriers, alert municipal inspectors, and secure water safety alerts.",
          waterwayProximity: "Severe (adjacent to Wouri River bank)"
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
          { id: "v_b1", campaignId: "camp_bonaberi_1", voterEmail: "douala_scout@gmail.com", timestamp: "2026-06-12", improvementLevel: "Moderate" }
        ],
        verifiedImprovementScore: 78,
        verificationsCount: 1
      }
    ]
  },
  {
    id: "LOC_NKW_BAM_NW_CMR",
    region: "North West",
    city: "Bamenda",
    townOrArrondissement: "Bamenda II",
    neighborhood: "Nkwen",
    envScore: 81,
    dirtinessScore: 19,
    dirtinessTrend: "Stable",
    coordinates: { lat: 5.9667, lon: 10.1500 },
    lastUpdated: new Date().toLocaleDateString(),
    activeCampaignsCount: 0,
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
        pollutionTag: "Slightly Polluted",
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
    dirtinessScore: 22,
    dirtinessTrend: "Improving",
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
        pollutionTag: "Moderately Polluted",
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
    dirtinessScore: 18,
    dirtinessTrend: "Stable",
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
    dirtinessScore: 31,
    dirtinessTrend: "Stable",
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
        pollutionTag: "Highly Polluted",
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
    dirtinessScore: 39,
    dirtinessTrend: "Stable",
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
        pollutionTag: "Highly Polluted",
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
  }
];

export const SEED_ORGANIZATIONS: Organization[] = [
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

export const SEED_USER_STATS: UserStats = {
  email: "awahblaiseatanga@gmail.com",
  fullName: "Awah Blaise Atanga",
  contributionsCount: 2,
  verificationsCount: 3,
  level: "Eco Scout",
  xp: 140,
  ecoPulseScore: 78,
  carbonFootprint: 112
};
