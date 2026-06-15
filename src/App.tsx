/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from "react";
import { Compass, Camera, ShieldCheck, BarChart3, User, RefreshCw, Search, Layers, ShieldCheck as VerifiedIcon, Loader2, WifiOff } from "lucide-react";

import { EnvironmentalCatalog, Organization, UserStats } from "./types";
import ExploreTab from "./components/ExploreTab";
import ContributeTab from "./components/ContributeTab";
import ImpactTab from "./components/ImpactTab";
import InsightsTab from "./components/InsightsTab";
import ProfileTab from "./components/ProfileTab";
import CatalogDetailModal from "./components/CatalogDetailModal";
import WelcomePage from "./components/WelcomePage";
import DynamicIsland from "./components/DynamicIsland";
import { SEED_CATALOGS, SEED_ORGANIZATIONS, SEED_USER_STATS } from "./data/seedData";
import greenlensLogo from "./assets/images/greenlens_logo_1781522444785.jpg";

type TabId = "explore" | "contribute" | "impact" | "insights" | "profile";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("explore");
  
  // Hydrator with fail-safe defaults from localStorage to support remote Cameroon regions without any network
  const [catalogs, setCatalogs] = useState<EnvironmentalCatalog[]>(() => {
    try {
      const cached = localStorage.getItem("greenlens_catalogs");
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_CATALOGS;
      }
      return SEED_CATALOGS;
    } catch {
      return SEED_CATALOGS;
    }
  });
  
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const cached = localStorage.getItem("greenlens_organizations");
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ORGANIZATIONS;
      }
      return SEED_ORGANIZATIONS;
    } catch {
      return SEED_ORGANIZATIONS;
    }
  });
  
  const [userStats, setUserStats] = useState<UserStats | null>(() => {
    try {
      const cached = localStorage.getItem("greenlens_userstats");
      return cached ? JSON.parse(cached) : SEED_USER_STATS;
    } catch {
      return SEED_USER_STATS;
    }
  });
  
  const [selectedCatalog, setSelectedCatalog] = useState<EnvironmentalCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  // Sync state from server Express API - with robust offline fallbacks
  const refreshPlatformData = async () => {
    setIsLoading(true);
    try {
      const catalogsRes = await fetch("/api/catalogs");
      const catalogsData = await catalogsRes.json();
      
      const orgsRes = await fetch("/api/organizations");
      const orgsData = await orgsRes.json();

      const userRes = await fetch("/api/user-stats");
      const userData = await userRes.json();

      if (catalogsRes.ok && orgsRes.ok && userRes.ok) {
        setCatalogs(catalogsData);
        setOrganizations(orgsData);
        setUserStats(userData);
        
        // Save successfully updated data to persistent local cache
        localStorage.setItem("greenlens_catalogs", JSON.stringify(catalogsData));
        localStorage.setItem("greenlens_organizations", JSON.stringify(orgsData));
        localStorage.setItem("greenlens_userstats", JSON.stringify(userData));
        setIsOfflineMode(false);
      } else {
        setIsOfflineMode(true);
      }
    } catch (err) {
      console.warn("Environmental platform is currently operating in local-first offline fallback mode:", err);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPlatformData();

    // Register offline / online network event listeners to coordinate auto sync
    const handleOnline = () => {
      setIsOfflineMode(false);
      refreshPlatformData();
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update selected catalog reference on operations changes
  const updateSelectedCatalogRef = (revisedCatalog: EnvironmentalCatalog) => {
    setCatalogs(prev => {
      const updated = prev.map(c => c.id === revisedCatalog.id ? revisedCatalog : c);
      localStorage.setItem("greenlens_catalogs", JSON.stringify(updated));
      return updated;
    });
    if (selectedCatalog && selectedCatalog.id === revisedCatalog.id) {
      setSelectedCatalog(revisedCatalog);
    }
  };

  // Flow Submissions State hooks
  const handleObservationAdded = (newObs: any, catalog: any, updatedUserStats: any) => {
    setCatalogs(prev => {
      const updated = prev.map(c => c.id === catalog.id ? catalog : c);
      localStorage.setItem("greenlens_catalogs", JSON.stringify(updated));
      return updated;
    });
    setUserStats(updatedUserStats);
    if (updatedUserStats) {
      localStorage.setItem("greenlens_userstats", JSON.stringify(updatedUserStats));
    }
    setSuccessFlashMessage("New ecological report categorized by AI!");
  };

  const [successFlashMessage, setSuccessFlashMessage] = useState("");
  useEffect(() => {
    if (successFlashMessage) {
      const timer = setTimeout(() => setSuccessFlashMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successFlashMessage]);

  const handleAuditSubmitted = (campaignId: string, level: string) => {
    // Re-trigger general data pull down to update index weights instantly in sidebar charts
    refreshPlatformData();
  };

  const handleOrganizationRegistered = (newOrg: Organization) => {
    setOrganizations(prev => {
      const updated = [...prev, newOrg];
      localStorage.setItem("greenlens_organizations", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCampaignAdded = (newCampaign: any) => {
    // Re-fetch catalogs to include the active movement item
    refreshPlatformData();
  };

  const handleCompleteCampaign = (campaignId: string, afterImage: string) => {
    // Re-fetch to align all categories
    refreshPlatformData();
  };

  if (showWelcome) {
    return (
      <WelcomePage 
        onStart={() => setShowWelcome(false)} 
        onAuthSuccess={(stats) => {
          setUserStats(stats);
          localStorage.setItem("greenlens_userstats", JSON.stringify(stats));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col pb-28 md:pb-28" id="greenlens-app-root">
      
      {/* Platform Header Row */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-150 py-3.5 px-6 shadow-3xs" id="app-site-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between" id="header-container">
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("explore")} id="logo-block">
            <div className="h-10 w-10 bg-white rounded-xl shadow-xs border border-gray-150 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={greenlensLogo} 
                alt="GreenLens Cameroon Logo" 
                className="w-full h-full object-contain rounded-lg" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider text-primary leading-none font-sans flex items-center gap-1">
                GREENLENS <span className="text-[10px] text-accent tracking-widest font-mono font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">CAMEROON</span>
              </h1>
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold block mt-0.5">
                Environmental Intelligence Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3" id="header-actions">
            {successFlashMessage && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono animate-fadeIn hidden sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
                {successFlashMessage}
              </div>
            )}
            
            <button
              onClick={refreshPlatformData}
              disabled={isLoading}
              className="p-2.5 text-gray-400 hover:text-gray-700 bg-gray-50 border border-gray-100 rounded-lg shrink-0 transition-colors"
              id="refresh-sync-btn"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Offline Fallback Banner */}
      {isOfflineMode && (
        <div className="bg-amber-600 text-white text-xs py-2 px-6 flex flex-col sm:flex-row gap-2 items-center justify-between shadow-xs border-b border-amber-700 animate-fadeIn" id="offline-mode-indicator-banner">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-200 animate-pulse shrink-0" />
            <span className="font-semibold text-center sm:text-left">
              Running offline in Cameroon. Viewing cached environmental reports & administrative catalogs.
            </span>
          </div>
          <div className="text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-700 hover:bg-amber-800 transition-colors px-2 py-1 rounded text-amber-50 shrink-0">
            GreenLens Local Cache Active
          </div>
        </div>
      )}

      {/* Main Tab Render Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6" id="app-main-content">
        
        {isLoading && catalogs.length === 0 ? (
          /* Initializing Loading spinner */
          <div className="py-24 text-center space-y-4" id="initial-loading-block">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-xs text-gray-400 font-mono animate-pulse">Synchronizing local administrative registries...</p>
          </div>
        ) : (
          <div className="animate-fadeIn" id="rendered-tab">
            {activeTab === "explore" && (
              <ExploreTab 
                catalogs={catalogs} 
                onSelectCatalog={(cat) => setSelectedCatalog(cat)} 
                onNavigateToInsights={(anchorId) => {
                  if (anchorId) {
                    window.location.hash = anchorId;
                  }
                  setActiveTab("insights");
                }}
                onNavigateToImpact={() => setActiveTab("impact")}
              />
            )}
            {activeTab === "contribute" && (
              <ContributeTab 
                onObservationAdded={handleObservationAdded}
                catalogsCount={catalogs.length}
              />
            )}
            {activeTab === "impact" && (
              <ImpactTab 
                catalogs={catalogs}
                organizations={organizations}
                currentUserStats={userStats}
                onAuditSubmitted={handleAuditSubmitted}
                onOrganizationRegistered={handleOrganizationRegistered}
                onCampaignAdded={handleCampaignAdded}
              />
            )}
            {activeTab === "insights" && (
              <InsightsTab 
                catalogs={catalogs} 
                onSelectCatalog={(cat) => setSelectedCatalog(cat)} 
              />
            )}
            {activeTab === "profile" && userStats && (
              <ProfileTab 
                userStats={userStats} 
                onEcoPulseSubmitted={() => refreshPlatformData()}
              />
            )}
          </div>
        )}

      </main>

      {/* Catalog Deep Dive overlay details modal */}
      {selectedCatalog && (
        <CatalogDetailModal
          catalog={selectedCatalog}
          onClose={() => setSelectedCatalog(null)}
          onCompleteCampaign={handleCompleteCampaign}
        />
      )}

      {/* Modern Floating Dynamic Island Navigation Controller */}
      <DynamicIsland
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userStats={userStats}
        isOfflineMode={isOfflineMode}
        successFlashMessage={successFlashMessage}
        onClearFlashMessage={() => setSuccessFlashMessage("")}
      />
    </div>
  );
}
