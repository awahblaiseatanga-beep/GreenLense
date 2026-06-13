/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CameroonRegion = 
  | "Centre"
  | "Littoral"
  | "North West"
  | "South West"
  | "West"
  | "Adamaoua"
  | "Far North"
  | "North"
  | "East"
  | "South";

export interface AIClassification {
  pollutionType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  tags: string[];
  suggestedAction: string;
  waterwayProximity: string;
}

export interface Observation {
  id: string;
  catalogId: string;
  photoUrl: string;
  description: string;
  reporterName: string;
  timestamp: string;
  aiClassification: AIClassification;
  pollutionTag?: "Clean" | "Slightly Polluted" | "Moderately Polluted" | "Highly Polluted" | "Extremely Polluted";
  coordinates?: {
    lat: number;
    lon: number;
  };
  facebookPostUrl?: string;
}

export interface Verification {
  id: string;
  campaignId: string;
  voterEmail: string;
  timestamp: string;
  improvementLevel: "Significant" | "Moderate" | "Little" | "No";
}

export interface Campaign {
  id: string;
  organizationName: string;
  title: string;
  catalogId: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed";
  beforeImage: string;
  afterImage?: string;
  verifications: Verification[];
  verifiedImprovementScore: number; // calculated 0-100 based on verification
  verificationsCount: number;
}

export interface EnvironmentalCatalog {
  id: string; // e.g. LOC_MLN_YAO_CEN_CMR
  region: CameroonRegion;
  city: string;
  townOrArrondissement: string;
  neighborhood: string;
  envScore: number; // 0-100
  dirtinessScore?: number | "Insufficient Data";
  dirtinessTrend?: "Improving" | "Getting Worse" | "Stable" | "Insufficient Data";
  coordinates: {
    lat: number;
    lon: number;
  };
  lastUpdated: string;
  activeCampaignsCount: number;
  observations: Observation[];
  campaigns: Campaign[];
  trends: {
    date: string;
    score: number;
  }[];
}

export interface Organization {
  id: string;
  name: string;
  type: "NGO" | "School" | "Community Group" | "Company";
  email: string;
  phone: string;
  areaCatalogId: string;
  description: string;
  impactScore: number; // calculated 0-100
}

export type EcoPulseLevel = 
  | "Observer" 
  | "Eco Scout" 
  | "Community Guardian" 
  | "Environmental Advocate" 
  | "Green Champion";

export interface UserStats {
  email: string;
  fullName: string;
  contributionsCount: number;
  verificationsCount: number;
  level: EcoPulseLevel;
  xp: number;
  ecoPulseScore: number; // general eco score
  carbonFootprint: number; // in kg CO2 per week
}

export interface EcoPulseCheckIn {
  transportMode: string;
  wasteSegregation: boolean;
  organicComposting: boolean;
  plasticReduction: string;
  energyConserved: boolean;
  timestamp: string;
}

export interface SeedData {
  catalogs: EnvironmentalCatalog[];
  organizations: Organization[];
  userStats: UserStats;
}
