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
  onNavigateToImpact?: () => void;
}

export default function ExploreTab({ catalogs, onSelectCatalog, onNavigateToInsights, onNavigateToImpact }: ExploreTabProps) {
  const [selectedRegion, setSelectedRegion] = useState<CameroonRegion | "All">("All");

  // Calculations for Environmental Health Index & Hotspots
  const regionCatalogs = catalogs.filter(c => selectedRegion === "All" || c.region === selectedRegion);
  const activeCatalogs = regionCatalogs.filter(c => c.isActive !== false && c.envScore !== null);
  const emergingCatalogs = regionCatalogs.filter(c => c.isActive === false || c.envScore === null);

  const avgScore = activeCatalogs.length > 0 
    ? Math.round(activeCatalogs.reduce((acc, curr) => acc + (curr.envScore || 0), 0) / activeCatalogs.length)
    : 0;
  
  const criticalCount = activeCatalogs.filter(c => (c.envScore || 0) < 50).length;
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

      {/* RECENT LIVE FEED */}
      <div className="max-w-3xl mx-auto w-full space-y-4" id="explore-live-feed-module">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full border-2 border-green-500 bg-green-500 animate-pulse"></span>
            Live Community Feed
          </h2>
          <span className="text-[10px] text-gray-400 font-mono uppercase">Global Database Sync</span>
        </div>
        
        {(() => {
          const allObservations = catalogs.flatMap(cat => 
            (cat.observations || []).map(obs => ({ ...obs, locationData: `${cat.neighborhood}, ${cat.city}` }))
          ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          return allObservations.length === 0 ? (
            <div className="p-4 bg-gray-50 text-center rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-mono italic">No community observations recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allObservations.slice(0, 4).map((obs) => (
                <div key={obs.id} className="flex gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-xs hover:border-primary/30 transition-colors">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    {obs.photoUrl ? (
                      <img src={obs.photoUrl} alt="Report" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <MapPin className="h-6 w-6 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-xs font-bold text-gray-900 truncate pr-2">{obs.reporterName}</span>
                      <span className="text-[9px] text-gray-400 font-mono shrink-0 whitespace-nowrap">
                        {new Date(obs.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono truncate mb-1 text-primary">{obs.locationData}</p>
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight">
                      {obs.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
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
                    {activeCatalogs.filter(c => (c.envScore || 0) < 70).map(hc => (
                      <div 
                        key={hc.id}
                        onClick={() => onSelectCatalog(hc)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-start ${
                          (hc.envScore || 0) < 50 
                            ? "bg-red-50/40 border-red-200 hover:bg-red-50/70" 
                            : "bg-amber-50/40 border-amber-200 hover:bg-amber-50/70"
                        }`}
                        id={`hotspot-summary-${hc.id}`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-900 leading-none">{hc.neighborhood}</span>
                            <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded text-white leading-none ${
                              (hc.envScore || 0) < 50 ? "bg-red-700" : "bg-amber-600"
                            }`}>
                              {(hc.envScore || 0) < 50 ? "CRITICAL" : "RISK"}
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

              {/* Areas Needing Verification */}
              {emergingCatalogs.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-4 bg-amber-100 rounded flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest font-mono">Areas Needing Verification</span>
                    <div className="h-px bg-gray-200 flex-1 ml-2"></div>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {emergingCatalogs.map(em => (
                      <div 
                        key={em.id} 
                        className="bg-white border-2 border-dashed border-amber-200/60 hover:border-amber-400 rounded-xl p-3.5 transition-colors cursor-pointer group shadow-xs hover:bg-amber-50/10"
                        onClick={() => onSelectCatalog(em)}
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div>
                            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded leading-none">
                              {em.neighborhood}
                            </span>
                            <span className="text-[10px] text-gray-500 block mt-1 ml-0.5">{em.city}</span>
                          </div>
                          <span className="flex items-center gap-1 text-[9px] font-mono font-black text-amber-600 uppercase tracking-wider bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Unverified Alert
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-2.5">
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-4">
                                <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-widest text-gray-400 font-mono">Observations</span>
                                    <span className="text-xs font-black text-gray-800 font-mono">{em.observationCount} <span className="text-gray-400 text-[10px] font-medium">/ 5</span></span>
                                </div>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="text-left">
                                    <span className="block text-[8px] uppercase tracking-widest text-gray-400 font-mono">Contributors</span>
                                    <span className="text-xs font-black text-gray-800 font-mono">{em.contributorCount || 0} <span className="text-gray-400 text-[10px] font-medium">/ 3</span></span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="text-[11px] font-mono font-black text-amber-600">
                                  {em.verificationProgress || 0}%
                                </span>
                             </div>
                          </div>
                          
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-amber-500 transition-all duration-1000" 
                               style={{ width: `${em.verificationProgress || 0}%` }} 
                             />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-mono">Created: {em.lastUpdated}</span>
                            <button className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white font-bold px-3 py-1.5 rounded-lg transition-colors border border-amber-200 font-mono uppercase tracking-tight group-hover:bg-amber-500 group-hover:text-white">Help Verify</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Navigation Button to Impact Section containing feeds */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center space-y-4" id="navigate-to-impact-feeds-panel">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-gray-950">Looking for Live Impact Feeds?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We have migrated catalog intelligence, specific details channels and live community progress feeds directly to the Impact and Audits Suite.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToImpact ? onNavigateToImpact() : (onNavigateToInsights && onNavigateToInsights("insights-feeds"))}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md group border border-primary-dark cursor-pointer font-mono"
              id="btn-navigate-impact-feeds"
            >
              <span>Go to Community Feeds &amp; Impact</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
