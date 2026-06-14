/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, BarChart3, TrendingUp, AlertOctagon, HelpCircle, ArrowUpRight, Loader, RefreshCw, Layers, CheckCircle2, Users, ChevronRight } from "lucide-react";
import { EnvironmentalCatalog } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface InsightsTabProps {
  catalogs: EnvironmentalCatalog[];
  onSelectCatalog?: (catalog: EnvironmentalCatalog) => void;
}

export default function InsightsTab({ catalogs, onSelectCatalog }: InsightsTabProps) {
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [advisorQuery, setAdvisorQuery] = useState("");
  const [advisorReply, setAdvisorReply] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);

  // Fetch AI environmental intelligence summary from server API
  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch("/api/insights/summary");
      const data = await response.json();
      if (response.ok) {
        setAiAnalysisSummary(data.insight);
      } else {
        setAiAnalysisSummary("Unable to retrieve catalog summary. Please check backend environment variables.");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysisSummary("Connection offline. Check that the custom Express server is running.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [catalogs]);

  // Handle Advisor Consultation query
  const handleAdvisorConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorQuery.trim()) return;
    setIsConsulting(true);

    try {
      // Simulate/Trigger dynamic response regarding Cameroon local context
      setTimeout(() => {
        const queryLower = advisorQuery.toLowerCase();
        let reply = "";

        if (queryLower.includes("douala") || queryLower.includes("bonaberi") || queryLower.includes("water") || queryLower.includes("flood")) {
          reply = `### AI Policy Recommendation: Douala Coastal Water Quality
  
1. **Physical Filtration Grates:** Installing localized trash meshes along the primary secondary outlets discharging into Wouri Estuary is paramount to arrest plastic floatables.
2. **Citizen Borehole Testing:** Given Douala's shallow water tables, we suggest deploying community-led 'Eco Scouts' with colorimetric well test kits to flag active chemical trace hazards early.
3. **Decentralized Compost Bins:** Setting up municipal waste droppoints at Bonaberi markets will route organic waste away from open drainage routes.`;
        } else if (queryLower.includes("yaoundé") || queryLower.includes("melen") || queryLower.includes("clog") || queryLower.includes("drainage")) {
          reply = `### AI Drainage Action Code: Yaoundé VI Slopes
  
1. **Seasonal De-clog Timelines:** Mobilize weekend civic cleaning work ('Investissement Humain') 2 weeks preceding the heavy equatorial rain seasons to ensure unimpeded flows.
2. **Enforce Riparian Buffers:** Constructing masonry perimeter retaining walls prevents residential waste from cascading down high-slope zones (e.g., Melen, Biyem-Assi) into secondary storm canals.
3. **Primary Sorting Hubs:** Support student micro-entrepreneurs setting up community plastic pelletizing stations to buy back plastic packaging.`;
        } else {
          reply = `### AI Environmental Policy Framework (West & North Cameroon)
  
* **Slope Stabilization:** Deploy vetiver grass lines along agricultural slope boundaries (e.g., Bamenda highlands, Dschang) to mitigate siltation and soil erosion.
* **Open Burning Mitigation:** Promote charcoal bio-gas digesters to transform agricultural waste into fuel, minimizing toxic ambient open burn smoke.
* **Rural Cataloging Expansion:** Train local traditional leaders on unmapped catalog grids to allow remote monitoring of clean water wells.`;
        }

        setAdvisorReply(reply);
        setIsConsulting(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsConsulting(false);
    }
  };

  // Build chart-ready data representing global score indicators
  const chartData = [
    { name: "Jan", Yaoundé: 60, Douala: 54, Bamenda: 75 },
    { name: "Feb", Yaoundé: 62, Douala: 55, Bamenda: 76 },
    { name: "Mar", Yaoundé: 61, Douala: 58, Bamenda: 76 },
    { name: "Apr", Yaoundé: 65, Douala: 60, Bamenda: 78 },
    { name: "May", Yaoundé: 68, Douala: 61, Bamenda: 80 },
    { name: "Jun", Yaoundé: 72, Douala: 64, Bamenda: 81 },
  ];

  return (
    <div className="space-y-8" id="insights-tab-view">
      
      {/* Tab Headline */}
      <div className="text-center space-y-2 pt-4" id="insights-header">
        <h2 className="text-2xl font-black text-primary tracking-tight md:text-3xl">Insights & Platform Intelligence</h2>
        <p className="text-gray-500 text-xs md:text-sm">
          AI synthesized risk trends, real-time hotspot indicators, and localized environmental action recommendations.
        </p>
      </div>

      {/* Grid: 8 Cols Score Charts and Policy Assistant, 4 Cols Active Hotspots and AI Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="insights-grid-container">
        
        {/* Left Span (8 Cols): Charts and Policy consultation */}
        <div className="lg:col-span-8 space-y-8" id="insights-primary">
          
          {/* Chart Widget */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6" id="score-trends-chart-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="chart-header">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block">
                  Metric Analytics Dashboard
                </span>
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  Historical Score Trends (0-100 Quality Index)
                </h3>
              </div>
              <div className="flex gap-4 text-xs font-mono font-bold" id="legend-pills">
                <span className="flex items-center gap-1.5 text-emerald-800"><span className="h-2 w-2 rounded-full bg-primary" /> Yaoundé VI</span>
                <span className="flex items-center gap-1.5 text-[#1b6d24]"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Douala IV</span>
                <span className="flex items-center gap-1.5 text-gray-700"><span className="h-2 w-2 rounded-full bg-gray-400" /> Bamenda II</span>
              </div>
            </div>

            {/* Recharts graph */}
            <div className="h-64 w-full" id="line-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00450d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00450d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDouala" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b6d24" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1b6d24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eded" />
                  <XAxis dataKey="name" stroke="#717a6d" fontSize={11} tickLine={false} />
                  <YAxis domain={[30, 100]} stroke="#717a6d" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Yaoundé" stroke="#00450d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorYao)" />
                  <Area type="monotone" dataKey="Douala" stroke="#1b6d24" strokeWidth={2} fillOpacity={1} fill="url(#colorDouala)" />
                  <Line type="monotone" dataKey="Bamenda" stroke="#9ca3af" strokeWidth={1.5} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Policy Advisor Consulting Q&A Module */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6" id="policy-advisor-card">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3" id="advisor-header">
              <HelpCircle className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="text-base font-black text-gray-900 leading-none">AI Environmental Policy & Action Advisor</h3>
                <span className="text-[10px] text-gray-400 font-medium">Get customized eco-strategies optimized for Cameroon-specific territories.</span>
              </div>
            </div>

            <form onSubmit={handleAdvisorConsult} className="flex gap-2" id="advisor-query-form">
              <input
                type="text"
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                placeholder="Ask e.g. 'How can we solve plastic clogging in Yaoundé drains?'"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 focus:bg-white focus:border-primary focus:outline-0 transition-all font-medium placeholder-gray-400"
                id="advisor-input"
              />
              <button
                type="submit"
                disabled={isConsulting || !advisorQuery.trim()}
                className="bg-primary hover:bg-primary-light disabled:bg-gray-200 text-white text-xs font-bold px-6 py-3 rounded-lg flex items-center gap-1.5 shrink-0 transition-all uppercase tracking-wider"
                id="advisor-submit"
              >
                {isConsulting ? <Loader className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Consult</span>
              </button>
            </form>

            {advisorReply && (
              <div className="bg-emerald-50/40 p-5 rounded-lg border border-emerald-100 animate-fadeIn space-y-3 shrink-0" id="advisor-reply-card">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#0c5216] px-2.5 py-1 bg-[#acf4a4] rounded inline-block font-mono">
                  Advisor Formulation Result:
                </span>
                <div className="text-xs text-gray-700 leading-relaxed space-y-3" id="advisor-markdown">
                  {/* Clean custom styling representing structured AI findings */}
                  <h4 className="font-bold text-gray-900 border-b border-emerald-200 pb-1 text-sm">{advisorQuery}</h4>
                  <div className="pl-2 border-l-2 border-primary space-y-2">
                    {advisorReply.split("\n\n").map((para, i) => (
                      <p key={i}>{para.replace(/^\d\.\s+|\*\s+/g, "◇ ")}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Span (4 Cols): Hotspots & AI Synthesized text highlights */}
        <div className="lg:col-span-4 space-y-6" id="insights-secondary">
          
          {/* Synthesized Live AI Insight Card with Refresh triggers */}
          <div className="bg-gradient-to-br from-emerald-950 to-primary text-white rounded-xl p-5 shadow-md space-y-4 relative overflow-hidden" id="synthesized-ai-card">
            {/* Ambient visual background glow details */}
            <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500 rounded-full blur-2xl opacity-20" />
            
            <div className="flex items-center justify-between" id="syn-card-header">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-450 animate-bounce" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">AI Synthesized Intelligence</h3>
              </div>
              <button
                onClick={fetchSummary}
                disabled={isLoadingSummary}
                className="text-emerald-300 hover:text-white transition-colors cursor-pointer"
                id="refresh-summary-btn"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingSummary ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isLoadingSummary ? (
              <div className="py-8 text-center space-y-3 text-emerald-100" id="loading-summary-block">
                <Loader className="h-8 w-8 animate-spin mx-auto text-emerald-300" />
                <p className="text-[11px] font-mono animate-pulse">Consulting Cameroon-focused intelligence model...</p>
              </div>
            ) : (
              <div className="text-xs text-emerald-100 leading-relaxed pr-1 font-medium space-y-3" id="ai-synthesized-text">
                {aiAnalysisSummary.split("\n\n").map((block, i) => (
                  <p key={i} className="border-l border-emerald-800 pl-3">
                    {block.replace(/^\*\s+/, "")}
                  </p>
                ))}
              </div>
            )}
            
            <span className="text-[10px] font-mono text-emerald-400 block pt-2 border-t border-emerald-900">
              Operational: gemini-3.5-flash
            </span>
          </div>

          {/* Active Emerging Hotspots Leaderboard widget */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4" id="hotspots-concerns-card">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">Emerging Hotspots of Concern</h3>

            <div className="space-y-3" id="hotspots-list">
              {/* Hotspot 1 */}
              <div className="p-3.5 bg-red-50/50 rounded-lg border border-red-150 flex gap-3 items-start" id="hotspot-item-1">
                <AlertOctagon className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-gray-900 block leading-none">Bonaberi Riverine Waterway</span>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold block uppercase">Douala Basin • Critical Status</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Chemical spills detected within 50 meters of community drinking borehole lines.</p>
                </div>
              </div>

              {/* Hotspot 2 */}
              <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200 flex gap-3 items-start" id="hotspot-item-2">
                <AlertOctagon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-black text-gray-900 block leading-none">Melen University Perimeter Road</span>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold block uppercase">Yaoundé VI • High Trash Load</span>
                  <p className="text-[10px] text-gray-500 leading-tight">Plastic bottleneck caking secondary drainage pipes, stagnant runoff hazard.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
