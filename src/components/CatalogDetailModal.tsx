/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { EnvironmentalCatalog, Campaign } from "../types";
import { X, MapPin, Users, History, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, BarChart3, TrendingUp, Calendar, Info, Award, Loader, Facebook, ExternalLink, Sliders, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CAMPAIGN_AFTER_PRESETS = [
  {
    title: "Clean Water",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Eco Trail",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Park Garden",
    url: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Healthy Soil",
    url: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80"
  }
];

interface CatalogDetailModalProps {
  catalog: EnvironmentalCatalog;
  onClose: () => void;
  onCompleteCampaign: (campaignId: string, afterImage: string) => void;
  onAddObservation?: (newObs: any, updatedCatalog: any, updatedStats: any) => void;
  onUpdateCatalog?: (updatedCatalog: any) => void;
}

export default function CatalogDetailModal({ catalog, onClose, onCompleteCampaign, onAddObservation, onUpdateCatalog }: CatalogDetailModalProps) {
  const [typedAfterUrl, setTypedAfterUrl] = useState("");
  const [activeCompletingId, setActiveCompletingId] = useState<string | null>(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Completed campaign completion helper
  const handleCompleteActionSubmit = async (campaignId: string) => {
    if (!typedAfterUrl.trim()) return;
    setSubmittingCompletion(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterImage: typedAfterUrl })
      });

      if (response.ok) {
        onCompleteCampaign(campaignId, typedAfterUrl);
        setTypedAfterUrl("");
        setActiveCompletingId(null);
        alert("Cleanup campaign marked as Completed! It is now loaded into the side-by-side verification trust screen.");
      } else {
        alert("Failed registering campaign completion.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCompletion(false);
    }
  };

  // Direct modal verification image presets & form state hooks
  const OBS_PRESETS = [
    {
      title: "Clogged Gutter",
      url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
      description: "Clogged concrete gutter filled with plastics, silt, and urban stagnant water blocks in Douala/Yaoundé district."
    },
    {
      title: "Waste Pile",
      url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
      description: "Severe unsorted domestic waste heap and illegal street side plastic trash dumpsite."
    },
    {
      title: "Water Litter",
      url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
      description: "Fluvial waterway plastic pollution accumulating near drainage outlets and channels."
    },
    {
      title: "Air Smoke",
      url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
      description: "Open combustion of plastic waste heaps releasing harmful dark soot on neighborhood margins."
    }
  ];

  const [showDirectForm, setShowDirectForm] = useState(true);
  const [directDescription, setDirectDescription] = useState("");
  const [directTag, setDirectTag] = useState<"Clean" | "Slightly Polluted" | "Moderately Polluted" | "Highly Polluted" | "Extremely Polluted">("Moderately Polluted");
  const [directPhotoUrl, setDirectPhotoUrl] = useState(OBS_PRESETS[0].url);
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState("");

  // Score override state variables
  const [overrideEnvScore, setOverrideEnvScore] = useState<string>(catalog.envScore !== null ? String(catalog.envScore) : "");
  const [overrideDirtinessScore, setOverrideDirtinessScore] = useState<string>(catalog.dirtinessScore !== "Insufficient Data" ? String(catalog.dirtinessScore) : "Insufficient Data");
  const [overrideStatus, setOverrideStatus] = useState<string>(catalog.status || "UNVERIFIED ALERT");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState("");
  const [overrideSuccess, setOverrideSuccess] = useState("");

  // Campaign create state variables
  const [showAttachCampaign, setShowAttachCampaign] = useState(false);
  const [campOrgName, setCampOrgName] = useState("Douala Green Cleaners");
  const [campTitle, setCampTitle] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [campStart, setCampStart] = useState(new Date().toISOString().split("T")[0]);
  const [campSubmitting, setCampSubmitting] = useState(false);

  // Override / Reset score handler
  const handleDirectOverrideSubmit = async (e: React.FormEvent, resetAll = false) => {
    if (e) e.preventDefault();
    setOverrideSubmitting(true);
    setOverrideError("");
    setOverrideSuccess("");

    try {
      const response = await fetch(`/api/catalogs/${catalog.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envScore: overrideEnvScore === "" ? null : overrideEnvScore,
          dirtinessScore: overrideDirtinessScore,
          status: overrideStatus,
          resetAll
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOverrideSuccess(resetAll ? "Catalog score and related logs reset successfully!" : "Catalog score overrides applied successfully!");
        if (resetAll) {
          setOverrideEnvScore("");
          setOverrideDirtinessScore("Insufficient Data");
          setOverrideStatus("UNVERIFIED ALERT");
        } else {
          setOverrideEnvScore(data.catalog.envScore !== null ? String(data.catalog.envScore) : "");
          setOverrideDirtinessScore(data.catalog.dirtinessScore !== "Insufficient Data" ? String(data.catalog.dirtinessScore) : "Insufficient Data");
          setOverrideStatus(data.catalog.status || "UNVERIFIED ALERT");
        }
        if (onUpdateCatalog) {
          onUpdateCatalog(data.catalog);
        }
      } else {
        setOverrideError(data.error || "Failed overriding catalog settings.");
      }
    } catch (err) {
      console.error(err);
      setOverrideError("Network failure communicating with override API.");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Attach New Campaign handler inside modal
  const handleAttachCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim() || !campDesc.trim() || !campOrgName.trim()) {
      alert("Please provide required campaign details.");
      return;
    }
    setCampSubmitting(true);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: campOrgName,
          title: campTitle,
          catalogId: catalog.id,
          description: campDesc,
          startDate: campStart
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCampTitle("");
        setCampDesc("");
        setShowAttachCampaign(false);
        alert(`restoration cleanup campaign "${campTitle}" attached and registered live under this locale!`);
        if (onUpdateCatalog && data.catalog) {
          onUpdateCatalog(data.catalog);
        }
      } else {
        alert(data.error || "Failed registering cleanup campaign.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred attaching campaign.");
    } finally {
      setCampSubmitting(false);
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directDescription.trim()) {
      setDirectError("Observation notes are required.");
      return;
    }
    setDirectSubmitting(true);
    setDirectError("");

    const userStatsRaw = localStorage.getItem("greenlens_userstats");
    const activeStats = userStatsRaw ? JSON.parse(userStatsRaw) : null;

    try {
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: catalog.id,
          region: catalog.region,
          city: catalog.city,
          townOrArrondissement: catalog.townOrArrondissement,
          neighborhood: catalog.neighborhood,
          description: directDescription,
          photoUrl: directPhotoUrl,
          photoUrls: [directPhotoUrl],
          reporterName: activeStats?.fullName || "Eco Scout",
          reporterEmail: activeStats?.email || "user@example.com",
          pollutionTag: directTag
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDirectDescription("");
        setShowDirectForm(false);
        alert("Verification evidence successfully logged! Check out the recalculations on your active dashboard!");
        if (onAddObservation) {
          onAddObservation(data.observation, data.catalog, data.userStats);
        }
      } else {
        setDirectError(data.error || "Failed registering evidence.");
      }
    } catch (err) {
      console.error(err);
      setDirectError("Network communication failure with the backend services.");
    } finally {
      setDirectSubmitting(false);
    }
  };

  // Status colors helpers
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-50 text-red-700 border-red-200";
      case "High": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Medium": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center p-4 overflow-y-auto" id="catalog-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-auto shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]" id="modal-container-inner">
        
        {/* Modal Header */}
        <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between" id="modal-header">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h3 className="text-base font-black text-gray-950 leading-none">
                   {catalog.neighborhood} Environmental Catalog
                 </h3>
                 <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${catalog.status === "VERIFIED CATALOG" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                   {catalog.status}
                 </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider font-semibold uppercase mt-1">
                {catalog.city}, {catalog.region} Region • ID: {catalog.id} • Updated: {catalog.lastUpdated || "N/A"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            id="close-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8" id="modal-body">
          
          {/* Section 1: At-a-Glance Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="modal-metrics-grid">
            
            {/* Environmental Score Progress Dial OR Validation Progress */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3.5 items-center">
              {catalog.status === "UNVERIFIED ALERT" || catalog.envScore === null ? (
                <>
                  <div className="flex-1 w-full flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 font-mono flex items-center gap-1">
                        <Info className="h-3 w-3 shrink-0" /> Verification Progress
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 font-bold">{catalog.verificationProgress || 0}%</span>
                    </div>
                    {/* Progress Bar with Staggered Indicators */}
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden relative flex">
                       <div 
                         className="h-full bg-emerald-400 opacity-60 absolute left-0 top-0 transition-all duration-1000" 
                         style={{ width: `${Math.min(100, Math.round(((catalog.countedObservations || 0) / 5) * 100))}%` }} 
                       />
                       <div 
                         className="h-full bg-amber-500 z-10 relative transition-all duration-1000" 
                         style={{ width: `${catalog.verificationProgress || 0}%` }} 
                       />
                    </div>
                    
                    {/* Core Verification details */}
                    <div className="flex justify-between items-start mt-2 border-t border-amber-100/50 pt-2 flex-wrap gap-y-2">
                      <div className="space-y-0.5 animate-fadeIn">
                        <p className="text-[8px] text-gray-400 font-black uppercase font-mono tracking-wider leading-none">
                          Observations
                        </p>
                        <p className="text-[10px] text-amber-900 font-bold leading-tight">
                          {catalog.countedObservations || 0} counted / 5 max
                        </p>
                        {catalog.additionalObservations ? (
                          <p className="text-[8px] text-amber-700/85 font-bold italic leading-tight block">
                            +{catalog.additionalObservations} more stored
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-0.5 text-right">
                        <p className="text-[8px] text-gray-400 font-black uppercase font-mono tracking-wider leading-none">
                          Contributors
                        </p>
                        <p className="text-[10px] text-amber-900 font-bold leading-tight">
                          {catalog.contributorCount || 0} / 3 required
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full border-4 border-dotted border-emerald-500 bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center font-mono shrink-0">
                    <span className="text-base font-black">{catalog.envScore}</span>
                    <span className="text-[8px] font-bold text-emerald-600 leading-none">SCORE</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-gray-900 block leading-tight">Catalogs Index</span>
                    <p className="text-[9px] text-gray-400">Sanitary baseline rating.</p>
                  </div>
                </>
              )}
            </div>

            {/* Environmental Dirtiness Score (Deterministic scoring 0-100) */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3.5 items-center">
              <div className={`h-11 w-11 rounded-full border-2 border-dashed font-mono shrink-0 flex flex-col items-center justify-center
                ${catalog.dirtinessScore === "Insufficient Data" 
                  ? "border-gray-300 bg-gray-100 text-gray-500" 
                  : (catalog.dirtinessScore as number) < 25 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : (catalog.dirtinessScore as number) < 60
                  ? "border-amber-500 bg-amber-50 text-amber-800"
                  : "border-red-500 bg-red-50 text-red-800"}`}
              >
                <span className="text-xs font-black leading-none">
                  {catalog.dirtinessScore === "Insufficient Data" ? "N/A" : catalog.dirtinessScore}
                </span>
                <span className="text-[6px] font-extrabold block uppercase tracking-tighter leading-none mt-0.5">DIRTY</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-black text-gray-900 block leading-tight">Dirtiness Score</span>
                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-xs font-mono uppercase tracking-wide
                  ${catalog.dirtinessTrend === "Improving" 
                    ? "bg-emerald-100 text-emerald-800"
                    : catalog.dirtinessTrend === "Getting Worse"
                    ? "bg-red-1050 text-red-800 bg-red-100"
                    : catalog.dirtinessTrend === "Stable"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"}`}
                >
                  {catalog.dirtinessTrend === "Insufficient Data" ? "No Trend" : catalog.dirtinessTrend}
                </span>
              </div>
            </div>

            {/* Campaign Counts */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3.5 items-center font-sans">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black text-gray-900 block leading-tight">
                  {catalog.activeCampaignsCount}
                </span>
                <p className="text-[9px] text-gray-400">Active Campaign counts.</p>
              </div>
            </div>

            {/* Total Reports */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3.5 items-center">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                <History className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black text-gray-900 block leading-tight">
                  {catalog.observations?.length || 0}
                </span>
                <p className="text-[9px] text-gray-400">Reports registered.</p>
              </div>
            </div>

          </div>

          {/* Ranger Hub / Score Controller Sandbox */}
          <div className="bg-[#f0f9ff]/75 border border-[#bae6fd]/85 rounded-xl p-5 space-y-4 shadow-3xs" id="ranger-sandbox-override-panel">
            <div className="flex items-center justify-between border-b border-[#bae6fd] pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-blue-650 text-blue-600" />
                <h4 className="text-sm font-bold text-blue-950 font-sans">Verification Sandbox & Score Override Dashboard</h4>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-md font-mono tracking-wider uppercase">
                Staff Control
              </span>
            </div>

            {overrideError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-750 text-[11px] rounded-lg font-mono">
                {overrideError}
              </div>
            )}
            {overrideSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11.5px] font-semibold rounded-lg font-mono animate-fadeIn">
                {overrideSuccess}
              </div>
            )}

            <form onSubmit={(e) => handleDirectOverrideSubmit(e, false)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                  Manually Set Environmental Score (0-100)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideEnvScore}
                    onChange={(e) => setOverrideEnvScore(e.target.value)}
                    placeholder="e.g. 75"
                    className="flex-1 bg-white border border-gray-250/70 rounded-lg h-9 px-3 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setOverrideEnvScore("")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 h-9 px-2 rounded-lg text-[10px] font-bold uppercase font-mono"
                    title="Mark as unrated / null"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                  Settle Dirtiness Rating Index
                </label>
                <select
                  value={overrideDirtinessScore}
                  onChange={(e) => setOverrideDirtinessScore(e.target.value)}
                  className="w-full bg-white border border-gray-250/70 rounded-lg h-9 px-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Insufficient Data">Insufficient Data (N/A)</option>
                  <option value="15">15 - Pristine Clean</option>
                  <option value="35">35 - Slightly Polluted</option>
                  <option value="55">55 - Moderately Dirty</option>
                  <option value="75">75 - Highly Polluted</option>
                  <option value="95">95 - Critical Accumulation Block</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                  Catalog Status Flag
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full bg-white border border-gray-250/70 rounded-lg h-9 px-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="UNVERIFIED ALERT">UNVERIFIED ALERT (Community observations needed)</option>
                  <option value="VERIFIED CATALOG">VERIFIED CATALOG (Activated official tracking)</option>
                </select>
              </div>

              <div className="md:col-span-3 flex flex-wrap gap-2.5 justify-between pt-2 border-t border-dashed border-[#bae6fd]/50">
                <button
                  type="button"
                  onClick={(e) => {
                    if (window.confirm("Are you sure you want to reset this Catalog Node's scores and delete all attached observations, campaigns, and historical trends back to a pristine default state? This action is permanent.")) {
                      handleDirectOverrideSubmit(e as any, true);
                    }
                  }}
                  disabled={overrideSubmitting}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-3.5 py-1.5 text-xs font-bold font-sans flex items-center gap-1.5 transition-all shadow-3xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Ecosystem Score & Clear Logs
                </button>

                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-1.5 text-xs font-bold font-sans flex items-center gap-1.5 transition-all shadow-3xs"
                >
                  {overrideSubmitting ? <Loader className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Save Score Configuration Overrides
                </button>
              </div>
            </form>
          </div>

          {/* WhatsApp invitation section for unverified alerts */}
          {(catalog.status === "UNVERIFIED ALERT" || (catalog.countedObservations || 0) < 5 || (catalog.contributorCount || 0) < 3) && (
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4 animate-fadeIn" id="whatsapp-invite-box-modal">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 fill-current text-[#25D366]" viewBox="0 0 24 24">
                    <title>WhatsApp</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-extrabold text-emerald-950 font-sans tracking-tight">Invite Contributors</h4>
                  <p className="text-[11px] text-gray-700 leading-relaxed font-semibold">
                    An environmental issue has been reported in <span className="text-emerald-800">{catalog.neighborhood || catalog.townOrArrondissement}, {catalog.city}</span>.
                  </p>
                  <p className="text-[11.5px] text-gray-600 leading-relaxed">
                    A single user cannot verify an area alone. Introduce community members to GreenLens to upload verification evidence and activate official tracking!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 p-3.5 rounded-lg border border-emerald-100/45">
                <div className="text-[11px]">
                  <span className="text-gray-400 block font-bold uppercase font-mono tracking-wider text-[8px]">Referral Bonus</span>
                  <span className="text-emerald-850 font-bold font-sans">Build verification network to earn Environmental Impact Points!</span>
                </div>
                
                <button
                  onClick={() => {
                    const userStatsRaw = localStorage.getItem("greenlens_userstats");
                    const userStats = userStatsRaw ? JSON.parse(userStatsRaw) : null;
                    const areaName = `${catalog.neighborhood ? catalog.neighborhood + ', ' : ''}${catalog.city || catalog.region || 'Cameroon Local Area'}`;
                    const obsCount = catalog.countedObservations || catalog.observationCount || 1;
                    const contCount = catalog.contributorCount || 1;
                    const refLink = `${window.location.origin}/?ref=${encodeURIComponent(userStats?.email || "anonymous")}&alertId=${encodeURIComponent(catalog.id)}`;
                    
                    const message = `🚨 Environmental Alert Needs Verification\n\nAn environmental issue has been reported in:\n${areaName}\n\nCurrent Progress:\n${obsCount}/5 Observations\n${contCount}/3 Contributors\n\nGreenLens needs additional community evidence before this area can become an official Environmental Catalog.\n\nAdd your observation here:\n${refLink}\n\nHelp improve environmental intelligence in our community.`;
                    
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, "_blank");
                  }}
                  className="bg-[#25D366] hover:bg-[#20ba56] text-white py-2 px-4 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-xs transition-all tracking-tight shrink-0"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <title>WhatsApp Icon</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.459H12a11.8 11.8 0 008.413-3.481 11.8 11.8 0 003.481-8.412c-.003-3.223-1.258-6.254-3.535-8.532z"/>
                  </svg>
                  Share on WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Direct verification observation data input form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-3xs" id="direct-modal-observation-form">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-gray-900 font-sans">Verify & Add Direct Evidence</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectForm(!showDirectForm)}
                className="text-[10px] uppercase font-bold text-primary font-mono hover:underline tracking-wider bg-emerald-50 px-2.5 py-1 rounded"
              >
                {showDirectForm ? "Collapse Form" : "Open Verification Form"}
              </button>
            </div>

            {showDirectForm && (
              <form onSubmit={handleDirectSubmit} className="space-y-4 animate-fadeIn">
                {directError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-750 text-[11px] rounded-lg font-mono">
                    {directError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono mb-1.5">
                    Pollution Level (Threat Scale)
                  </label>
                  <select
                    value={directTag}
                    onChange={(e) => setDirectTag(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-lg h-9 px-2 text-xs font-semibold text-gray-850 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Clean">Clean (0 - pristine state)</option>
                    <option value="Slightly Polluted">Slightly Polluted (25 - scattered garbage bags)</option>
                    <option value="Moderately Polluted">Moderately Polluted (50 - standard refuse piles & drainage issues)</option>
                    <option value="Highly Polluted">Highly Polluted (75 - major structural waste accumulation)</option>
                    <option value="Extremely Polluted">Extremely Polluted (100 - critical environmental block hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono mb-1.5">
                    Detailed Observation Notes
                  </label>
                  <textarea
                    rows={3}
                    value={directDescription}
                    onChange={(e) => setDirectDescription(e.target.value)}
                    placeholder="Provide description of observed site conditions, plastic waste accumulation, or water flow blockages..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs font-medium text-gray-850 outline-none focus:border-primary font-sans resize-none placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono mb-1.5 font-bold">
                    Select Environmental Evidence Image
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {OBS_PRESETS.map((preset) => (
                      <div
                        key={preset.title}
                        type="button"
                        onClick={() => {
                          setDirectPhotoUrl(preset.url);
                          if (!directDescription.trim()) {
                            setDirectDescription(preset.description);
                          }
                        }}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          directPhotoUrl === preset.url ? "border-primary ring-2 ring-primary/20 scale-95" : "border-gray-150 hover:border-gray-300"
                        }`}
                        title={preset.title}
                      >
                        <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center">
                          <span className="text-[7px] text-white font-mono font-bold leading-none block truncate px-1">
                            {preset.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">OR Paste Custom URL:</span>
                  <input
                    type="url"
                    value={directPhotoUrl}
                    onChange={(e) => setDirectPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-white border border-gray-200 rounded-md py-1 px-2 text-[11px] outline-none focus:border-primary text-gray-700 font-mono"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={directSubmitting}
                    className="bg-primary hover:bg-primary-light text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-3xs flex items-center gap-1.5"
                  >
                    {directSubmitting && <Loader className="h-3 w-3 animate-spin text-white" />}
                    {directSubmitting ? "Uploading Evidence..." : "Add Evidence to Catalog"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Recharts Historical trends line */}
          <div className="space-y-3" id="catalog-history-section">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
              Historical Trend Performance
            </span>
            <div className="h-44 w-full bg-gray-50 rounded-xl border border-gray-150 p-4" id="modal-chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={catalog.trends}>
                  <XAxis dataKey="date" stroke="#717a6d" fontSize={10} tickLine={false} />
                  <YAxis domain={[20, 100]} stroke="#717a6d" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#00450d" strokeWidth={2.5} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 3: Cleaning Campaign lifecycle track */}
          <div className="space-y-4" id="catalog-campaigns-section">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
                Remediation Campaigns ({catalog.campaigns?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => setShowAttachCampaign(!showAttachCampaign)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-250/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                {showAttachCampaign ? "Cancel New Campaign" : "Attach New Cleanup Campaign"}
              </button>
            </div>

            {showAttachCampaign && (
              <form onSubmit={handleAttachCampaignSubmit} className="p-4 bg-blue-50/40 border border-blue-200/60 rounded-xl space-y-3 animate-fadeIn" id="inline-campaign-form">
                <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider font-mono block">
                  New Cleanup Campaign Details
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-gray-500 font-mono">
                      Executing Organization (NGO/Sponsor)
                    </label>
                    <select
                      value={campOrgName}
                      onChange={(e) => setCampOrgName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg h-9 px-2 text-xs font-semibold text-gray-850"
                    >
                      <option value="Douala Green Cleaners">Douala Green Cleaners</option>
                      <option value="ECO-Guardians Cameroon">ECO-Guardians Cameroon</option>
                      <option value="Association Rangers de Sanaga">Association Rangers de Sanaga</option>
                      <option value="Yaoundé Resilient Hands">Yaoundé Resilient Hands</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-gray-500 font-mono">
                      Restoration Start Date
                    </label>
                    <input
                      type="date"
                      value={campStart}
                      onChange={(e) => setCampStart(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg h-9 px-3 text-xs font-semibold text-gray-850"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-gray-500 font-mono">
                    Restoration Campaign Title
                  </label>
                  <input
                    type="text"
                    value={campTitle}
                    onChange={(e) => setCampTitle(e.target.value)}
                    placeholder="e.g. Purge blockages in Mayour water gutters"
                    className="w-full bg-white border border-gray-200 rounded-lg h-9 px-3 text-xs font-semibold text-gray-850"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-gray-500 font-mono">
                    Intervention Plan Description
                  </label>
                  <textarea
                    rows={2}
                    value={campDesc}
                    onChange={(e) => setCampDesc(e.target.value)}
                    placeholder="Describe specific volunteer tasks, targeted volume of collected plastic waste bags, equipment needed..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-medium text-gray-850 resize-none font-sans"
                    required
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={campSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
                  >
                    {campSubmitting ? "Attaching..." : "Register & Activate Campaign"}
                  </button>
                </div>
              </form>
            )}

            {(!catalog.campaigns || catalog.campaigns.length === 0) ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                No cleanup campaigns currently attached to this catalog node.
              </div>
            ) : (
              <div className="space-y-4" id="modal-campaigns-list">
                {catalog.campaigns.map((camp) => (
                  <div key={camp.id} className="p-4 bg-gray-50 rounded-xl border border-gray-250/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          camp.status === "Completed" ? "bg-primary text-white" : "bg-amber-600 text-white"
                        }`}>
                          {camp.status}
                        </span>
                        <span className="text-xs font-bold text-gray-700 font-mono">{camp.organizationName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{camp.title}</h4>
                      <p className="text-xs text-gray-500 leading-tight">{camp.description}</p>
                    </div>

                    <div className="shrink-0 space-y-2">
                      {camp.status === "Active" ? (
                        activeCompletingId === camp.id ? (
                          /* complete campaign form input widget */
                          <div className="space-y-2 max-w-[200px]" id="active-completion-submit">
                            <input
                              type="url"
                              value={typedAfterUrl}
                              onChange={(e) => setTypedAfterUrl(e.target.value)}
                              placeholder="Paste clean image URL..."
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-[11px] focus:outline-0 focus:border-primary text-gray-800 font-sans"
                            />
                            
                            {/* Clickable Quick Sourced After Presets */}
                            <div className="space-y-1" id="after-presets-picker">
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Tap Clean Preset:</span>
                              <div className="grid grid-cols-4 gap-1">
                                {CAMPAIGN_AFTER_PRESETS.map((preset) => (
                                  <div
                                    key={preset.title}
                                    onClick={() => setTypedAfterUrl(preset.url)}
                                    className={`relative h-6 rounded overflow-hidden border cursor-pointer transition-all ${
                                      typedAfterUrl === preset.url ? "border-primary ring-1 ring-primary" : "border-gray-200 hover:border-accent"
                                    }`}
                                    title={preset.title}
                                  >
                                    <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setActiveCompletingId(null)}
                                className="text-[10px] text-gray-400 font-bold px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleCompleteActionSubmit(camp.id)}
                                disabled={submittingCompletion || !typedAfterUrl.trim()}
                                className="bg-primary hover:bg-primary-light text-white font-bold text-[10px] px-2.5 py-1 rounded"
                              >
                                {submittingCompletion ? "Saving..." : "Submit"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveCompletingId(camp.id);
                              // pre seed template completed after photos for easy testing
                              setTypedAfterUrl("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80");
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-4 py-2 rounded-lg leading-none transition-all cursor-pointer"
                          >
                            Mark as Cleaned
                          </button>
                        )
                      ) : (
                        <div className="text-right" id="completed-campaign-score">
                          <span className="text-[9px] font-bold uppercase text-gray-400 leading-none block">Verified Quality</span>
                          <span className="text-base font-black text-primary font-mono">{camp.verifiedImprovementScore}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Users reported observations feed with AI tags */}
          <div className="space-y-4 shadow-3xs" id="catalog-observations-section">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
              Anomalies Evidence & AI Classifications ({catalog.observations?.length || 0})
            </span>

            {(!catalog.observations || catalog.observations.length === 0) ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                No environmental anomalies logged for this locale. Be the first to catalog issues under the Contribute screen!
              </div>
            ) : (
              <div className="space-y-6" id="modal-obs-list">
                {catalog.observations.map((obs) => (
                  <div key={obs.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row shadow-2xs">
                    
                    {/* Obs Side Photo */}
                    <div className="md:w-1/3 aspect-[4/3] md:aspect-auto bg-gray-100 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {obs.photoUrls && obs.photoUrls.length > 0 ? (
                        obs.photoUrls.map((url, i) => (
                          <div key={i} className="flex-none w-full h-full relative snap-center">
                            <img src={url} alt={`Observation visual evidence ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {obs.photoUrls!.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-10 font-mono">
                                {i + 1} / {obs.photoUrls!.length}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="w-full h-full relative">
                          <img src={obs.photoUrl} alt="Observation visual evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    {/* Obs Metadata and classifications */}
                    <div className="p-5 md:w-2/3 space-y-4" id="obs-detail-body">
                      <div>
                        <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                          <span className="text-[9px] font-mono tracking-tight text-gray-400 font-bold uppercase leading-none flex items-center flex-wrap gap-1.5">
                            Reported by: {obs.reporterName} • {new Date(obs.timestamp).toLocaleDateString()}
                            {catalog.status === "UNVERIFIED ALERT" && (
                              obs.isCountedForActivation !== false ? (
                                <span className="inline-block bg-emerald-50 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded-sm border border-emerald-200 uppercase tracking-tight font-sans">
                                  ✓ Counted for Verification
                                </span>
                              ) : (
                                <span className="inline-block bg-amber-50 text-amber-850 text-[8px] font-black px-1.5 py-0.5 rounded-sm border border-amber-200 uppercase tracking-tight font-sans" title="Recorded and stored as supportive evidence but exceeds contributor maximum activation weight.">
                                  ℹ Stored Evidence (Limit Met)
                                </span>
                              )
                            )}
                          </span>
                          {obs.facebookPostUrl && (
                            <a 
                              href={obs.facebookPostUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded transition-all duration-200"
                              id={`fb-link-${obs.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook className="h-3.5 w-3.5 shrink-0" />
                              <span>View Bonaberi Proof</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed italic pr-2 mt-1">
                          "{obs.description}"
                        </p>
                      </div>

                      {/* AI Classified results banner */}
                      <div className={`p-4 rounded-xl border space-y-2.5 ${getSeverityStyles(obs.aiClassification.severity)}`} id="ai-banner">
                        <div className="flex items-center justify-between border-b border-gray-150 pb-1.5" id="ai-banner-header">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="text-[11px] font-extrabold uppercase font-mono tracking-wider">
                              Gemini AI Core Classification
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold uppercase bg-white/70 px-2 py-0.5 rounded">
                            {obs.aiClassification.severity} Severity
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium" id="ai-scores-grid">
                          <div>
                            <span className="text-gray-500 block leading-tight">Pollution Type:</span>
                            <span className="text-gray-850 font-bold leading-tight block">{obs.aiClassification.pollutionType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block leading-tight">Proximity to Waterway:</span>
                            <span className="text-gray-850 font-bold leading-tight block">{obs.aiClassification.waterwayProximity}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px]" id="ai-remedy-block">
                          <span className="text-gray-500 block leading-none font-bold">Suggested Remediation:</span>
                          <p className="text-gray-850 leading-tight italic">"{obs.aiClassification.suggestedAction}"</p>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between" id="modal-footer">
          <span className="text-[11px] text-gray-400 font-medium">
            Data aggregated from Cameroon Civil Observatories.
          </span>
          <button 
            onClick={onClose}
            className="bg-primary hover:bg-primary-light text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}
