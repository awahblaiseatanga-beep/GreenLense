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
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem("greenlens_logged_in") !== "true";
    } catch {
      return true;
    }
  });
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
  const [showOfflineBanner, setShowOfflineBanner] = useState(true);

  // Sync state from server Express API - with robust offline fallbacks
  const refreshPlatformData = async (autoSelectId?: string) => {
    setIsLoading(true);
    try {
      // 1. Sync any offline pending observations first
      let pendingObs: any[] = [];
      try {
        const cachedPending = localStorage.getItem("greenlens_pending_observations");
        if (cachedPending) pendingObs = JSON.parse(cachedPending);
      } catch(e) {}

      if (pendingObs.length > 0 && navigator.onLine) {
        const remainingPending = [];
        for (const obs of pendingObs) {
          try {
            const syncRes = await fetch("/api/observations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                catalogId: obs.catalogId,
                region: obs.region,
                city: obs.city,
                townOrArrondissement: obs.townOrArrondissement,
                neighborhood: obs.neighborhood,
                description: obs.description,
                photoUrl: obs.photoUrl,
                reporterName: obs.reporterName,
                reporterEmail: obs.reporterEmail,
                pollutionTag: obs.aiClassification?.sentiment || "Offline Report"
              })
            });
            if (!syncRes.ok) throw new Error("Sync failed");
          } catch(err) {
            remainingPending.push(obs);
          }
        }
        pendingObs = remainingPending;
        localStorage.setItem("greenlens_pending_observations", JSON.stringify(pendingObs));
      }

      const catalogsRes = await fetch("/api/catalogs");
      let catalogsData = await catalogsRes.json();
      
      const orgsRes = await fetch("/api/organizations");
      const orgsData = await orgsRes.json();

      let userResUrl = "/api/user-stats";
      if (userStats && userStats.email) {
        userResUrl += `?email=${encodeURIComponent(userStats.email)}`;
      } else {
        const cached = localStorage.getItem("greenlens_userstats");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.email) {
              userResUrl += `?email=${encodeURIComponent(parsed.email)}`;
            }
          } catch(e) {}
        }
      }
      
      const userRes = await fetch(userResUrl);
      const userData = await userRes.json();

      if (catalogsRes.ok && orgsRes.ok && userRes.ok) {
        // Merge remaining pending locally into catalogs
        if (pendingObs.length > 0) {
          pendingObs.forEach((pending) => {
             let matchingCat = catalogsData.find((c: any) => c.id === pending.catalogId);
             if (!matchingCat) {
               matchingCat = {
                 id: pending.catalogId,
                 region: pending.region,
                 city: pending.city,
                 townOrArrondissement: pending.townOrArrondissement,
                 neighborhood: pending.neighborhood,
                 envScore: 50,
                 observations: []
               };
               catalogsData.push(matchingCat);
             }
             if (!matchingCat.observations.some((o: any) => o.id === pending.id)) {
                matchingCat.observations.unshift(pending);
             }
          });
        }
        
        setCatalogs(catalogsData);
        setOrganizations(orgsData);
        setUserStats(userData);
        
        // Auto-select referenced target catalog if present
        const selId = autoSelectId || localStorage.getItem("greenlens_alertId_ref");
        if (selId) {
          const matched = catalogsData.find((c: any) => c.id === selId);
          if (matched) {
            setSelectedCatalog(matched);
            console.log("⚡ Auto-selected referenced catalog on data load:", matched.neighborhood);
          }
        } else if (selectedCatalog) {
          const matched = catalogsData.find((c: any) => c.id === selectedCatalog.id);
          if (matched) {
            setSelectedCatalog(matched);
            console.log("⚡ Synced currently open selectedCatalog on refresh:", matched.neighborhood);
          }
        }
        
        // Save successfully updated data to persistent local cache
        localStorage.setItem("greenlens_catalogs", JSON.stringify(catalogsData));
        localStorage.setItem("greenlens_organizations", JSON.stringify(orgsData));
        localStorage.setItem("greenlens_userstats", JSON.stringify(userData));
        setIsOfflineMode(false);
      } else {
        throw new Error("One or more APIs returned a non-200 response.");
      }
    } catch (err) {
      console.warn("Environmental platform is currently operating in local-first offline fallback mode:", err);
      
      try {
        const cachedCats = localStorage.getItem("greenlens_catalogs");
        const cachedOrgs = localStorage.getItem("greenlens_organizations");
        const cachedStats = localStorage.getItem("greenlens_userstats");
        
        if (cachedCats) {
          const list = JSON.parse(cachedCats);
          setCatalogs(list);
          const selId = autoSelectId || localStorage.getItem("greenlens_alertId_ref");
          if (selId) {
            const matched = list.find((c: any) => c.id === selId);
            if (matched) setSelectedCatalog(matched);
          }
        }
        if (cachedOrgs) setOrganizations(JSON.parse(cachedOrgs));
        if (cachedStats) setUserStats(JSON.parse(cachedStats));
      } catch (e) {
        console.warn("Failed to load cached fallback data:", e);
      }

      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Parse URL invitation/referral parameters
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    const alertId = urlParams.get("alertId") || urlParams.get("catalogId");
    
    if (ref) {
      localStorage.setItem("greenlens_referrer", ref);
      console.info("⚡ Invitation referral captured. Ref:", ref);
    }
    if (alertId) {
      localStorage.setItem("greenlens_alertId_ref", alertId);
      console.info("⚡ Invitation alertId captured. AlertId:", alertId);
    }

    refreshPlatformData(alertId || undefined);

    // Check for active Supabase OAuth or Email sessions to restore session state immediately
    const checkActiveSession = async () => {
      try {
        const { getSupabaseClient } = await import("./supabaseClient");
        const activeSupabase = await getSupabaseClient();
        if (activeSupabase) {
          // Recover session from URL hash or query if present (useful in Netlify/iframe popups fallback redirects)
          const hash = window.location.hash || window.location.search;
          if (hash && (hash.includes("access_token=") || hash.includes("code="))) {
            window.history.replaceState(null, "", window.location.pathname);
            if (hash.includes("access_token=")) {
              const params = new URLSearchParams(hash.replace("#", "?"));
              const access_token = params.get("access_token");
              const refresh_token = params.get("refresh_token");
              if (access_token && refresh_token) {
                await activeSupabase.auth.setSession({ access_token, refresh_token });
              }
            } else if (hash.includes("code=")) {
              const params = new URLSearchParams(hash);
              const code = params.get("code");
              if (code) {
                await activeSupabase.auth.exchangeCodeForSession(code);
              }
            }
          }

          const { data: { session } } = await activeSupabase.auth.getSession();
          if (session?.user) {
            console.info("Discovered active Ranger session on Supabase:", session.user.email);
            localStorage.setItem("greenlens_logged_in", "true");
            setShowWelcome(false);

            let statsToUse = null;
            try {
              const res = await fetch("/api/user-stats?email=" + encodeURIComponent(session.user.email || ""));
              if (res.ok) {
                const liveStats = await res.json();
                if (liveStats && liveStats.email === session.user.email) {
                  statsToUse = liveStats;
                }
              } else {
                // If user-stats 404s/fails, auto-register via Google OAuth API route
                const googleRes = await fetch("/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: session.user.email,
                    fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Eco Ranger"
                  })
                });
                if (googleRes.ok) {
                  const googleData = await googleRes.json();
                  statsToUse = googleData.userStats;
                }
              }
            } catch(e) {
              console.warn("Express backend is offline or slow, attempting cache lookup:", e);
            }

            if (!statsToUse) {
              const cachedStatsStr = localStorage.getItem("greenlens_userstats");
              if (cachedStatsStr) {
                const cached = JSON.parse(cachedStatsStr);
                if (cached && cached.email === session.user.email) {
                  statsToUse = cached;
                }
              }
            }

            if (!statsToUse) {
              statsToUse = {
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Eco Ranger",
                contributionsCount: 0,
                verificationsCount: 0,
                level: "Observer",
                xp: 0,
                ecoPulseScore: 50,
                carbonFootprint: 140,
                region: "South West",
                city: "Buea",
                townOrArrondissement: "Molyko",
                neighborhood: "Mayour street",
                role: "Citizen Scientist",
              };
            }
            localStorage.setItem("greenlens_userstats", JSON.stringify(statsToUse));
            setUserStats(statsToUse);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve active Supabase terminal authorization session:", err);
      }
    };
    checkActiveSession();

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
      let found = false;
      let updated = prev.map(c => {
        if (c.id === catalog.id) {
          found = true;
          return catalog;
        }
        return c;
      });
      if (!found) {
        updated = [catalog, ...updated];
      }
      localStorage.setItem("greenlens_catalogs", JSON.stringify(updated));
      return updated;
    });
    if (selectedCatalog && selectedCatalog.id === catalog.id) {
      setSelectedCatalog(catalog);
    }
    setUserStats(updatedUserStats);
    if (updatedUserStats) {
      localStorage.setItem("greenlens_userstats", JSON.stringify(updatedUserStats));
    }
    
    // Check and trigger referral success conversion
    const referrer = localStorage.getItem("greenlens_referrer");
    const refAlertId = localStorage.getItem("greenlens_alertId_ref");
    const currentUserEmail = updatedUserStats?.email || newObs?.reporterEmail;
    
    if (referrer && currentUserEmail && referrer !== currentUserEmail && refAlertId === catalog.id) {
      fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviterId: referrer,
          newContributorId: currentUserEmail,
          alertId: catalog.id
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("⚡ Success: Referral conversion tracked:", data);
        // Clean up from state to prevent dual counting
        localStorage.removeItem("greenlens_referrer");
        localStorage.removeItem("greenlens_alertId_ref");
        setSuccessFlashMessage("Verification invite referral registered! Points awarded to inviter.");
      })
      .catch(err => {
        console.warn("Could not register referral conversion:", err);
      });
    } else {
      setSuccessFlashMessage("New ecological report categorized by AI!");
    }
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

  const handleLogout = async () => {
    try {
      const { getSupabaseClient } = await import("./supabaseClient");
      const activeSupabase = await getSupabaseClient();
      if (activeSupabase) {
        await activeSupabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Could not sign out of Supabase cleanly:", err);
    }
    
    // Clean all session flags
    localStorage.removeItem("greenlens_logged_in");
    localStorage.removeItem("greenlens_userstats");
    
    // Reset React state variables
    setUserStats(null);
    setShowWelcome(true);
    setActiveTab("explore");
  };

  if (showWelcome) {
    return (
      <WelcomePage 
        onStart={() => setShowWelcome(false)} 
        onAuthSuccess={(stats) => {
          setUserStats(stats);
          localStorage.setItem("greenlens_userstats", JSON.stringify(stats));
          localStorage.setItem("greenlens_logged_in", "true");
          setShowWelcome(false);
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
      {isOfflineMode && showOfflineBanner && (
        <div className="bg-amber-600 text-white text-xs py-2 px-6 flex flex-col sm:flex-row gap-2 items-center justify-between shadow-xs border-b border-amber-700 animate-fadeIn relative pr-10" id="offline-mode-indicator-banner">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-200 animate-pulse shrink-0" />
            <span className="font-semibold text-center sm:text-left">
              Running offline or Netlify serverless proxy disconnected. Viewing cached fallback catalogs.
            </span>
          </div>
          <div className="text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-700 hover:bg-amber-800 transition-colors px-2 py-1 rounded text-amber-50 shrink-0">
            GreenLens Local Cache Active
          </div>
          <button 
            onClick={() => setShowOfflineBanner(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-amber-700 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
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
                userStats={userStats}
                catalogs={catalogs}
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
                onLogout={handleLogout}
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
          onAddObservation={handleObservationAdded}
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
