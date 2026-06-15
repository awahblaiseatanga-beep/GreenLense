/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserStats, CameroonRegion } from "../types";
import { supabase } from "../supabaseClient";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Leaf, 
  Building2, 
  X,
  Check,
  AlertCircle,
  Globe,
  Award
} from "lucide-react";

const CAMEROON_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Centre": {
    "Yaoundé": ["Yaoundé I", "Yaoundé II", "Yaoundé III", "Yaoundé IV", "Yaoundé V", "Yaoundé VI (Melen)", "Yaoundé VII (Biyem-Assi)", "Bastos"],
    "Mbalmayo": ["Mbalmayo Centre", "Nkololoang", "Mbeka"],
  },
  "Littoral": {
    "Douala": ["Douala I (Akwa)", "Douala II (Nkololoun)", "Douala III", "Douala IV (Bonaberi)", "Douala V", "Kassa"],
    "Edéa": ["Edéa I", "Edéa II"],
  },
  "North West": {
    "Bamenda": ["Bamenda I", "Bamenda II (Nkwen)", "Bamenda III (Chomba)"],
    "Kumbo": ["Kumbo Centre", "Tobin"],
  },
  "South West": {
    "Buea": ["Molyko", "Great Soppo", "Dirty No Road", "Clerks Quarters"],
    "Limbe": ["Limbe I (Half Mile)", "Limbe II (Bota)", "Limbe III"],
  },
  "West": {
    "Bafoussam": ["Bafoussam I", "Bafoussam II", "Bafoussam III"],
    "Dschang": ["Dschang Centre", "Foret d'Alen"],
  },
  "Adamaoua": {
    "Ngaoundéré": ["Ngaoundéré I", "Ngaoundéré II", "Ngaoundéré III"],
    "Meiganga": ["Meiganga Centre"],
  },
  "Far North": {
    "Maroua": ["Maroua I", "Maroua II", "Maroua III"],
    "Yagoua": ["Yagoua Centre"],
  },
  "North": {
    "Garoua": ["Garoua I", "Garoua II", "Garoua III"],
    "Guider": ["Guider Centre"],
  },
  "East": {
    "Bertoua": ["Bertoua I", "Bertoua II"],
    "Batouri": ["Batouri Centre"],
  },
  "South": {
    "Ebolowa": ["Ebolowa I", "Ebolowa II"],
    "Kribi": ["Kribi I", "Kribi II"],
  }
};

interface AuthPageProps {
  onAuthSuccess: (userStats: UserStats) => void;
  onClose: () => void;
}

export default function AuthPage({ onAuthSuccess, onClose }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Common Fields
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up Extra Fields
  const [phone, setPhone] = useState("+237 ");
  const [region, setRegion] = useState<CameroonRegion>("Centre");
  const [city, setCity] = useState("Yaoundé");
  const [townOrArrondissement, setTownOrArrondissement] = useState("Yaoundé VI (Melen)");
  const [neighborhood, setNeighborhood] = useState("Melen");
  const [role, setRole] = useState<any>("Citizen Scientist");
  const [organizationName, setOrganizationName] = useState("");

  // Dynamic values based on selected locations
  const availableCities = Object.keys(CAMEROON_LOCATIONS[region] || {});
  
  useEffect(() => {
    if (availableCities.length > 0) {
      const defaultCity = availableCities[0];
      setCity(defaultCity);
    }
  }, [region]);

  const availableTowns = CAMEROON_LOCATIONS[region]?.[city] || [];
  useEffect(() => {
    if (availableTowns.length > 0) {
      setTownOrArrondissement(availableTowns[0]);
    }
  }, [city, region]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (isSignUp && !fullName) {
      setErrorMsg("Full name is required.");
      return;
    }

    if (isSignUp && role === "NGO Representative" && !organizationName) {
      setErrorMsg("NGO Representatives must provide their organization name.");
      return;
    }

    setIsSyncing(true);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY first.");
      }

      // 1) Authenticate with Supabase Auth
      let authUser: any = null;
      if (isSignUp) {
        // Sign Up: use supabase.auth.signUp({email, password})
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) {
          throw signUpError;
        }
        authUser = signUpData.user;
      } else {
        // Sign In: use supabase.auth.signInWithPassword({ email, password })
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        // Self-healing: if demo credentials are not yet signed up in the user's Supabase instance, register them automatically!
        if (signInError && (email === "awahblaiseatanga@gmail.com" || email === "demo@example.com")) {
          console.warn("Demo account not discovered in Supabase project. Performing automatic demo registration...");
          const { error: autoSignUpError } = await supabase.auth.signUp({
            email,
            password
          });
          if (!autoSignUpError) {
            const retryRes = await supabase.auth.signInWithPassword({ email, password });
            signInData = retryRes.data;
            signInError = retryRes.error;
          }
        }

        if (signInError) {
          throw signInError;
        }
        authUser = signInData.user;
      }

      // 2) If Supabase is successful, synchronize user session / stats with Express backend
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp 
        ? { email, fullName, password, phone, region, city, townOrArrondissement, neighborhood, role, organizationName }
        : { email, password };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccessMsg(isSignUp ? "Ranger badge registered! Syncing ecological system..." : "Ranger identity verified! Syncing terminal stats...");
          
          setTimeout(() => {
            onAuthSuccess(data.userStats);
          }, 1200);
        } else {
          // Fall back gracefully to offline state using the details we have
          throw new Error(data.error || "Profile synchronization failure.");
        }
      } catch (syncErr) {
        console.warn("Express backend sync offline/failed, proceeding with direct Supabase session:", syncErr);
        setSuccessMsg("Authorized with Supabase! Redirecting to dashboard...");
        
        setTimeout(() => {
          const fallbackUser: UserStats = {
            email,
            fullName: fullName || email.split("@")[0] || "Eco Ranger",
            contributionsCount: isSignUp ? 0 : 3,
            verificationsCount: isSignUp ? 0 : 5,
            level: isSignUp ? "Observer" : "Eco Scout",
            xp: isSignUp ? 0 : 140,
            ecoPulseScore: isSignUp ? 50 : 78,
            carbonFootprint: isSignUp ? 140 : 112,
            region,
            city,
            townOrArrondissement,
            neighborhood,
            phone,
            role,
            organizationName: organizationName || undefined
          };
          localStorage.setItem("greenlens_userstats", JSON.stringify(fallbackUser));
          onAuthSuccess(fallbackUser);
        }, 1200);
      }

    } catch (err: any) {
      console.error("Authentication execution error:", err);
      setErrorMsg(err?.message || "Supplied ecological Ranger Keycodes failed validation.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDemoSignIn = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo_secret_2026");
    setIsSignUp(false);
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-xl" id="auth-overlay">
      <div className="min-h-full w-full flex flex-col items-center justify-center p-3 sm:p-6 py-6 sm:py-10 relative">
        
        {/* Absolute Decorative Tech Accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00450d]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Close Button top-right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-200"
          id="close-auth-modal"
        >
          <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>

        {/* Centered Glassmorphic Dynamic Size Card */}
        <div className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/10 to-[#121212]/95 border border-white/10 shadow-2xl p-4 sm:p-6 flex flex-col items-center" id="auth-glass-card">
          
          {/* App Logo */}
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 mb-3 shadow-lg border border-emerald-400/30 animate-pulse">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 fill-emerald-400" />
          </div>

          {/* Brand Names & Subtitle */}
          <h2 className="text-xl sm:text-2xl font-black text-white text-center tracking-tight mb-0.5 font-sans">
            GreenLens Cameroon
          </h2>
          <p className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase text-center mb-4 sm:mb-5">
            Authorized Ecological Ranger Portal
          </p>

        {/* Message / Status banner */}
        {errorMsg && (
          <div className="w-full mb-3 p-3 bg-red-500/10 border border-red-500/35 rounded-xl flex items-start gap-2 text-xs text-red-300 font-medium" id="auth-error-alert">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-3 p-3 bg-emerald-500/15 border border-emerald-500/35 rounded-xl flex items-start gap-2 text-xs text-emerald-300 font-medium" id="auth-success-alert">
            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* Form elements container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5" id="auth-main-form">
          
          {/* Email input field - Common for both */}
          <div className="w-full flex flex-col gap-1">
            <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">Ranger Email Credentials</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
              <input 
                type="email"
                placeholder="ranger@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                required
              />
            </div>
          </div>

          {/* If Sign-Up tab mode, render specific territory profile collection inputs */}
          {isSignUp && (
            <div className="w-full flex flex-col gap-3.5 animate-fadeIn" id="signup-profile-fields">
              
              {/* Full Name field */}
              <div className="w-full flex flex-col gap-1">
                <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
                  <input 
                    type="text"
                    placeholder="e.g. Awah Blaise Atanga"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                    required={isSignUp}
                  />
                </div>
              </div>

              {/* Role Affiliation & Phone Number Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">Affiliation Rank</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold appearance-none"
                    >
                      <option className="bg-zinc-950 text-white text-xs" value="Citizen Scientist">Citizen Scientist</option>
                      <option className="bg-zinc-950 text-white text-xs" value="Eco Scout">Eco Scout / Student</option>
                      <option className="bg-zinc-950 text-white text-xs" value="Community Guardian">Community Vol.</option>
                      <option className="bg-zinc-950 text-white text-xs" value="NGO Representative">NGO Representative</option>
                      <option className="bg-zinc-950 text-white text-xs" value="Environmental Advocate">Advocate</option>
                      <option className="bg-zinc-950 text-white text-xs" value="Green Champion">Green Champion</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">Phone Network</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
                    <input 
                      type="text"
                      placeholder="+237 "
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                    />
                  </div>
                </div>

              </div>

              {/* Conditional NGO organization name query if Representative choice */}
              {role === "NGO Representative" && (
                <div className="w-full flex flex-col gap-1 animate-fadeIn">
                  <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">NGO Organization</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
                    <input 
                      type="text"
                      placeholder="e.g. Association Eco-Cameroon"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                      required={isSignUp && role === "NGO Representative"}
                    />
                  </div>
                </div>
              )}

              {/* Administrative Geography Territory Selection section */}
              <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5" id="geography-selection-card">
                <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-300">Territory Coordinates</span>
                </div>

                <div className="grid grid-cols-2 gap-2" id="territory-level-one-grid">
                  {/* Cameroon Region dropdown */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-bold font-mono text-emerald-300/70 uppercase">Region</label>
                    <select 
                      value={region}
                      onChange={(e) => setRegion(e.target.value as CameroonRegion)}
                      className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-white/10 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    >
                      {Object.keys(CAMEROON_LOCATIONS).map((reg) => (
                        <option className="bg-zinc-900" key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>

                  {/* City dropdown */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-bold font-mono text-emerald-300/70 uppercase">City / Hub</label>
                    <select 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-white/10 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    >
                      {availableCities.map((ct) => (
                        <option className="bg-zinc-900" key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2" id="territory-level-two-grid">
                  {/* Arrondissement dropdown */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-bold font-mono text-emerald-300/70 uppercase">Arrondissement</label>
                    <select 
                      value={townOrArrondissement}
                      onChange={(e) => setTownOrArrondissement(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-zinc-950 border border-white/10 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    >
                      {availableTowns.map((tn) => (
                        <option className="bg-zinc-900" key={tn} value={tn}>{tn}</option>
                      ))}
                    </select>
                  </div>

                  {/* Neighborhood name text input */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-bold font-mono text-emerald-300/70 uppercase">Neighborhood</label>
                    <input 
                      type="text"
                      placeholder="e.g. Melen"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-[11px] rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      required={isSignUp}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Password Input - Common */}
          <div className="w-full flex flex-col gap-1">
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[8px] sm:text-[9px] font-bold font-mono tracking-wider uppercase text-emerald-300/80">Access Keycode</label>
              {!isSignUp && (
                <button type="button" className="text-[8.5px] font-bold font-mono text-emerald-400 hover:underline hover:text-emerald-300 bg-transparent border-0 outline-none select-none cursor-pointer">
                  Reset code?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300/40" />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300/40 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <hr className="opacity-10 border-white my-0.5" />

          {/* Form Action Controls */}
          <div className="flex flex-col gap-2.5">
            
            {/* Main Submit Action */}
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-br from-[#00450d] via-emerald-850 to-emerald-900 border border-emerald-950 text-[#fff] hover:brightness-110 font-bold px-4 py-3 rounded-full shadow-lg transition-all text-xs select-none cursor-pointer active:scale-[0.99] disabled:opacity-50"
              id="auth-submit-btn"
            >
              {isSyncing ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>SYNCHRONIZING PORTAL...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "INITIALIZE RANGER PROFILE" : "VERIFY ENVM-KEY LOGINS"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Google Identity Bypass (Single Sign On demo badge) */}
            <button 
              type="button" 
              onClick={() => handleDemoSignIn("awahblaiseatanga@gmail.com")}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-b from-[#232526] to-[#2d2e30] border border-white/5 rounded-full px-4 py-2.5 font-bold text-white shadow-md hover:brightness-110 transition-all text-[11px] select-none cursor-pointer"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-4 h-4 shrink-0"
              />
              Continue with Google (Demo Bypass)
            </button>

            {/* Toggle Sign-In / Sign-Up Mode selection trigger */}
            <div className="w-full text-center mt-1">
              <span className="text-[11px] text-emerald-100/50">
                {isSignUp ? "Already have an environmental identity? " : "No registered ranger jurisdiction? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="underline text-emerald-300 hover:text-white font-bold transition-all bg-transparent border-none p-0 outline-none select-none cursor-pointer"
                  id="tab-toggle-anchor"
                >
                  {isSignUp ? "Sign In Ranger" : "Get ecological badge!"}
                </button>
              </span>
            </div>

          </div>

        </form>

        {/* Demo trigger badge shortcut */}
        {!isSignUp && (
          <div className="mt-4 w-full pt-3 border-t border-white/10 flex flex-col items-center gap-2" id="demo-shortcut-actions">
            <span className="text-[8px] font-bold font-mono tracking-widest uppercase text-emerald-300/40">Registered Demonstration Identity</span>
            <button
              onClick={() => handleDemoSignIn("awahblaiseatanga@gmail.com")}
              type="button"
              className="text-[10px] w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold px-3 py-2 rounded-xl border border-emerald-400/20 transition-all tracking-wide select-none cursor-pointer text-center"
            >
              Awah Atanga (Lead Ranger)
            </button>
          </div>
        )}

      </div>

      {/* Decorative Ranger count and Cameroon locations avatar stack - hidden on sign up to keep container small */}
      {!isSignUp && (
        <div className="relative z-10 mt-6 flex flex-col items-center text-center max-w-sm hidden sm:flex" id="auth-ranger-social">
          <p className="text-emerald-100/40 text-[11px] mb-2 font-semibold leading-relaxed">
            Join <span className="font-bold text-emerald-400">thousands</span> of ecological stewards protecting rivers across Cameroon.
          </p>
          <div className="flex -space-x-1.5" id="steward-avatar-stack">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="steward"
              className="w-7 h-7 rounded-full border border-black object-cover"
            />
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="steward"
              className="w-7 h-7 rounded-full border border-black object-cover"
            />
            <img
              src="https://randomuser.me/api/portraits/men/54.jpg"
              alt="steward"
              className="w-7 h-7 rounded-full border border-black object-cover"
            />
            <img
              src="https://randomuser.me/api/portraits/women/68.jpg"
              alt="steward"
              className="w-7 h-7 rounded-full border border-black object-cover"
            />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
