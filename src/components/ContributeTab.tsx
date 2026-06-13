/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Camera, AlertTriangle, HelpCircle, FileText, CheckCircle2, ChevronRight, Loader2, RefreshCw, Upload } from "lucide-react";
import { CameroonRegion } from "../types";

// Static local context data matching our Cameroon administrative schema
const REGION_OPTIONS: CameroonRegion[] = [
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

const CITY_MAPPING: Record<CameroonRegion, string[]> = {
  "Centre": ["Yaoundé", "Mbalmayo"],
  "Littoral": ["Douala", "Edéa"],
  "North West": ["Bamenda", "Kumbo"],
  "South West": ["Buea", "Limbe"],
  "West": ["Bafoussam", "Dschang"],
  "Adamaoua": ["Ngaoundéré", "Meiganga"],
  "Far North": ["Maroua", "Yagoua"],
  "North": ["Garoua", "Guider"],
  "East": ["Bertoua", "Batouri"],
  "South": ["Ebolowa", "Kribi"]
};

const TOWN_MAPPING: Record<string, string[]> = {
  "Yaoundé": ["Yaoundé I", "Yaoundé II", "Yaoundé III", "Yaoundé IV", "Yaoundé V", "Yaoundé VI", "Yaoundé VII"],
  "Mbalmayo": ["Mbalmayo Centre", "Nkololoang"],
  "Douala": ["Douala I", "Douala II", "Douala III", "Douala IV", "Douala V"],
  "Edéa": ["Edéa I", "Edéa II"],
  "Bamenda": ["Bamenda I", "Bamenda II", "Bamenda III"],
  "Kumbo": ["Kumbo Centre", "Tobin"],
  "Buea": ["Molyko", "Great Soppo", "Dirty No Road"],
  "Limbe": ["Limbe I", "Limbe II", "Limbe III"],
  "Bafoussam": ["Bafoussam I", "Bafoussam II", "Bafoussam III"],
  "Dschang": ["Dschang Centre"],
  "Ngaoundéré": ["Ngaoundéré I", "Ngaoundéré II", "Ngaoundéré III"],
  "Meiganga": ["Meiganga Centre"],
  "Maroua": ["Maroua I", "Maroua II", "Maroua III"],
  "Yagoua": ["Yagoua Centre"],
  "Garoua": ["Garoua I", "Garoua II", "Garoua III"],
  "Guider": ["Guider Centre"],
  "Bertoua": ["Bertoua I", "Bertoua II"],
  "Batouri": ["Batouri Centre"],
  "Ebolowa": ["Ebolowa I", "Ebolowa II"],
  "Kribi": ["Kribi I", "Kribi II"]
};

const NEIGHBORHOOD_MAPPING: Record<string, string[]> = {
  "Yaoundé VI": ["Melen", "Elig-Effa", "Nkolbikok"],
  "Yaoundé VII": ["Biyem-Assi", "Mendong"],
  "Yaoundé I": ["Bastos", "Etoudi"],
  "Douala IV": ["Bonaberi", "Deïdo"],
  "Douala I": ["Akwa", "Bali"],
  "Bamenda II": ["Nkwen", "Mankon"],
  "Molyko": ["University Area", "Sandpit"],
  "Dirty No Road": ["Bolifamba", "Ndongo"],
  "Ngaoundéré I": ["Baladji I", "Sabongari", "Yelwa Ngaoundéré"],
  "Ngaoundéré III": ["Dang (University Area)", "Ngaoundéré Centre"],
  "Maroua I": ["Palas", "Kakataré", "Maroua Market"],
  "Maroua II": ["Hardé", "Diguirwo"],
  "Garoua I": ["Yelwa Garoua", "Lopéré"],
  "Garoua II": ["Poumpoumré", "Roumdé Adjia"],
  "Bertoua I": ["Birponi", "Enia"],
  "Bertoua II": ["Kpokolota", "Tigaza"],
  "Ebolowa I": ["Nko'ovos", "Ebolowa Centre"],
  "Kribi I": ["Mboa Manga", "Kribi Beach Area"]
};

// Preset reference photos representing real Cameroon environmental situations to facilitate direct testing
const PRESET_PHOTOS = [
  {
    title: "Urban Drain Blockage",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    description: "Plastic sludge blocks an open storm drainage outlet adjacent to Yaoundé local marketplace secondary road."
  },
  {
    title: "Water Contamination Well",
    url: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80",
    description: "Industrial fluid spill coloring drainage pathways close to drinking water borehole taps in Bonaberi."
  },
  {
    title: "Open Refuse Burning",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    description: "Smoke clouds rise from open garbage burning near schools and residential compounds of Biyem-Assi."
  },
  {
    title: "Plastics River Silt",
    url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80",
    description: "Polystyrene packaging and polyethylene bottles accumulated downstream in urban riverways."
  },
  {
    title: "Eco Erosion Soil Loss",
    url: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=600&q=80",
    description: "Severe tropical downpour erosion lines and loose soil siltation choking secondary gutters."
  }
];

interface ContributeTabProps {
  onObservationAdded: (newObs: any, catalog: any, userStats: any) => void;
  catalogsCount: number;
}

export default function ContributeTab({ onObservationAdded, catalogsCount }: ContributeTabProps) {
  const [region, setRegion] = useState<CameroonRegion>("Centre");
  const [city, setCity] = useState("Yaoundé");
  const [town, setTown] = useState("Yaoundé VI");
  const [neighborhood, setNeighborhood] = useState("Melen");
  
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [pollutionTag, setPollutionTag] = useState<"Clean" | "Slightly Polluted" | "Moderately Polluted" | "Highly Polluted" | "Extremely Polluted">("Moderately Polluted");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successResponse, setSuccessResponse] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic cascades when region changes
  useEffect(() => {
    const cities = CITY_MAPPING[region] || [];
    const defaultCity = cities[0] || "";
    setCity(defaultCity);
    
    const towns = defaultCity ? (TOWN_MAPPING[defaultCity] || []) : [];
    const defaultTown = towns[0] || "";
    setTown(defaultTown);
    
    const neighborhoods = defaultTown ? (NEIGHBORHOOD_MAPPING[defaultTown] || []) : [];
    const defaultNeighborhood = neighborhoods[0] || defaultTown;
    setNeighborhood(defaultNeighborhood);
  }, [region]);

  // Input handlers with smart matching defaults for known configurations
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    const towns = TOWN_MAPPING[newCity] || [];
    if (towns.length > 0) {
      const defaultTown = towns[0];
      setTown(defaultTown);
      const neighborhoods = NEIGHBORHOOD_MAPPING[defaultTown] || [];
      setNeighborhood(neighborhoods[0] || defaultTown);
    }
  };

  const handleTownChange = (newTown: string) => {
    setTown(newTown);
    const neighborhoods = NEIGHBORHOOD_MAPPING[newTown] || [];
    if (neighborhoods.length > 0) {
      setNeighborhood(neighborhoods[0]);
    }
  };

  // Handle manual visual input upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      setIsAnalyzing(true);
      setStatusMessage("Encoding high-res photo bytes...");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        
        // Simulate immediate fronted loading effect for AI processing
        setTimeout(() => {
          setStatusMessage("Contacting GreenLens AI server...");
          setTimeout(() => {
            setIsAnalyzing(false);
            setStatusMessage("");
          }, 1200);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to click drag/drop container
  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Preset photo selector helper
  const selectPresetPhoto = (preset: typeof PRESET_PHOTOS[0]) => {
    setPhotoUrl(preset.url);
    setImageName(preset.title);
    if (!description) {
      setDescription(preset.description);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Please provide any additional descriptive context before submitting.");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("Classifying indicators and updating catalog database...");

    try {
      // Create specific catalog identifier e.g. LOC_MLN_YAO_CEN_CMR
      const rCode = region.substring(0, 3).toUpperCase();
      const cCode = city.substring(0, 3).toUpperCase();
      const nCode = (neighborhood || town).substring(0, 3).toUpperCase();
      const generatedCatalogId = `LOC_${nCode}_${cCode}_${rCode}_CMR`;

      const response = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: generatedCatalogId,
          region,
          city,
          townOrArrondissement: town,
          neighborhood: neighborhood || town,
          description,
          photoUrl,
          reporterName: "Awah Blaise Atanga",
          pollutionTag
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessResponse(data);
        onObservationAdded(data.observation, data.catalog, data.userStats);
        
        // Reset form variables
        setIsAnalyzing(false);
        setStatusMessage("");
      } else {
        alert(data.error || "Failed compiling observation.");
        setIsAnalyzing(false);
        setStatusMessage("");
      }
    } catch (err) {
      console.error("Transmission error:", err);
      alert("Communication error, check server terminal connections.");
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  const startNewReport = () => {
    setSuccessResponse(null);
    setDescription("");
    setPhotoUrl("");
    setImageName("");
    setPollutionTag("Moderately Polluted");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8" id="contribute-tab-view">
      {/* Title Header */}
      <div className="text-center space-y-2 pt-4" id="contribute-header">
        <h2 className="text-2xl font-black text-primary tracking-tight md:text-3xl">New Observation Setup</h2>
        <p className="text-gray-500 text-xs md:text-sm">
          Report ecological hotspots and feed metadata into our community environmental intelligence registry.
        </p>
      </div>

      {successResponse ? (
        /* Success Screen */
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-8 text-center space-y-6" id="success-screen">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto" id="success-ring">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Observation Registered Successfully!</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Your report has been successfully evaluated by GreenLens AI. The catalog for <span className="font-semibold text-primary">{successResponse.catalog?.neighborhood || neighborhood}</span> has been updated with an enhanced environmental score.
            </p>
          </div>

          <div className="bg-emerald-50/50 rounded-lg p-4 max-w-md mx-auto border border-emerald-100/50 space-y-2 text-left text-xs font-medium" id="xp-reward-card">
            <span className="text-emerald-800 font-bold uppercase tracking-wider block font-mono text-[9px]">Contribution Impact Reward</span>
            <div className="flex justify-between text-gray-600">
              <span>Points Earned</span>
              <span className="font-bold text-emerald-700 font-mono">+30 XP</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Current User Rank</span>
              <span className="font-bold text-emerald-800 font-mono">{successResponse.userStats?.level}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-3">
            <button
              onClick={startNewReport}
              className="bg-primary hover:bg-primary-light text-white text-xs font-semibold px-6 py-3 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Start Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Contribution Form Form */
        <form onSubmit={handleSubmit} className="space-y-6" id="contribution-form">
          
          {/* Section 1: Administrative Location Hierarchy */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4" id="location-context-card">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3" id="loc-header">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 font-mono">1. Local Location Context</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300" id="location-selects-grid">
              {/* Region */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as CameroonRegion)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-gray-800 focus:border-primary focus:outline-0 transition-all cursor-pointer shadow-3xs"
                  id="select-region"
                >
                  {REGION_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">City / Commune</label>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder="e.g. Douala, Bamenda, Kumba, Yaoundé"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-0 transition-all font-sans"
                    id="input-city"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Type freely to enter any city or commune in Cameroon</p>
              </div>

              {/* Town */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">Town / Arrondissement</label>
                <div className="relative">
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => handleTownChange(e.target.value)}
                    placeholder="e.g. Douala IV, Kumba I, Bamenda II, Yaoundé VI"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-0 transition-all font-sans"
                    id="input-town"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Type your sub-division, commune, or local government zone</p>
              </div>

              {/* Neighborhood */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono">Neighborhood / Village</label>
                <div className="relative">
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Bastos, Akwa, Molyko, Melen"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-0 transition-all font-sans"
                    id="input-neighborhood"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">Type your exact quarter, neighborhood, village name, or street</p>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-lg flex items-center justify-between border border-emerald-100" id="catalog-join-checker">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center font-mono text-xs font-bold leading-none shrink-0">
                  ID
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-900 block leading-tight">Catalogs Resolved</span>
                  <span className="text-[10px] font-mono font-medium text-gray-400">
                    DATA: LOC_{[town, neighborhood].filter(Boolean).map(x => x.substring(0,3).toUpperCase()).join("_")}_{(city || "YAO").substring(0,3).toUpperCase()}_CMR
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0c5216] px-2 py-1 bg-[#acf4a4] rounded">
                Auto-Link
              </span>
            </div>
          </div>

          {/* Section 2: Visual Evidence Upload */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4" id="visual-evidence-card">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3" id="vis-header">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 font-mono">2. Upload Ecological Evidence</h3>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 font-mono bg-gray-100 px-2.5 py-1 rounded">
                REQUIRED
              </span>
            </div>

            {/* Drag & Drop Visual Box */}
            <div
              onClick={triggerFileSelector}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                photoUrl ? "border-primary bg-emerald-50/20" : "border-gray-200 hover:border-accent hover:bg-gray-50/50"
              }`}
              id="upload-evidence-dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                id="file-element-input"
              />

              {photoUrl ? (
                <div className="space-y-3" id="preview-image-block">
                  <div className="h-32 w-32 mx-auto rounded-lg overflow-hidden border border-gray-200 shadow-xs">
                    <img src={photoUrl} alt="Visual submission preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-xs text-gray-500 font-mono font-medium">
                    {imageName || "custom_image_submission.png"}
                  </div>
                  <span className="text-xs text-primary font-bold hover:underline inline-block">
                    Change visual evidence
                  </span>
                </div>
              ) : (
                <div className="space-y-3" id="drag-drop-placeholder">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                  <div>
                    <span className="text-sm font-bold text-gray-800 block">Tap to capture or upload evidence</span>
                    <span className="text-xs text-gray-400 block mt-1">High-resolution photo or secondary video clip</span>
                  </div>
                </div>
              )}
            </div>

            {/* Alternate Regional Reference Presets for Testing Convenience */}
            <div className="space-y-2 pt-1" id="presets-selector-wrapper">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest font-mono block">
                OR Select Regional Testing Reference Preset:
              </span>
              <div className="grid grid-cols-3 gap-2" id="preset-cards">
                {PRESET_PHOTOS.map((preset) => (
                  <div
                    key={preset.title}
                    onClick={() => selectPresetPhoto(preset)}
                    className="group relative h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-accent cursor-pointer transition-all"
                  >
                    <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-1 text-center">
                      <span className="text-[9px] font-bold text-white truncate block">{preset.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: AI Analysis Card + Additional Context */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4" id="description-card">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3" id="desc-header">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 font-mono">3. Additional Ecological Context</h3>
            </div>

            <div className="space-y-4" id="text-fields-wrapper">
              {/* Deterministic Scoring Engine Key Field */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-[#0c5216] uppercase tracking-wider font-mono block">
                  How Dirty is this Area? (Pollution Tag)
                </label>
                <select
                  value={pollutionTag}
                  onChange={(e) => setPollutionTag(e.target.value as any)}
                  className="w-full bg-white border-2 border-[#125d1e]/20 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:border-primary focus:outline-0 transition-all cursor-pointer shadow-3xs"
                  id="select-pollution-tag"
                >
                  <option value="Clean">Clean (0 - pristine condition)</option>
                  <option value="Slightly Polluted">Slightly Polluted (25 - low-level litter)</option>
                  <option value="Moderately Polluted">Moderately Polluted (50 - standard refuse pile & clogs)</option>
                  <option value="Highly Polluted">Highly Polluted (75 - heavy structural pollution)</option>
                  <option value="Extremely Polluted">Extremely Polluted (100 - extreme toxic / caked hazard)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Your manual selection calculates a deterministic weighted score locally when at least 5 images exist.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider font-mono block">
                  Write detailed observations...
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the severity, location indicators, approximate waste pile volumes, odor presence, or municipal dumping triggers alongside schools or water canals in Cameroon..."
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-800 focus:border-primary focus:outline-0 transition-all font-medium"
                  id="observation-textarea"
                />
              </div>

              {/* Live Automated Preliminary Findings (AI Visual Indicator Block) */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 space-y-3" id="preliminary-ai-box">
                <div className="flex items-center gap-2" id="ai-box-title">
                  <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono block">
                    Automated Preliminary Findings (AI Engine)
                  </span>
                </div>

                <div className="space-y-2 text-xs font-medium" id="preliminary-findings-list">
                  <div className="flex gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <p className="text-gray-600">
                      Detection: <span className="text-gray-800 font-bold">Waiting for details...</span> Write and supply visual evidence to let server-side AI extract catalog weights.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <p className="text-gray-600">
                      Waterway proximity evaluation: <span className="text-gray-800 font-bold">Unconfirmed.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between" id="contribute-cta-grid">
            <button
              type="button"
              onClick={startNewReport}
              className="text-gray-500 hover:text-gray-700 text-xs font-mono font-extrabold underline order-2 sm:order-1"
            >
              Reset Draft Fields
            </button>
            
            <button
              type="submit"
              disabled={isAnalyzing || !description.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary-light disabled:bg-gray-200 text-white font-semibold text-xs py-3.5 px-8 rounded-lg flex items-center justify-center gap-2 tracking-wider uppercase transition-all order-1 sm:order-2"
              id="submit-observation-btn"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{statusMessage || "Syncing AI insights..."}</span>
                </>
              ) : (
                <>
                  <span>Submit to Environmental Catalog</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
