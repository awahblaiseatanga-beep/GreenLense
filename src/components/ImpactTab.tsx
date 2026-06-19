/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ListCollapse, Plus, Sparkles, Building2, Eye, ShieldCheck, Mail, Phone, Calendar, ArrowRight, CheckCircle2, Award, ArrowUpRight, Loader, Search } from "lucide-react";
import { EnvironmentalCatalog, Campaign, Organization } from "../types";
import doualaBeforeImg from "../assets/images/douala_before_1781775092948.jpg";
import doualaAfterImg from "../assets/images/douala_after_1781775108257.jpg";

const CAMPAIGN_PRESET_IMAGES = [
  {
    title: "Gutter Clear",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    description: "Clearing stagnant plastic garbage and silt blocks from main municipal storm waterways."
  },
  {
    title: "Eco Bin Set",
    url: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=600&q=80",
    description: "Placing color-coded separation containers and trash points across central marketplace sectors."
  },
  {
    title: "Tree Sprout",
    url: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80",
    description: "Re-rooting vulnerable erosion slopes with native binding seedlings and fresh greenery."
  },
  {
    title: "River Sweep",
    url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
    description: "Mobilizing youth cleaning squads to drag plastics and organic debris piles from stream beds."
  }
];

interface ImpactTabProps {
  catalogs: EnvironmentalCatalog[];
  organizations: Organization[];
  onAuditSubmitted: (campaignId: string, alignmentLevel: string) => void;
  onOrganizationRegistered: (newOrg: Organization) => void;
  onCampaignAdded: (newCampaign: any) => void;
  currentUserStats: any;
}

export default function ImpactTab({ 
  catalogs, 
  organizations, 
  onAuditSubmitted, 
  onOrganizationRegistered,
  onCampaignAdded,
  currentUserStats 
}: ImpactTabProps) {
  
  const [activeFormTab, setActiveFormTab] = useState<"audit" | "campaign" | "org">("audit");
  
  // Setup verification/audit state
  const [verificationVotedIds, setVerificationVotedIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  
  // Custom Campaign Wizard states
  const [orgOptionsName, setOrgOptionsName] = useState("Association Eco-Cameroon");
  const [campTitle, setCampTitle] = useState("");
  const [campCatalogId, setCampCatalogId] = useState("LOC_MLN_YAO_CEN_CMR");
  const [campDescription, setCampDescription] = useState("");
  const [campStart, setCampStart] = useState("");
  const [campEnd, setCampEnd] = useState("");
  const [campBeforeImg, setCampBeforeImg] = useState("https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80");
  const [isCampaignCreating, setIsCampaignCreating] = useState(false);

  // Custom Organization registration states
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<"NGO" | "School" | "Community Group" | "Company">("NGO");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgCatalog, setOrgCatalog] = useState("LOC_MLN_YAO_CEN_CMR");
  const [orgDesc, setOrgDesc] = useState("");
  const [isOrgCreating, setIsOrgCreating] = useState(false);

  // Enforce a single high-quality static sample campaign signifying the app's real purpose: Cameroon environmental restoration
  const sampleCompletedCampaign: Campaign = {
    id: "sample-restoration-douala",
    title: "Douala Market Sanitation District & Drainage Channel Revitalization",
    organizationName: "Douala Green Action Coalition",
    catalogId: "LOC_BON_DOU_LIT_CMR",
    description: "We successfully mobilized Douala IV youth squads to clear severe plastic bottlenecks alongside the commercial avenue. Over 1,200kg of polyethylene bottles and clogged debris were cleared and loaded onto the central municipal collection vehicle. Natural drainage has been restored to mitigate flood water backups.",
    startDate: "2026-06-12",
    endDate: "2026-06-15",
    status: "Completed",
    beforeImage: doualaBeforeImg,
    afterImage: doualaAfterImg,
    verifications: [],
    verifiedImprovementScore: 92,
    verificationsCount: 0
  };

  const allCompletedCampaigns: Campaign[] = [sampleCompletedCampaign];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = allCompletedCampaigns.filter(camp => 
    camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camp.catalogId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Voting community verification
  const handleCastingVote = async (campaignId: string, level: "Significant" | "Moderate" | "Little" | "No") => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUserStats?.email || "awahblaiseatanga@gmail.com",
          improvementLevel: level
        })
      });

      if (response.ok) {
        setVerificationVotedIds([...verificationVotedIds, campaignId]);
        onAuditSubmitted(campaignId, level);
        setSuccessMsg("Verification point registered! Your XP level has been incremented.");
        setTimeout(() => setSuccessMsg(""), 4200);
      } else {
        alert("Failed casting verification voice, check catalog settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Communication failure with Express full-stack socket.");
    }
  };

  // Register New Campaign
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle || !campDescription || !campStart || !orgOptionsName) {
      alert("Required campaign details are missing.");
      return;
    }
    setIsCampaignCreating(true);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgOptionsName,
          title: campTitle,
          catalogId: campCatalogId,
          description: campDescription,
          startDate: campStart,
          endDate: campEnd,
          beforeImage: campBeforeImg
        })
      });

      const data = await response.json();
      if (response.ok) {
        onCampaignAdded(data.campaign);
        alert("Restoration campaign registered! It is now tracking live in the catalog details.");
        
        // Reset fields
        setCampTitle("");
        setCampDescription("");
        setCampStart("");
        setCampEnd("");
      } else {
        alert(data.error || "Failed registering restoration movement.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCampaignCreating(false);
    }
  };

  // Register New Organization
  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgEmail) {
      alert("Organization Name and Contact Email are required.");
      return;
    }
    setIsOrgCreating(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          type: orgType,
          email: orgEmail,
          phone: orgPhone,
          areaCatalogId: orgCatalog,
          description: orgDesc
        })
      });

      const data = await response.json();
      if (response.ok) {
        onOrganizationRegistered(data);
        alert(`Organization "${data.name}" successfully integrated! You can now link restoration drives to this team.`);
        
        // Reset fields
        setOrgName("");
        setOrgEmail("");
        setOrgPhone("");
        setOrgDesc("");
      } else {
        alert(data.error || "Registry failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOrgCreating(false);
    }
  };

  return (
    <div className="space-y-8" id="impact-tab-view">
      {/* Title Intro */}
      <div className="text-center space-y-2 pt-4" id="impact-intro">
        <h2 className="text-2xl font-black text-primary tracking-tight md:text-3xl">Action, Cleaning & Verification</h2>
        <p className="text-gray-500 text-xs md:text-sm">
          Register green restore coalitions, deploy cleanup movements, and verify evidence to update community data.
        </p>
      </div>

      {/* Trust Layer feedback warning notification banner */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs font-bold font-mono text-center flex items-center justify-center gap-2 animate-pulse shadow-xs" id="success-notification">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Grid: 8 cols Campaigns & Auditing, 4 cols forms tabs sidebar widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="impact-interactive-grid">
        
        {/* Left Side: Verification Trust cards & completed reviews list (8 cols) */}
        <div className="lg:col-span-8 space-y-6" id="audits-completed-list">
          
          <div className="flex items-center gap-2" id="v-title-header">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <h3 className="text-lg font-black text-gray-950">Community Verification Auditing</h3>
          </div>

          {/* Moved Search Bar Field as requested to align perfectly with the feed */}
          <div className="relative flex items-center p-1 bg-white rounded-xl border border-gray-200 shadow-xs" id="campaign-search-form">
            <div className="relative flex-1 flex items-center pl-3">
              <Search className="h-4.5 w-4.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search completed feeds or organizations (e.g., Melen, Eco-Cameroon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-2 pr-2 py-2 text-xs md:text-sm bg-transparent border-0 focus:outline-0 focus:ring-0 text-gray-800"
                id="campaign-search-input"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-450 hover:text-gray-700 px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 animate-fade-in" id="no-campaigns-voting-card">
              <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-mono">
                {searchQuery ? "No matching sample feeds found" : "No completed campaigns currently seeking community verification votes."}
              </p>
            </div>
          ) : (
            <div className="space-y-8" id="verification-cards-feed">
              {filteredCampaigns.map((camp) => {
                const alreadyVoted = verificationVotedIds.includes(camp.id);
                return (
                  <div 
                    key={camp.id} 
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                    id={`verify-card-${camp.id}`}
                  >
                    {/* Header bar of campaign */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" id="verify-header-inner">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block">
                          Restoration Cleanup Campaign Action Completed
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                          {camp.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Led by: <span className="font-semibold text-gray-700">{camp.organizationName}</span> • Area Catalog: <span className="font-mono text-gray-500 font-semibold">{camp.catalogId}</span>
                        </span>
                      </div>
                      <div className="bg-white px-2.5 py-1 rounded border border-gray-100 text-center shrink-0" id="campaign-dates">
                        <span className="text-[9px] font-mono text-gray-400 font-bold block uppercase">End Date</span>
                        <span className="text-xs font-bold text-gray-800">{camp.endDate || "Jun 13"}</span>
                      </div>
                    </div>

                    {/* Compare Section (Side by side grid) */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4" id="evidence-compare-grid">
                      {/* Before Frame */}
                      <div className="space-y-2" id="evidence-before">
                        <span className="text-[10px] uppercase tracking-widest text-red-600 font-mono font-bold block">
                          Before Intervention Image:
                        </span>
                        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-150 relative">
                          <img src={camp.beforeImage} alt="Before intervention" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>

                      {/* After Frame */}
                      <div className="space-y-2" id="evidence-after">
                        <span className="text-[10px] uppercase tracking-widest text-[#00450d] font-mono font-bold block">
                          After Restoration Image:
                        </span>
                        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-150 relative">
                          <img src={camp.afterImage || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"} alt="After intervention" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>

                    {/* Vote Controller panel */}
                    <div className="bg-gray-50/50 p-5 border-t border-gray-100 space-y-4" id="voting-panel">
                      <div className="space-y-1" id="voter-prompt">
                        <span className="text-xs font-black text-gray-800 block">
                          Did this intervention actually improve the local environment conditions?
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Your vote acts as a metric catalysts weight ensuring transparency and calculating the Organization Impact Index.
                        </p>
                      </div>

                      {alreadyVoted ? (
                        <div className="bg-[#acf4a4]/20 text-[#0c5216] p-3 rounded-lg border border-[#c0c9bb] text-xs font-bold flex items-center justify-center gap-2" id="already-voted-panel">
                          <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                          <span>Audit verified! Thank you for establishing community trust.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="voting-choices">
                          <button
                            onClick={() => handleCastingVote(camp.id, "Significant")}
                            className="bg-white hover:bg-emerald-50 text-gray-700 hover:text-primary hover:border-primary px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 transition-all text-center leading-tight shadow-3xs"
                            id={`vote-${camp.id}-significant`}
                          >
                            Significant Improvement
                          </button>
                          <button
                            onClick={() => handleCastingVote(camp.id, "Moderate")}
                            className="bg-white hover:bg-emerald-50 text-gray-700 hover:text-primary hover:border-primary px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 transition-all text-center leading-tight shadow-3xs"
                            id={`vote-${camp.id}-moderate`}
                          >
                            Moderate Improvement
                          </button>
                          <button
                            onClick={() => handleCastingVote(camp.id, "Little")}
                            className="bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-700 hover:border-amber-450 px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 transition-all text-center leading-tight shadow-3xs"
                            id={`vote-${camp.id}-little`}
                          >
                            Little Improvement
                          </button>
                          <button
                            onClick={() => handleCastingVote(camp.id, "No")}
                            className="bg-white hover:bg-red-50 text-gray-700 hover:text-red-650 hover:border-red-400 px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 transition-all text-center leading-tight shadow-3xs"
                            id={`vote-${camp.id}-no`}
                          >
                            No Improvement
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Registration / Actions Sidebar forms (4 cols) */}
        <div className="lg:col-span-4" id="registration-action-sidebar">
          
          {/* Inner tab selectors */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6" id="wizard-container">
            <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-100 gap-1.5" id="sidebar-tabs">
              <button
                onClick={() => setActiveFormTab("org")}
                className={`flex-1 text-center py-2 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                  activeFormTab === "org"
                    ? "bg-white text-primary border-gray-200 shadow-3xs"
                    : "text-gray-500 border-transparent hover:text-gray-800"
                }`}
              >
                Register Org
              </button>
              <button
                onClick={() => setActiveFormTab("campaign")}
                className={`flex-1 text-center py-2 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all border ${
                  activeFormTab === "campaign"
                    ? "bg-white text-primary border-gray-200 shadow-3xs"
                    : "text-gray-500 border-transparent hover:text-gray-800"
                }`}
              >
                Register Cleanup
              </button>
            </div>

            {/* Form A: Register Organization */}
            {activeFormTab === "org" && (
              <form onSubmit={handleOrgSubmit} className="space-y-4" id="register-org-form">
                <div className="space-y-1" id="org-header-section">
                  <h4 className="text-sm font-bold text-gray-900 block leading-tight">Register Environmental Org</h4>
                  <p className="text-[11px] text-gray-500">Provide verified contact details to register cleanup campaigns in under-mapped divisions of Cameroon.</p>
                </div>

                <div className="space-y-3" id="org-inputs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g., Douala Green Action Coalition"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Type</label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 cursor-pointer"
                    >
                      <option value="NGO">NGO (Registered Non-Gov)</option>
                      <option value="School">School / University Body</option>
                      <option value="Community Group">Community Group / Commune</option>
                      <option value="Company">Private Company Sponsor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Contact Email</label>
                    <input
                      type="email"
                      required
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      placeholder="e.g., clearance@org.org"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Phone Number</label>
                    <input
                      type="tel"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="e.g., +237 677 890 000"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Operating Zone (Target Catalog)</label>
                    <select
                      value={orgCatalog}
                      onChange={(e) => setOrgCatalog(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 cursor-pointer"
                    >
                      {catalogs.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.neighborhood}, {cat.city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Short Description</label>
                    <textarea
                      rows={2}
                      value={orgDesc}
                      onChange={(e) => setOrgDesc(e.target.value)}
                      placeholder="e.g., Pioneering localized micro waste collection in Yaoundé markets..."
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOrgCreating}
                  className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-200 text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center leading-none"
                >
                  {isOrgCreating ? <Loader className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  <span>Register Integrated Org</span>
                </button>
              </form>
            )}

            {/* Form B: Register Campaign */}
            {activeFormTab === "campaign" && (
              <form onSubmit={handleCampaignSubmit} className="space-y-4" id="register-campaign-form">
                <div className="space-y-1" id="campaign-header-section">
                  <h4 className="text-sm font-bold text-gray-900 block leading-tight">Create Cleanup Campaign</h4>
                  <p className="text-[11px] text-gray-500">Attach campaign movements to local catalog areas, defining dates and uploading Before intervention photos.</p>
                </div>

                <div className="space-y-3" id="camp-inputs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Select Executing Org</label>
                    <select
                      value={orgOptionsName}
                      onChange={(e) => setOrgOptionsName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 cursor-pointer"
                    >
                      {organizations.map(org => (
                        <option key={org.id} value={org.name}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Campaign Title</label>
                    <input
                      type="text"
                      required
                      value={campTitle}
                      onChange={(e) => setCampTitle(e.target.value)}
                      placeholder="e.g., Melen Gutter Grating Block Day"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Target Location Link</label>
                    <select
                      value={campCatalogId}
                      onChange={(e) => setCampCatalogId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 cursor-pointer"
                    >
                      {catalogs.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.neighborhood}, {cat.city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Description</label>
                    <textarea
                      rows={2}
                      value={campDescription}
                      onChange={(e) => setCampDescription(e.target.value)}
                      placeholder="e.g., Installing secondary water filter meshes to hold garbage piles downstream..."
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2" id="campaign-dates-grid">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Start Date</label>
                      <input
                        type="date"
                        required
                        value={campStart}
                        onChange={(e) => setCampStart(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Proposed End Date</label>
                      <input
                        type="date"
                        value={campEnd}
                        onChange={(e) => setCampEnd(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block">Before Evidence Image URL</label>
                    <input
                      type="url"
                      value={campBeforeImg}
                      onChange={(e) => setCampBeforeImg(e.target.value)}
                      placeholder="Paste image address link"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-0 text-gray-800"
                    />
                    
                    {/* Compact layout selectors for pre-sourced Unsplash campaign visuals */}
                    <div className="space-y-1 pt-1.5" id="campaign-presets-selector">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest font-mono block">
                        OR Tap Public Sourced Visual Preset:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5" id="campaign-preset-grid">
                        {CAMPAIGN_PRESET_IMAGES.map((preset) => (
                          <div
                            key={preset.title}
                            onClick={() => {
                              setCampBeforeImg(preset.url);
                              if (!campDescription) setCampDescription(preset.description);
                            }}
                            className={`group relative h-12 rounded overflow-hidden border cursor-pointer transition-all ${
                              campBeforeImg === preset.url ? "border-primary ring-1 ring-primary" : "border-gray-200 hover:border-accent"
                            }`}
                            title={preset.description}
                          >
                            <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center leading-none">
                              <span className="text-[8px] font-bold text-white truncate block px-0.5">{preset.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCampaignCreating}
                  className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-200 text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center leading-none"
                >
                  {isCampaignCreating ? <Loader className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                  <span>Activate Cleanup Campaign</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
