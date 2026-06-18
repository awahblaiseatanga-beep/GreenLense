/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Camera,
  AlertTriangle,
  HelpCircle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Upload,
  Globe,
  Flame,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  Search,
  X,
  Play,
  Clock,
  Link,
  ChevronDown,
  ArrowDownNarrowWide,
  FolderOpen
} from "lucide-react";
import { EnvironmentalCatalog, CameroonRegion } from "../types";

const computeImageHash = (img: HTMLImageElement): string => {
  const c = document.createElement("canvas");
  const cx = c.getContext("2d");
  c.width = 8;
  c.height = 8;
  if (!cx) return "";
  cx.drawImage(img, 0, 0, 8, 8);
  const data = cx.getImageData(0, 0, 8, 8).data;
  let sum = 0;
  const grays = [];
  for (let i = 0; i < data.length; i += 4) {
    const g = (data[i] + data[i+1] + data[i+2]) / 3;
    grays.push(g);
    sum += g;
  }
  const avg = sum / 64;
  return grays.map(g => g >= avg ? "1" : "0").join("");
};

const hammingDistance = (h1: string, h2: string) => {
  if (!h1 || !h2 || h1.length !== 64 || h2.length !== 64) return 64;
  let d = 0;
  for (let i = 0; i < 64; i++) {
    if (h1[i] !== h2[i]) d++;
  }
  return d;
};

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

// Preset reference photos representing real Cameroon environmental situations
const PRESET_PHOTOS = [
  {
    title: "Cameroon Dumpsite Accumulation",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    description: "Uncontrolled refuse dumpsite overflowing with loose plastic waste, nylon materials, and generic domestic litter in Cameroon capital districts."
  }
];

interface ContributeTabProps {
  onObservationAdded: (newObs: any, catalog: any, userStats: any) => void;
  catalogsCount: number;
  userStats: any;
  catalogs: EnvironmentalCatalog[];
}

export default function ContributeTab({ onObservationAdded, catalogsCount, userStats, catalogs }: ContributeTabProps) {
  // Navigation / Tab states
  const [activeTab, setActiveTab] = useState<"upload" | "presets" | "url">("upload");

  // Input states
  const [region, setRegion] = useState<CameroonRegion>("Centre");
  const [city, setCity] = useState("Yaoundé");
  const [town, setTown] = useState("Yaoundé VI");
  const [neighborhood, setNeighborhood] = useState("Melen");
  
  const [description, setDescription] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<{url: string, name: string}[]>([]);
  const photoUrl = uploadedPhotos[0]?.url || "";
  const imageName = uploadedPhotos[0]?.name || "";
  const [urlInput, setUrlInput] = useState("");
  const [pollutionTag, setPollutionTag] = useState<"Clean" | "Slightly Polluted" | "Moderately Polluted" | "Highly Polluted" | "Extremely Polluted">("Moderately Polluted");
  const [impactArea, setImpactArea] = useState<string>("Local Ward (Radius < 250m)");

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successResponse, setSuccessResponse] = useState<any>(null);
  const [rejectionData, setRejectionData] = useState<any | null>(null);

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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsAnalyzing(true);
      setStatusMessage("Encoding high-res photo bytes...");
      
      let processedCount = 0;
      let duplicatesSkipped = 0;
      const newPhotos: {url: string, name: string}[] = [];
      let lastDuplicateAreaId = "";

      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const hash = computeImageHash(img);
            
            // Check existing catalogs for duplicates
            const existingCat = catalogs.find((c) => c.region === region && c.city === city && c.townOrArrondissement === town && (c.neighborhood === neighborhood || !neighborhood || c.neighborhood === town));
            let isDuplicate = false;
            
            if (existingCat) {
              const existingHashes = existingCat.observations?.map(o => o.imageHash).filter(Boolean) || [];
              for (const exHash of existingHashes) {
                 if (exHash && hammingDistance(hash, exHash) <= 6) { // 90% similarity threshold
                   isDuplicate = true;
                   break;
                 }
              }
            }

            if (isDuplicate) {
              duplicatesSkipped++;
              if (existingCat) {
                lastDuplicateAreaId = existingCat.id;
              } else {
                lastDuplicateAreaId = `${region}_${city}_${town}`.replace(/\s+/g, "_").toLowerCase();
              }
              processedCount++;
              if (processedCount === files.length) finalizeUpload(newPhotos, duplicatesSkipped, lastDuplicateAreaId);
              return;
            }

            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compress heavily for Netlify serverless limit
              const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
              newPhotos.push({ url: dataUrl, name: file.name + "||" + hash });
            } else {
              // Fallback
              newPhotos.push({ url: event.target?.result as string, name: file.name + "||" + hash });
            }

            processedCount++;
            if (processedCount === files.length) finalizeUpload(newPhotos, duplicatesSkipped, lastDuplicateAreaId);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const finalizeUpload = (newPhotos: any[], duplicatesSkipped: number, duplicateAreaId?: string) => {
    if (duplicatesSkipped > 0) {
      const areaId = duplicateAreaId || `${region}_${city}_${town}`.replace(/\s+/g, "_").toLowerCase();
      const userId = userStats?.email || "anonymous_ranger";
      const timestamp = new Date().toISOString();

      const rejEvent = {
        reason: "duplicate_image",
        timestamp,
        userId,
        areaId
      };

      setRejectionData(rejEvent);

      // Post logs to server API
      fetch("/api/rejections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rejEvent)
      }).catch(err => console.warn("Failed to post duplicate rejection to Express server:", err));
    }

    if (newPhotos.length > 0) {
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }
    setTimeout(() => {
      setStatusMessage("Contacting GreenLens AI server...");
      setTimeout(() => {
        setIsAnalyzing(false);
        setStatusMessage("");
      }, 500);
    }, 500);
  };

  // Direct custom URL input submission helper
  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setUploadedPhotos(prev => [...prev, { url: urlInput.trim(), name: "imported_external_evidence.png" }]);
    }
  };

  // Helper to click drag/drop container
  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Preset photo selector helper
  const selectPresetPhoto = (preset: typeof PRESET_PHOTOS[0]) => {
    setUploadedPhotos([{ url: preset.url, name: preset.title }]);
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

    // Create specific catalog identifier e.g. LOC_MLN_YAO_CEN_CMR
    const rCode = region.substring(0, 3).toUpperCase();
    const cCode = city.substring(0, 3).toUpperCase();
    const nCode = (neighborhood || town).substring(0, 3).toUpperCase();
    const generatedCatalogId = `LOC_${nCode}_${cCode}_${rCode}_CMR`;

    try {
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
          photoUrl: photoUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
          photoUrls: uploadedPhotos.length > 0 ? uploadedPhotos.map(p => p.url) : [photoUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"],
          imageHash: uploadedPhotos[0]?.name?.includes("||") ? uploadedPhotos[0].name.split("||")[1] : null,
          reporterName: userStats?.fullName || "Eco Scout",
          reporterEmail: userStats?.email || "user@example.com",
          pollutionTag
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        throw new Error(`Server returned a non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }

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
    } catch (err: any) {
      console.warn("Transmission error, shifting to offline backup mode:", err);
      
      const payload = {
        id: "obs_offline_" + Date.now(),
        catalogId: generatedCatalogId,
        region,
        city,
        townOrArrondissement: town,
        neighborhood: neighborhood || town,
        description,
        photoUrl: photoUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
        photoUrls: uploadedPhotos.length > 0 ? uploadedPhotos.map(p => p.url) : [photoUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"],
        imageHash: uploadedPhotos[0]?.name?.includes("||") ? uploadedPhotos[0].name.split("||")[1] : null,
        reporterName: userStats?.fullName || "Eco Scout",
        reporterEmail: userStats?.email || "user@example.com",
        timestamp: new Date().toISOString(),
        aiClassification: {
          indicator: "Needs server analysis",
          threatLevel: "Moderate",
          sentiment: pollutionTag
        }
      };

      try {
        const existingStr = localStorage.getItem("greenlens_pending_observations");
        const pending = existingStr ? JSON.parse(existingStr) : [];
        pending.push(payload);
        localStorage.setItem("greenlens_pending_observations", JSON.stringify(pending));
        
        // Optimistic UI Update
        const localCatalogsRaw = localStorage.getItem("greenlens_catalogs");
        const localCatalogs = localCatalogsRaw ? JSON.parse(localCatalogsRaw) : [];
        const existingCat = localCatalogs.find((c: any) => c.id === generatedCatalogId);
        
        let simulatedCatalogUpdate = existingCat ? { ...existingCat } : {
          id: generatedCatalogId,
          region, city, townOrArrondissement: town, neighborhood: neighborhood || town,
          envScore: 50,
          observations: []
        };
        
        simulatedCatalogUpdate.observations = [payload, ...(simulatedCatalogUpdate.observations || [])];
        
        setSuccessResponse({
          observation: payload,
          catalog: simulatedCatalogUpdate,
          userStats: userStats,
          offlineSaved: true
        });
        
        onObservationAdded(payload, simulatedCatalogUpdate, userStats);
      } catch (storageErr) {
         console.error("Local storage also failed:", storageErr);
         alert("Could not save offline observation.");
      }
      
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  const startNewReport = () => {
    setSuccessResponse(null);
    setDescription("");
    setUploadedPhotos([]);
    setUrlInput("");
    setPollutionTag("Moderately Polluted");
    setImpactArea("Local Ward (Radius < 250m)");
  };

  return (
    <div className="flex items-center justify-center p-2 max-w-2xl mx-auto" id="contribute-tab-view">
      <div className="w-full max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-3xl shadow-xl border border-gray-150 bg-white p-5 sm:p-7 space-y-6">
        
        {successResponse ? (
          /* Success screen with beautiful feedback card */
          <div className="bg-white text-center py-6 space-y-6 animate-scaleIn" id="success-screen">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm" id="success-ring">
              <CheckCircle2 className="h-9 w-9 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-gray-950">Observation Filed Successfully!</h3>
              {(successResponse.catalog?.status === "UNVERIFIED ALERT" && successResponse.catalog?.observations?.filter((o: any) => o.reporterName === (userStats?.fullName || "Eco Scout")).length > 2) ? (
                <div className="text-xs text-left max-w-md mx-auto bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-xl space-y-2 font-medium shadow-2xs" id="contributor-limit-warning">
                  <div className="flex items-center gap-1.5 text-amber-800 font-extrabold uppercase text-[9px] font-mono tracking-wider mb-1">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Verification Balance Rule</span>
                  </div>
                  <p className="font-bold text-gray-900 leading-snug text-xs">
                    Thank you for contributing.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    Your additional observations have been recorded and will help track environmental changes over time.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-[11px]">
                    For area verification, GreenLens requires evidence from multiple community contributors.
                  </p>
                  <p className="font-bold text-amber-900 text-[11.5px] pt-1">
                    Help invite others to contribute.
                  </p>
                </div>
              ) : (successResponse.catalog?.observationCount || 1) < 5 ? (
                <div className="text-xs font-bold max-w-md mx-auto leading-relaxed bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-lg flex flex-col items-center gap-1.5">
                  <span>You helped complete this area&apos;s environmental profile.</span>
                  <span className="text-[10px] text-emerald-600 font-mono">Validation Progress: {successResponse.catalog?.countedObservations || successResponse.catalog?.observationCount || 1} / 5</span>
                </div>
              ) : (successResponse.catalog?.observationCount === 5) ? (
                <div className="text-xs font-bold max-w-md mx-auto leading-relaxed bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-xl flex flex-col items-center gap-2 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-black uppercase text-indigo-900">Pioneer Badge!</span>
                  </div>
                  <span>You provided the 5th observation!</span>
                  <span className="text-[10px] font-normal leading-tight text-center">This area was just officially activated and its first Environmental Score has been generated. Awesome work!</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Your report from <span className="font-bold text-primary">{neighborhood}, {city}</span> has been compiled and is active. The community threat rating indexes have been automatically reweighted.
                </p>
              )}
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl max-w-sm mx-auto border border-emerald-100/60 text-left text-xs font-semibold space-y-2.5" id="xp-reward-card">
              <div className="flex items-center justify-between border-b border-emerald-100/50 pb-1.5">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block font-mono">Engagement Reward</span>
                <span className="bg-emerald-600 text-white rounded text-[9px] px-1.5 py-0.5 uppercase tracking-tight">Status: Sync Safe</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Environmental Impact Points</span>
                <span className="font-extrabold text-emerald-700 font-mono">+30 XP</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Revised User Level</span>
                <span className="font-extrabold text-emerald-800 font-mono">{successResponse.userStats?.level || "Capitaine Eco"}</span>
              </div>
            </div>

            {successResponse.catalog && (successResponse.catalog.status === "UNVERIFIED ALERT" || (successResponse.catalog.countedObservations || 0) < 5 || (successResponse.catalog.contributorCount || 0) < 3) && (
              <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-4 rounded-xl max-w-sm mx-auto text-left space-y-3 animate-fadeIn" id="success-screen-whatsapp-invite">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-[#25D366] text-white rounded-full flex items-center justify-center shrink-0">
                    <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.036 0C5.59 0 .36 5.23 0 11.67c0 2.06.54 4.06 1.57 5.83L0 24l6.5-1.7c1.7.9 3.6 1.4 5.5 1.4 6.45 0 11.68-5.23 11.68-11.68C23.68 5.4 18.45.09 12.036.09z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 leading-none">Invite Contributors</h4>
                    <span className="text-[9px] text-[#20ba56] font-bold">Earn Environmental Referral Points</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-650 leading-normal">
                  This location requires at least <span className="font-bold text-gray-900">5 observations</span> and <span className="font-bold text-gray-900">3 unique contributors</span> to trigger official catalog activation. Invite other community witnesses to contribute evidence!
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const cat = successResponse.catalog;
                    const areaName = `${cat.neighborhood ? cat.neighborhood + ', ' : ''}${cat.city || cat.region || 'Cameroon Local Area'}`;
                    const obsCount = cat.countedObservations || cat.observationCount || 1;
                    const contCount = cat.contributorCount || 1;
                    const refLink = `${window.location.origin}/?ref=${encodeURIComponent(userStats?.email || "anonymous")}&alertId=${encodeURIComponent(cat.id)}`;
                    
                    const message = `🚨 Environmental Alert Needs Verification\n\nAn environmental issue has been reported in:\n${areaName}\n\nCurrent Progress:\n${obsCount}/5 Observations\n${contCount}/3 Contributors\n\nGreenLens needs additional community evidence before this area can become an official Environmental Catalog.\n\nAdd your observation here:\n${refLink}\n\nHelp improve environmental intelligence in our community.`;
                    
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, "_blank");
                  }}
                  className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  id="success-whatsapp-share-btn"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <title>WhatsApp</title>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.459H12a11.8 11.8 0 008.413-3.481 11.8 11.8 0 003.481-8.412c-.003-3.223-1.258-6.254-3.535-8.532z" />
                  </svg>
                  Share on WhatsApp
                </button>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={startNewReport}
                className="bg-primary hover:bg-primary-light text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="h-4 w-4" /> Start New Audit
              </button>
            </div>
          </div>
        ) : (
          /* Active Interactive Audit Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Form Header block */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Camera className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight leading-snug">
                  Create Environmental Registry
                </h2>
                <p className="text-gray-500 text-xs sm:text-[13px] leading-relaxed font-medium">
                  Drop a photo or select administrative locations to map ecological hotspots instantly across Cameroon capital districts.
                </p>
              </div>
            </div>

            {/* Custom Tab Switcher for Evidence Attachment style */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 font-mono block">
                1. Select Environmental Evidence Option
              </span>
              <div className="grid w-full grid-cols-3 rounded-xl p-1 bg-gray-100 border border-gray-150">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`rounded-lg py-1.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "upload"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("presets")}
                  className={`rounded-lg py-1.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "presets"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`rounded-lg py-1.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "url"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>URL</span>
                </button>
              </div>
            </div>

            {/* Tab Outputs */}
            <div className="mt-2 text-center" id="tab-evidence-content">
              {activeTab === "upload" && (
                <div
                  onClick={triggerFileSelector}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary hover:bg-emerald-50/20 cursor-pointer transition-all bg-gray-50/50"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  {uploadedPhotos.length > 0 && activeTab === "upload" ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {uploadedPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img src={photo.url} alt={`Visual submission preview ${index + 1}`} className="h-20 w-auto max-w-[120px] object-cover rounded-lg border border-gray-200" referrerPolicy="no-referrer" />
                            {index === 0 && (
                              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">{uploadedPhotos.length} file{uploadedPhotos.length > 1 ? 's' : ''} added</div>
                      <span className="text-[11px] text-primary font-bold hover:underline" onClick={(e) => { e.stopPropagation(); triggerFileSelector(); }}>Add more or replace</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-5 h-5 text-gray-600" />
                      </div>
                      <h3 className="text-xs font-bold text-gray-800 mb-1">Upload Environmental Images</h3>
                      <p className="text-[10px] text-gray-500">Supports multiple JPG, PNG formats up to 10MB sizes</p>
                    </>
                  )}
                </div>
              )}

              {activeTab === "presets" && (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    {PRESET_PHOTOS.map((preset) => {
                      const isSelected = imageName === preset.title;
                      return (
                        <div
                          key={preset.title}
                          onClick={() => selectPresetPhoto(preset)}
                          className={`group relative w-full max-w-sm h-36 bg-gray-150 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                            isSelected ? "border-primary ring-2 ring-emerald-50" : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img src={preset.url} alt={preset.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 px-3 text-left">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-none mb-1">{preset.title}</span>
                            <span className="text-[9px] text-gray-300 line-clamp-1 block leading-none">Click to select as reference case</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {imageName && (
                    <p className="text-[10px] text-emerald-800 font-semibold text-left bg-emerald-50/50 p-2 rounded-xl mt-1.5">
                      Selected: <b>{imageName}</b>. {description || "We automatically linked the reference context."}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "url" && (
                <div className="space-y-3 p-1">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://example.com/pollution-photo.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 pr-16 text-xs text-gray-800 font-medium focus:border-primary-light outline-none transition-all shadow-3xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="absolute right-1.5 top-1.5 bg-primary text-white font-bold text-[10px] px-3 h-8 rounded-lg uppercase tracking-tight flex items-center justify-center hover:bg-primary-light"
                    >
                      Apply
                    </button>
                  </div>
                  {photoUrl && activeTab === "url" && (
                    <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 text-left flex items-center gap-3">
                      <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-gray-900 block leading-tight">Image URL Linked</span>
                        <span className="text-[10px] text-gray-500 truncate block">{photoUrl}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Fields: Grid Configurations */}
            <div className="space-y-4">
              
              {/* Pollution Gravity Level */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#00600f] font-mono mb-2">
                  Threat Level (Pollution Tag Scale)
                </label>
                <div className="relative">
                  <select
                    value={pollutionTag}
                    onChange={(e) => setPollutionTag(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl h-11 px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary cursor-pointer appearance-none shadow-3xs"
                  >
                    <option value="Clean">Clean (0 - pristine state)</option>
                    <option value="Slightly Polluted">Slightly Polluted (25 - scattered garbage bags)</option>
                    <option value="Moderately Polluted">Moderately Polluted (50 - standard refuse piles & drainage issues)</option>
                    <option value="Highly Polluted">Highly Polluted (75 - major structural waste accumulation)</option>
                    <option value="Extremely Polluted">Extremely Polluted (100 - critical environmental block hazard)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Geographical Hierarchy Grid (2 columns on mobile/tablet) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Region */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                    Region
                  </label>
                  <div className="relative">
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value as CameroonRegion)}
                      className="w-full bg-white border border-gray-200 rounded-xl h-11 px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary cursor-pointer appearance-none shadow-3xs"
                    >
                      {REGION_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r} Region
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                    City / Commune
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder="e.g. Yaoundé, Douala"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary shadow-3xs"
                    required
                  />
                </div>

              </div>

              {/* Sub-division & Neighborhood Town fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Town/Arrondissement */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                    Arrondissement / Subdivision
                  </label>
                  <input
                    type="text"
                    value={town}
                    onChange={(e) => handleTownChange(e.target.value)}
                    placeholder="e.g. Yaoundé VI, Buea I"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary shadow-3xs"
                    required
                  />
                </div>

                {/* Neighborhood or Street */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                    Neighborhood / Quarter
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Melen, Bastos, Akwa"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary shadow-3xs"
                    required
                  />
                </div>

              </div>

              {/* Impact Area Scaling */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                  Impact Radius Scale
                </label>
                <div className="relative">
                  <select
                    value={impactArea}
                    onChange={(e) => setImpactArea(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl h-11 px-3 text-xs font-bold text-gray-800 outline-none focus:border-primary cursor-pointer appearance-none shadow-3xs"
                  >
                    <option value="Local Ward (Radius < 250m)">Local Ward (Radius &lt; 250m)</option>
                    <option value="River Basin Stream">River Basin Stream / Catchment</option>
                    <option value="Sub-division Zone">Full Arrondissement / Commune Block</option>
                    <option value="Metropolitan Core">Major Transit Arteries (Yaoundé / Douala)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Detailed observation logs text boxes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 font-mono mb-2">
                  Detailed Observations & Threat Factors
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe waste volumes, odor emission levels, proximity to schools or streams, or community risks..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-3xs"
                  required
                />
              </div>

              {/* Unified Link Resolution Card */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 bg-[#125d1e]/10 text-primary rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                    ID
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-900 block leading-tight">Catalog Router Code</span>
                    <span className="text-[9px] font-mono font-bold text-gray-400">
                      LOC_{[town, neighborhood].filter(Boolean).map(x => x.substring(0,3).toUpperCase()).join("_")}_{(city || "YAO").substring(0,3).toUpperCase()}_CMR
                    </span>
                  </div>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800 px-2 py-0.5 bg-emerald-100 rounded">
                  Resolved ID
                </span>
              </div>

              {/* Interactive AI preliminary detection log */}
              <div className="bg-amber-50/50 rounded-xl p-3.5 md:p-4 border border-amber-100 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 animate-pulse shrink-0" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                    GreenLens Automated Preliminary Extraction (AI)
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-semibold leading-relaxed text-gray-600">
                  <p>
                    • Detection status: <span className="text-gray-800">{photoUrl ? "Visual bytes mapped" : "Waiting for visual input"}</span>
                  </p>
                  <p>
                    • Community threat index bias: <span className="text-gray-800">{pollutionTag} (+{pollutionTag === "Clean" ? "0" : pollutionTag === "Slightly Polluted" ? "15" : "30"} on local index)</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Form Submission Block */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-150">
              <button
                type="button"
                onClick={startNewReport}
                className="text-gray-400 hover:text-gray-650 transition-all text-xs font-bold underline font-mono flex items-center gap-1.5 cursor-pointer order-2 sm:order-1"
              >
                Clear Draft Fields
              </button>
              
              <button
                type="submit"
                disabled={isAnalyzing || !description.trim()}
                className="w-full sm:w-auto bg-gray-950 hover:bg-gray-850 active:scale-97 disabled:bg-gray-200 text-white rounded-xl px-8 py-3 font-semibold text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>{statusMessage || "Parsing indicators..."}</span>
                  </>
                ) : (
                  <>
                    <span>Submit to Environmental Catalog</span>
                    <ChevronRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}
        
      </div>

      <AnimatePresence>
        {rejectionData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            id="rejection-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden flex flex-col"
              id="rejection-modal-card"
            >
              <div className="p-5 flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                
                <h3 className="text-lg font-black text-gray-950 leading-tight mb-2">
                  Image Already Exists
                </h3>
                
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mb-4">
                  This image is too similar to environmental evidence already submitted for this area. 
                  Please upload a different image showing another angle, perspective, or environmental condition.
                </p>

                {/* Optional Help Text */}
                <div className="w-full bg-emerald-50/60 border border-emerald-100/50 rounded-xl p-3.5 text-left text-xs mb-1">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] font-mono block mb-2">
                    Tips for Better Environmental Evidence
                  </span>
                  <ul className="space-y-1.5 text-gray-600 font-medium">
                    <li className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Take photos from different angles</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Capture a wider area</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Show additional waste accumulation</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Show nearby drainage, roads, or rivers</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Document environmental changes over time</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50/80 px-5 py-3.5 border-t border-gray-150 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectionData(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-550 hover:text-gray-800 border border-gray-200 bg-white hover:bg-gray-550 rounded-lg transition-colors cursor-pointer"
                  id="rejection-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionData(null);
                    triggerFileSelector();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[#00450d] hover:bg-emerald-900 text-white border border-emerald-950 rounded-lg transition-colors shadow-sm cursor-pointer"
                  id="rejection-choose-another-btn"
                >
                  Choose Another Image
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
