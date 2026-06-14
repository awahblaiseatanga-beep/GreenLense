/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, MapPin, Users, ArrowUpRight, CheckCircle2, AlertTriangle, ChevronRight, BarChart3, TrendingUp, Calendar, Info, ShieldCheck, HelpCircle } from "lucide-react";
import { EnvironmentalCatalog, CameroonRegion } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import EnvironmentalMap from "./EnvironmentalMap";

interface ExploreTabProps {
  catalogs: EnvironmentalCatalog[];
  onSelectCatalog: (catalog: EnvironmentalCatalog) => void;
  onNavigateToInsights?: (anchorId?: string) => void;
}

export default function ExploreTab({ catalogs, onSelectCatalog, onNavigateToInsights }: ExploreTabProps) {
  const [selectedRegion, setSelectedRegion] = useState<CameroonRegion | "All">("All");

  // Calculations for Environmental Health Index & Hotspots
  const regionCatalogs = catalogs.filter(c => selectedRegion === "All" || c.region === selectedRegion);
  const avgScore = regionCatalogs.length > 0 
    ? Math.round(regionCatalogs.reduce((acc, curr) => acc + curr.envScore, 0) / regionCatalogs.length)
    : 0;
  
  const criticalCount = regionCatalogs.filter(c => c.envScore < 50).length;
  const activeCampaigns = regionCatalogs.reduce((acc, curr) => acc + (curr.activeCampaignsCount || 0), 0);
  const totalObservations = regionCatalogs.reduce((acc, curr) => acc + (curr.observations?.length || 0), 0);

  const regions: (CameroonRegion | "All")[] = [
    "All",
    "Centre",
    "Littoral",
    "North West",
    "South West",
    "West",
    "Adamaoua",
    "Far North",
    "North",
    "East",
    "South"
  ];

  return (
    <div className="space-y-8" id="explore-tab-view">
      {/* Hero Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto pt-4" id="explore-hero">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl" id="explore-title">
          Discover Environmental Catalogs
        </h1>
        <p className="text-gray-600 text-sm md:text-base leading-relaxed" id="explore-subtitle">
          Explore local community data, track resilience efforts, and find restoration projects across Cameroon.
        </p>
      </div>

      {/* Region selector box dropdown */}
      <div className="flex justify-center" id="regions-container">
        <div className="inline-flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs" id="region-dropdown-card">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-7 w-7 bg-emerald-50 rounded-lg text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">
              Select Region
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as CameroonRegion | "All")}
              className="py-1.5 pl-3 pr-8 text-xs font-bold font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer appearance-none"
              id="region-dropdown-select"
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region === "All" ? "ALL REGIONS" : region.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronRight className="h-3 w-3 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Centered Main Feed Container */}
      <div className="max-w-3xl mx-auto w-full" id="explore-grid">
        
        {/* Featured Environmental Catalogs Feed */}
        <div className="space-y-8" id="catalogs-feed">
          
          {/* Combined regional health overview & hotspot summaries with scrollbar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[320px]" id="combined-health-hotspots-card">
            {/* Unified Frame Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0" id="combined-frame-header">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono block">
                  Health Index & Hotspots
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded uppercase">
                {selectedRegion === "All" ? "National Average" : `${selectedRegion} Region`}
              </span>
            </div>

            {/* Scrollable Container */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin" id="combined-frame-scrollbar">
              {/* Part A: Statistics Dashboard */}
              <div className="space-y-3" id="inner-health-index-part">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="health-index-grid">
                  {/* Score Metric */}
                  <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100 flex items-center gap-2.5" id="metric-score">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white shrink-0 shadow-3xs ${
                      avgScore >= 75 ? "bg-primary" : avgScore >= 50 ? "bg-amber-600" : "bg-red-700"
                    }`}>
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Eco Score</span>
                      <span className="text-sm font-black text-gray-900 font-mono">{avgScore || 0}/100</span>
                      <span className="text-[8px] text-gray-500 block leading-tight">
                        {avgScore >= 75 ? "Satisfactory" : avgScore >= 50 ? "Moderate Alert" : "Critical Alert"}
                      </span>
                    </div>
                  </div>

                  {/* Counter Outposts */}
                  <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100 flex items-center gap-2.5" id="metric-outposts">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-800 flex items-center justify-center shrink-0 shadow-3xs font-bold">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Outposts</span>
                      <span className="text-sm font-black text-gray-900 font-mono">{regionCatalogs.length} Active</span>
                      <span className="text-[8px] text-gray-500 block leading-tight">Capitals & Communes</span>
                    </div>
                  </div>

                  {/* Campaigns Outposts */}
                  <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100 flex items-center gap-2.5" id="metric-activities">
                    <div className="h-9 w-9 rounded-full bg-cyan-500/10 text-cyan-800 flex items-center justify-center shrink-0 shadow-3xs">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Cleanups</span>
                      <span className="text-sm font-black text-gray-900 font-mono">{activeCampaigns} Active</span>
                      <span className="text-[8px] text-gray-500 block leading-tight">{totalObservations} Reports Filed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part B: Hotspot summaries List */}
              <div className="space-y-3 pt-4 border-t border-gray-100" id="inner-hotspots-part">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">
                  Active Hotspots Diagnosis
                </span>
                
                {criticalCount === 0 ? (
                  <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-lg text-xs" id="no-hotspots-banner">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[11px] leading-tight">No highly critical biological or refuse caking hotspots in the selected region. Keep monitoring!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="active-hotspot-summaries">
                    {regionCatalogs.filter(c => c.envScore < 70).map(hc => (
                      <div 
                        key={hc.id}
                        onClick={() => onSelectCatalog(hc)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-start ${
                          hc.envScore < 50 
                            ? "bg-red-50/40 border-red-200 hover:bg-red-50/70" 
                            : "bg-amber-50/40 border-amber-200 hover:bg-amber-50/70"
                        }`}
                        id={`hotspot-summary-${hc.id}`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 leading-none">{hc.neighborhood}</span>
                            <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded text-white leading-none ${
                              hc.envScore < 50 ? "bg-red-700" : "bg-amber-600"
                            }`}>
                              {hc.envScore < 50 ? "CRITICAL" : "RISK"}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            {hc.city} · Click to view
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-gray-900 block font-mono">Score {hc.envScore}</span>
                          <span className="text-[9px] text-primary hover:underline font-bold inline-flex items-center gap-0.5">Details &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Performing Leaderboard block */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="leaderboard-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">Top Performing Areas</h3>
            
            <div className="space-y-4" id="leaderboard-list">
              {/* Metric Card 1 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100" id="lb-item-1">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center font-mono shrink-0">
                    1
                  </span>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block leading-tight">Biyem-Assi</span>
                    <span className="text-[10px] uppercase text-gray-400 font-mono font-medium">Yaoundé • +12% Growth</span>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
              </div>

              {/* Metric Card 2 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100" id="lb-item-2">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center font-mono shrink-0">
                    2
                  </span>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block leading-tight">Akwa</span>
                    <span className="text-[10px] uppercase text-gray-400 font-mono font-medium">Douala • +8% Growth</span>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
              </div>

              {/* Metric Card 3 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100" id="lb-item-3">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 bg-gray-200 text-gray-700 text-xs font-bold rounded-full flex items-center justify-center font-mono shrink-0">
                    3
                  </span>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block leading-tight">Bastos</span>
                    <span className="text-[10px] uppercase text-gray-400 font-mono font-medium">Yaoundé • Stable State</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400 font-semibold shrink-0">--</span>
              </div>
            </div>
          </div>

          {/* Section 3: ENVIRONMENTAL MAP MODULE */}
          <EnvironmentalMap 
            catalogs={catalogs}
            selectedRegion={selectedRegion}
            onSelectCatalog={onSelectCatalog}
          />

          {/* Navigation Button to Insights Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center space-y-4" id="navigate-to-insights-panel">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-gray-950">Looking for Regional Feeds &amp; Catalogs?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We have migrated catalog intelligence, specific details channels and live community feeds to the interactive Insights Suite.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToInsights && onNavigateToInsights("insights-feeds")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md group border border-primary-dark cursor-pointer font-mono"
              id="btn-navigate-insights"
            >
              <span>Go to Featured Feeds &amp; Insights</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
