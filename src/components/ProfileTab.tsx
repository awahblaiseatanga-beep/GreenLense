/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserStats, EcoPulseCheckIn } from "../types";
import { Award, Zap, Navigation, Trash2, Leaf, Shield, CheckCircle2, Flame, Loader, RefreshCw, BarChart, Info } from "lucide-react";

interface ProfileTabProps {
  userStats: UserStats;
  onEcoPulseSubmitted: (pulseAnswers: EcoPulseCheckIn) => void;
}

export default function ProfileTab({ userStats, onEcoPulseSubmitted }: ProfileTabProps) {
  const [transportMode, setTransportMode] = useState("Walking/Biking/Public Transit");
  const [wasteSegregation, setWasteSegregation] = useState(false);
  const [organicComposting, setOrganicComposting] = useState(false);
  const [plasticReduction, setPlasticReduction] = useState("Regular Reuse");
  const [energyConserved, setEnergyConserved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pulseSubmitted, setPulseSubmitted] = useState(false);

  // Parse Rank Level details for display
  const levelInfoMap: Record<string, { desc: string; color: string; bg: string }> = {
    "Observer": { desc: "Initial environmental registrar capturing initial local anomalies.", color: "text-amber-700", bg: "bg-amber-50 border-amber-250" },
    "Eco Scout": { desc: "Active community recorder tracking plastic clogs and sewage spills.", color: "text-[#1b6d24]", bg: "bg-[#a0f399]/20 border-[#c0c9bb]" },
    "Community Guardian": { desc: "Regular verifier validating NGO efforts and leading weekend sweeps.", color: "text-primary", bg: "bg-emerald-50 border-emerald-250" },
    "Environmental Advocate": { desc: "Lobbying local municipality administrations to build structured storm filters.", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    "Green Champion": { desc: "Ultimate environmental steward managing Cameroon-wide catalog networks.", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" }
  };

  const currentLevelInfo = levelInfoMap[userStats.level] || levelInfoMap["Observer"];

  // XP Progress Calculation
  const nextTargetXP = userStats.xp < 100 ? 100 : userStats.xp < 250 ? 250 : userStats.xp < 500 ? 500 : userStats.xp < 1000 ? 1000 : 2500;
  const progressPercent = Math.min(100, Math.round((userStats.xp / nextTargetXP) * 100));

  // Submit daily EcoPulse check-in
  const handlePulseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);

    try {
      const response = await fetch("/api/ecopulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportMode,
          wasteSegregation,
          organicComposting,
          plasticReduction,
          energyConserved
        })
      });

      const data = await response.json();
      if (response.ok) {
        onEcoPulseSubmitted({
          transportMode,
          wasteSegregation,
          organicComposting,
          plasticReduction,
          energyConserved,
          timestamp: new Date().toISOString()
        });
        setPulseSubmitted(true);
      } else {
        alert("Failed calculating sustainability pulse.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8" id="profile-tab-view">
      
      {/* Dynamic Profile Cover Banner */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm pt-4" id="profile-card">
        <div className="h-28 relative overflow-hidden" id="profile-background">
          <img 
            src="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80" 
            alt="Cameroon Horizon Greenery" 
            className="w-full h-full object-cover brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 mix-blend-multiply" />
          <div className="absolute -bottom-6 left-6 h-16 w-16 bg-white rounded-full flex items-center justify-center p-1 shadow-sm" id="user-avatar">
            <div className="h-full w-full bg-emerald-100 text-primary font-black flex items-center justify-center rounded-full text-base">
              {userStats.fullName.split(" ").map(x => x[0]).join("")}
            </div>
          </div>
        </div>

        {/* User Stats Summary block */}
        <div className="p-6 pt-8 space-y-6" id="profile-details">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="user-primary-row">
            <div>
              <h3 className="text-xl font-extrabold text-gray-950">{userStats.fullName}</h3>
              <span className="text-xs text-mono text-gray-400 font-semibold">{userStats.email}</span>
            </div>
            
            {/* Level Badge */}
            <div className={`px-4 py-2 rounded-xl border text-xs font-bold font-mono tracking-tight text-center ${currentLevelInfo.bg}`} id="user-level-badge">
              <span className="block uppercase text-[9px] text-gray-400 leading-none">Intelligence Status</span>
              <span className={`text-xs font-black ${currentLevelInfo.color}`}>{userStats.level}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 max-w-xl leading-relaxed" id="level-description">
            <span className="font-bold text-gray-700">Role:</span> {currentLevelInfo.desc}
          </p>

          {/* XP Progress Bar */}
          <div className="space-y-1.5" id="xp-panel">
            <div className="flex justify-between text-xs font-bold text-gray-400 font-mono" id="xp-thresholds">
              <span>{userStats.xp} XP Accumulate</span>
              <span>Next Rank: {nextTargetXP} XP</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden" id="xp-level-progress-bar">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2" id="quick-stats-grid">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center" id="stat-obs">
              <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Observations Reported</span>
              <span className="text-xl font-black text-gray-900 font-mono">{userStats.contributionsCount}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center" id="stat-verifier">
              <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Verifications Audited</span>
              <span className="text-xl font-black text-gray-900 font-mono">{userStats.verificationsCount}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center" id="stat-pulse">
              <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">EcoPulse Index</span>
              <span className="text-xl font-black text-[#1b6d24] font-mono">{userStats.ecoPulseScore}/100</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center" id="stat-footprint">
              <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Weekly CO2 Estimate</span>
              <span className="text-xl font-black text-amber-700 font-mono">{userStats.carbonFootprint} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 30-Second EcoPulse Check-In Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="ecopulse-outer-grid">
        
        {/* Left Span: Entry Form Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6" id="pulse-wizard">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3" id="pulse-header">
            <Flame className="h-5 w-5 text-primary shrink-0" />
            <div>
              <h3 className="text-base font-black text-gray-950">EcoPulse: Daily 30sec Sustainability Check</h3>
              <span className="text-[10px] text-gray-400 font-medium">Log daily footprint behaviours to establish catalog weights.</span>
            </div>
          </div>

          <form onSubmit={handlePulseSubmit} className="space-y-4" id="pulse-form">
            
            {/* Field 1: Transport */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">1. Transport Mode Today</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full bg-gray-50 border border-gray-205 rounded-lg p-2.5 text-xs font-semibold text-gray-800 cursor-pointer focus:bg-white focus:outline-0 transition-all"
              >
                <option value="Walking/Biking/Public Transit">Walking, Pedal Cycle, or Shared Bus (Transcam)</option>
                <option value="Shared Taxi / Carpooling">Shared Yellow Cab / Carpooling Car</option>
                <option value="Single Occupancy Vehicle">Personal Single Occupant Car / Moto Taxi</option>
              </select>
            </div>

            {/* Field 4: Plastic */}
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">2. Single-use Plastics Discard approach</label>
              <select
                value={plasticReduction}
                onChange={(e) => setPlasticReduction(e.target.value)}
                className="w-full bg-gray-50 border border-gray-205 rounded-lg p-2.5 text-xs font-semibold text-gray-800 cursor-pointer focus:bg-white focus:outline-0 transition-all"
              >
                <option value="Strict Avoidance">Strict Avoidance (Carried reusable canvas bag)</option>
                <option value="Regular Reuse">Regular Reuse (Segregated plastic bottles for recycling)</option>
                <option value="None / Average Disposal">Normal Disposal (Discarded wrapper in municipal mix bin)</option>
              </select>
            </div>

            {/* Checklist Options */}
            <div className="space-y-2.5 pt-1" id="pulse-checklist">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono block">3. Domestic Action List</label>
              
              {/* Segregation */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={wasteSegregation}
                  onChange={(e) => setWasteSegregation(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-0 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Waste Separation</span>
                  <p className="text-[10px] text-gray-500">I separated organic agricultural food scraps from non-biodegradable solids.</p>
                </div>
              </label>

              {/* Composting */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={organicComposting}
                  onChange={(e) => setOrganicComposting(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-0 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Organic Composting</span>
                  <p className="text-[10px] text-gray-500">I directed biodegradable kitchen compost back to gardening soil pits.</p>
                </div>
              </label>

              {/* Energy Conserved */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={energyConserved}
                  onChange={(e) => setEnergyConserved(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-0 border-gray-300 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Energy Curtailment</span>
                  <p className="text-[10px] text-gray-500">I turned off unnecessary electronic grids, bulbs, or charging sockets.</p>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-200 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all"
              id="pulse-submit-btn"
            >
              {isSyncing ? <Loader className="h-4 w-4 animate-spin text-white" /> : <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />}
              <span>Sync EcoPulse Score</span>
            </button>

          </form>
        </div>

        {/* Right Span: AI Results and Tips Feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4" id="pulse-output">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">Footprint Feedback & Recommendations</h3>

          {pulseSubmitted ? (
            /* Submitted feedback */
            <div className="space-y-6 animate-fadeIn" id="submitted-feedback-card">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3" id="feedback-highlight">
                <div className="flex items-center gap-2" id="feedback-heading">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-800 font-mono uppercase">Synchronization Safe</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your daily environmental behaviors have been compiled on our server data tables. Your revised Ecological index represents <span className="text-primary font-bold">{userStats.ecoPulseScore}/100</span>, which is above average for Cameroon capital districts.
                </p>
              </div>

              {/* Eco Suggestions List */}
              <div className="space-y-3" id="suggestions-block">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">Action Recommendations</span>
                
                <div className="space-y-2 text-xs" id="suggestions-list-items">
                  <div className="p-3 bg-gray-50 rounded-lg flex gap-2 items-start">
                    <Leaf className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block leading-none">Strengthen Compost Cycle</span>
                      <p className="text-[10px] text-gray-500 leading-tight">Since you composting kitchen scraps, you significantly divert waste away from Municipal dumps.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg flex gap-2 items-start">
                    <Zap className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block leading-none">Optimize Commute Strategy</span>
                      <p className="text-[10px] text-gray-500 leading-tight">By selecting low-carbon commutes, you keep your weekly carbon footprint under 115 kilograms.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Pre submission state prompt */
            <div className="text-center py-12 text-gray-400 space-y-3" id="empty-feedback-prompt">
              <Info className="h-10 w-10 text-gray-200 mx-auto" />
              <p className="text-xs max-w-xs mx-auto">Fill in the EcoPulse daily answers on the left to review your dynamic carbon weight metrics and conservation strategies.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
