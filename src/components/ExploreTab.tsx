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
}

export default function ExploreTab({ catalogs, onSelectCatalog }: ExploreTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<CameroonRegion | "All">("All");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter catalogs based on search query and region selection
  const filteredCatalogs = catalogs.filter(c => {
    const matchesSearch = 
      c.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.townOrArrondissement.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === "All" || c.region === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

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

      {/* Styled Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center gap-2 p-1.5 bg-white rounded-xl border border-gray-200 shadow-sm" id="search-form">
        <div className="relative flex-1 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Find your community catalog (e.g., Melen, Bonaberi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-2.5 pr-2 py-2 text-sm bg-transparent border-0 focus:outline-0 focus:ring-0 text-gray-800"
            id="search-input"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-light text-white text-xs font-semibold tracking-wider uppercase px-5 py-2.5 rounded-lg transition-all"
          id="search-btn"
        >
          Search
        </button>
      </form>

      {/* Region selector buttons */}
      <div className="space-y-2" id="regions-container">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono block">
          Regions of Cameroon
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" id="region-pills">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedRegion === region
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
              id={`region-pill-${region === "All" ? "all" : region.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {region === "All" ? "All Regions" : region}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout: Main Feed & Aggregated Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="explore-grid">
        
        {/* Featured Environmental Catalogs Feed (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-8" id="catalogs-feed">
          
          {/* Section 1: Environmental Health Index */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="environmental-health-index-sec">
            <div className="flex items-center justify-between" id="health-index-header">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono block">
                Environmental Health Index
              </span>
              <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded uppercase">
                {selectedRegion === "All" ? "Cameroon National Average" : `${selectedRegion} Region`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="health-index-grid">
              {/* Score Metric */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3" id="metric-score">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-3xs ${
                  avgScore >= 75 ? "bg-primary" : avgScore >= 50 ? "bg-amber-600" : "bg-red-700"
                }`}>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Eco Score</span>
                  <span className="text-lg font-black text-gray-900 font-mono">{avgScore || 0}/100</span>
                  <span className="text-[9px] text-gray-500 block">
                    {avgScore >= 75 ? "Satisfactory State" : avgScore >= 50 ? "Moderate Clog Risk" : "Critical Risk Level"}
                  </span>
                </div>
              </div>

              {/* Counter Outposts */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3" id="metric-outposts">
                <div className="h-11 w-11 rounded-full bg-emerald-500/10 text-emerald-800 flex items-center justify-center shrink-0 shadow-3xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Outposts</span>
                  <span className="text-lg font-black text-gray-900 font-mono">{regionCatalogs.length} Active</span>
                  <span className="text-[9px] text-gray-500 block">Monitored Communal Grids</span>
                </div>
              </div>

              {/* Campaigns Outposts */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3" id="metric-activities">
                <div className="h-11 w-11 rounded-full bg-cyan-500/10 text-cyan-800 flex items-center justify-center shrink-0 shadow-3xs">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Cleanups</span>
                  <span className="text-lg font-black text-gray-900 font-mono">{activeCampaigns} Active</span>
                  <span className="text-[9px] text-gray-500 block">{totalObservations} Total Citizen Reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Hotspot summaries List */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="hotspots-summary-sec">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono block">
              Active Hotspot Summaries
            </span>
            
            {criticalCount === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-lg text-xs" id="no-hotspots-banner">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-medium">No highly critical biological or refuse caking hotspots in the selected region. Keep cataloging data!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="active-hotspot-summaries">
                {regionCatalogs.filter(c => c.envScore < 70).map(hc => (
                  <div 
                    key={hc.id}
                    onClick={() => onSelectCatalog(hc)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex justify-between items-start ${
                      hc.envScore < 50 
                        ? "bg-red-50/40 border-red-200 hover:bg-red-50/70" 
                        : "bg-amber-50/40 border-amber-200 hover:bg-amber-50/70"
                    }`}
                    id={`hotspot-summary-${hc.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 leading-none">{hc.neighborhood}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-white leading-none ${
                          hc.envScore < 50 ? "bg-red-700" : "bg-amber-600"
                        }`}>
                          {hc.envScore < 50 ? "CRITICAL ALERT" : "MODERATE RISK"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        {hc.city} · Click to explore environmental data.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-900 block font-mono">Score {hc.envScore}</span>
                      <span className="text-[9px] text-primary hover:underline font-bold inline-flex items-center gap-0.5">Explore &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: ENVIRONMENTAL MAP MODULE */}
          <EnvironmentalMap 
            catalogs={catalogs}
            selectedRegion={selectedRegion}
            onSelectCatalog={onSelectCatalog}
          />

          {/* Section 4: Recent observations feed / catalog previews */}
          <div className="space-y-6" id="catalogs-feed-previews">
            <div className="flex items-center justify-between" id="feed-header">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Featured Catalogs & Feeds</h2>
              <span className="text-xs text-primary font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                View All ({filteredCatalogs.length}) <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            {filteredCatalogs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 space-y-3" id="no-catalogs-card">
                <Info className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-gray-600 text-sm font-medium">No catalogs found matching the parameters.</p>
                <p className="text-xs text-gray-400">Be the first to create the catalog in the Contribute screen!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="catalogs-grid">
              {filteredCatalogs.map((catalog) => {
                const recentObservation = catalog.observations[0];
                return (
                  <div
                    key={catalog.id}
                    onClick={() => onSelectCatalog(catalog)}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:border-accent hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    id={`catalog-card-${catalog.id}`}
                  >
                    <div>
                      {/* Image header with verified design badge */}
                      <div className="relative h-44 bg-gray-100 overflow-hidden" id="card-media-wrapper">
                        <img
                          src={recentObservation?.photoUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"}
                          alt={catalog.neighborhood}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1.5 rounded text-white ${
                            catalog.envScore >= 75 ? "bg-primary" : catalog.envScore >= 50 ? "bg-amber-600" : "bg-red-700"
                          }`} id="card-verified-badge">
                            {catalog.envScore >= 75 ? "Verified Safe" : catalog.envScore >= 50 ? "Community Managed" : "Heavy Risk Zone"}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-4" id="card-content">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {catalog.neighborhood}, {catalog.city}
                          </h3>
                          <span className="text-[11px] font-mono tracking-tight text-gray-400 font-medium block">
                            LAT {catalog.coordinates.lat.toFixed(4)}° N • LON {catalog.coordinates.lon.toFixed(4)}° E
                          </span>
                        </div>

                        {/* Environmental Score Progress bar bar */}
                        <div className="space-y-1.5" id="card-score-wrapper">
                          <div className="flex justify-between text-xs" id="score-text-inner">
                            <span className="text-gray-500 font-semibold">Environmental Score</span>
                            <span className="font-bold text-gray-900 font-mono">{catalog.envScore}/100</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden" id="progress-container">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                catalog.envScore >= 75 ? "bg-primary" : catalog.envScore >= 50 ? "bg-amber-600" : "bg-red-700"
                              }`}
                              style={{ width: `${catalog.envScore}%` }}
                              id="progress-bar-fill"
                            />
                          </div>

                          {/* Deterministic Area Dirtiness Score Indicator */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs" id="card-dirtiness-indicator">
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Area Dirtiness</span>
                              <span className="font-black text-gray-800 text-xs">
                                {catalog.dirtinessScore === "Insufficient Data" ? "Insufficient Data" : `${catalog.dirtinessScore}/100`}
                              </span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Trend</span>
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wide
                                ${catalog.dirtinessTrend === "Improving" 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : catalog.dirtinessTrend === "Getting Worse"
                                  ? "bg-red-100 text-red-800"
                                  : catalog.dirtinessTrend === "Stable"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-500"}`}
                              >
                                {catalog.dirtinessTrend === "Insufficient Data" ? "N/A" : catalog.dirtinessTrend}
                              </span>
                            </div>
                          </div>

                          {/* Meta statistics footer */}
                          <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono tracking-wider pt-2 border-t border-gray-50 mt-1">
                            <span>REPORTS: {catalog.observations?.length || 0}</span>
                            <span>UPDATED: {catalog.lastUpdated || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Status Footer */}
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium" id="card-footer">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        {catalog.activeCampaignsCount} Active Campaigns
                      </span>
                      <span className="text-primary font-bold inline-flex items-center gap-0.5 group-hover:underline">
                        Explore Catalog <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>

        {/* Cameroon-First Sidebar Region Preview & Metrics leaderboard (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6" id="explore-sidebar">
          
          {/* Custom vector Region Map aggregation widget */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="region-preview-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">Region Preview</h3>
            
            <div className="aspect-[4/3] bg-emerald-50/50 rounded-lg overflow-hidden border border-emerald-100 relative flex items-center justify-center p-4">
              {/* Specialized Abstract Vector Map of Cameroon to prevent blank Google Map issues */}
              <svg viewBox="0 0 200 240" className="w-full h-full text-emerald-800 opacity-80" id="cameroon-vector-svg">
                {/* Coastal / Littoral Highlight */}
                <path d="M 40 180 Q 50 160 30 140 Q 60 120 70 140 Z" fill="#90d689" opacity={selectedRegion === "Littoral" ? 0.9 : 0.4} className="transition-all duration-300" />
                {/* Centre Highlands Highlight */}
                <path d="M 70 140 Q 100 120 110 140 Q 110 170 80 180 Z" fill="#1b5e20" opacity={selectedRegion === "Centre" || selectedRegion === "All" ? 0.8 : 0.3} className="transition-all duration-300" />
                {/* North West and South West */}
                <path d="M 30 140 Q 40 110 60 90 Q 70 120 60 140 Z" fill="#7cdb7a" opacity={selectedRegion === "North West" || selectedRegion === "South West" ? 0.9 : 0.4} className="transition-all duration-300" />
                {/* Far North Extension */}
                <path d="M 120 90 Q 140 40 160 20 Q 180 50 140 115 Z" fill="#acf4a4" opacity={0.3} />
                
                {/* Visual marker pins */}
                <circle cx="85" cy="150" r="4" fill="#00450d" /> 
                <text x="92" y="152" className="text-[8px] font-bold font-mono uppercase" fill="#00450d">YAO</text>
                
                <circle cx="48" cy="155" r="4" fill="#1b6d24" />
                <text x="32" y="167" className="text-[8px] font-bold font-mono uppercase" fill="#1b6d24">DLA</text>

                <circle cx="50" cy="115" r="4" fill="#2a6b2c" />
                <text x="36" y="108" className="text-[8px] font-bold font-mono uppercase" fill="#2a6b2c">BMD</text>
              </svg>

              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded border border-emerald-100 text-[10px] text-gray-500 font-medium">
                Showing aggregates for <span className="text-primary font-bold">{selectedRegion === "All" ? "All Cameroon Capitals" : selectedRegion}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed text-center" id="map-fallback-disclaimer">
              GreenLens coordinates represent the primary catalog grids designed for rural and unmapped communes of Cameroon.
            </p>
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
        </div>

      </div>
    </div>
  );
}
