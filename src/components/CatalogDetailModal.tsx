/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EnvironmentalCatalog, Campaign } from "../types";
import { X, MapPin, Users, History, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, BarChart3, TrendingUp, Calendar, Info, Award, Loader, Facebook, ExternalLink } from "lucide-react";
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
}

export default function CatalogDetailModal({ catalog, onClose, onCompleteCampaign }: CatalogDetailModalProps) {
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
              <h3 className="text-base font-black text-gray-950 leading-none">
                {catalog.neighborhood} Environmental Catalog
              </h3>
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
              {catalog.status === "Data Collection Mode" || catalog.envScore === null ? (
                <>
                  <div className="flex-1 w-full flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-black text-gray-900 leading-tight">Validation</span>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">{catalog.observationCount} / {catalog.minimumRequiredObservations || 5}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: `${Math.round(((catalog.observationCount || 0) / (catalog.minimumRequiredObservations || 5)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[8.5px] text-gray-400 mt-1 leading-tight tracking-tight uppercase">Data Collection Mode</p>
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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
              Remediation Campaigns ({catalog.campaigns?.length || 0})
            </span>

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
                          <span className="text-[9px] font-mono tracking-tight text-gray-400 font-bold block uppercase leading-none">
                            Reported by: {obs.reporterName} • {new Date(obs.timestamp).toLocaleDateString()}
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
