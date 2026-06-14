/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserStats, EcoPulseCheckIn } from "../types";
import { Award, Zap, Navigation, Trash2, Leaf, Shield, CheckCircle2, Flame, Loader, RefreshCw, BarChart, Info } from "lucide-react";
import { ProfileCard } from "./ui/profile-card";
import { QuestionTool, QuestionConfig, QuestionAnswer } from "./ui/question-tool";

const ECO_PULSE_QUESTIONS: QuestionConfig[] = [
  {
    kind: "single",
    allowCustom: true,
    title: "How did you commute today?",
    description: "Your selection of shared or zero-emission travel prevents regional congestion and vehicle soot.",
    customPlaceholder: "Or type your customized transit method...",
    options: [
      { id: "Walking/Biking/Public Transit", label: "Walking, Bicycle, or Public Transit (Bus/Transcam)", description: "+25 Score, -30kg CO₂ potential" },
      { id: "Shared Taxi / Carpooling", label: "Shared Yellow Cab or Carpooling", description: "+15 Score, -0kg CO₂ potential" },
      { id: "Single Occupancy Vehicle", label: "Solo Personal Car or Private Moto Taxi", description: "+0 Score, +0kg CO₂ baseline" }
    ]
  },
  {
    kind: "single",
    allowCustom: true,
    title: "Plastic packaging reduction approach",
    description: "Plastic wrapping discarded in public spaces clogs district gutters, causing major flash floods.",
    customPlaceholder: "Or describe custom plastic-free method...",
    options: [
      { id: "Strict Avoidance", label: "Strict Avoidance (Carried reusable bag)", description: "+15 Score, -20kg CO₂" },
      { id: "Regular Reuse", label: "Regular Reuse (Stored plastic bottles for recycling)", description: "+10 Score, -0kg CO₂" },
      { id: "None / Average Disposal", label: "Normal mixed municipal waste dump", description: "+0 Score, +0kg CO₂" }
    ]
  },
  {
    kind: "single",
    allowCustom: true,
    title: "Eco Separation: Did you isolate organic waste?",
    description: "Separating organic food waste allows clean localized agricultural compost schemes to proceed.",
    customPlaceholder: "Or write other segregation method...",
    options: [
      { id: "yes", label: "Yes, isolated all organic scrap items today", description: "+15 Score, -10kg CO₂" },
      { id: "no", label: "No organic separations practiced today", description: "+0 Score, +0kg CO₂" }
    ]
  },
  {
    kind: "single",
    allowCustom: true,
    title: "Eco Agriculture: Did you compost biodegradable waste?",
    description: "Dumping food in landfills generates methane; feedback compost directly to garden soil.",
    customPlaceholder: "Or specify custom composting action...",
    options: [
      { id: "yes", label: "Yes, composted organic waste back into soil pits", description: "+15 Score, -15kg CO₂" },
      { id: "no", label: "No agricultural backyard soil feeding today", description: "+0 Score, +0kg CO₂" }
    ]
  },
  {
    kind: "single",
    allowCustom: true,
    title: "Active Grid Energy: Did you practice curtailments?",
    description: "Turning off active unused sockets, fluorescent lights, and grids decreases city blackouts.",
    customPlaceholder: "Or specify other curtailment steps...",
    options: [
      { id: "yes", label: "Yes, cutoff active sockets, bulbs, or charging rigs", description: "+10 Score, -15kg CO₂" },
      { id: "no", label: "No energy curtailments setup today" }
    ]
  }
];

interface ProfileTabProps {
  userStats: UserStats;
  onEcoPulseSubmitted: (pulseAnswers: EcoPulseCheckIn) => void;
}

export default function ProfileTab({ userStats, onEcoPulseSubmitted }: ProfileTabProps) {
  const [transportMode, setTransportMode] = useState<string>("Walking/Biking/Public Transit");
  const [wasteSegregation, setWasteSegregation] = useState<any>("no");
  const [organicComposting, setOrganicComposting] = useState<any>("no");
  const [plasticReduction, setPlasticReduction] = useState<string>("Regular Reuse");
  const [energyConserved, setEnergyConserved] = useState<any>("no");
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

  // Dynamic Simulator: Calculates user's prospective eco score as options change
  const getLiveEcoPulseScore = () => {
    let dailyScore = 50;

    // Transport Mode Today
    if (transportMode === "Walking/Biking/Public Transit") dailyScore += 25;
    else if (transportMode === "Shared Taxi / Carpooling") dailyScore += 15;
    else if (transportMode === "Single Occupancy Vehicle") dailyScore += 0;
    else if (transportMode && transportMode.trim().length > 0) dailyScore += 20; // rewarding custom input!

    // Waste Separation
    if (wasteSegregation === true || wasteSegregation === "yes") dailyScore += 15;
    else if (typeof wasteSegregation === "string" && wasteSegregation.trim().length > 0 && wasteSegregation !== "no") dailyScore += 15; // custom action

    // Organic Composting
    if (organicComposting === true || organicComposting === "yes") dailyScore += 15;
    else if (typeof organicComposting === "string" && organicComposting.trim().length > 0 && organicComposting !== "no") dailyScore += 15; // custom action

    // Plasticpackaging approach
    if (plasticReduction === "Strict Avoidance") dailyScore += 15;
    else if (plasticReduction === "Regular Reuse") dailyScore += 10;
    else if (plasticReduction === "None / Average Disposal") dailyScore += 0;
    else if (plasticReduction && plasticReduction.trim().length > 0) dailyScore += 12; // custom action

    // Energy Curtailment
    if (energyConserved === true || energyConserved === "yes") dailyScore += 10;
    else if (typeof energyConserved === "string" && energyConserved.trim().length > 0 && energyConserved !== "no") dailyScore += 10; // custom action

    return Math.min(100, dailyScore);
  };

  const getLiveCarbonFootprint = () => {
    const baseFootprint = 140; // baseline Cameroon citizen per week
    let reduction = 0;

    // Transport
    if (transportMode === "Walking/Biking/Public Transit") reduction += 30;
    else if (transportMode === "Shared Taxi / Carpooling") reduction += 15;
    else if (transportMode && transportMode !== "Single Occupancy Vehicle" && transportMode.trim().length > 0) reduction += 20;

    // Waste Separation
    if (wasteSegregation === true || wasteSegregation === "yes") reduction += 10;
    else if (typeof wasteSegregation === "string" && wasteSegregation.trim().length > 0 && wasteSegregation !== "no") reduction += 10;

    // Organic Composting
    if (organicComposting === true || organicComposting === "yes") reduction += 15;
    else if (typeof organicComposting === "string" && organicComposting.trim().length > 0 && organicComposting !== "no") reduction += 15;

    // Plastic approach
    if (plasticReduction === "Strict Avoidance") reduction += 20;
    else if (plasticReduction === "Regular Reuse") reduction += 10;
    else if (plasticReduction && plasticReduction !== "None / Average Disposal" && plasticReduction.trim().length > 0) reduction += 12;

    // Energy Curtailment
    if (energyConserved === true || energyConserved === "yes") reduction += 15;
    else if (typeof energyConserved === "string" && energyConserved.trim().length > 0 && energyConserved !== "no") reduction += 15;

    return Math.max(25, baseFootprint - reduction);
  };

  const activeLiveScore = getLiveEcoPulseScore();
  const activeLiveCarbon = getLiveCarbonFootprint();

  // Submit daily EcoPulse check-in
  const handlePulseSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleAnswerSubmitted = (answer: QuestionAnswer, index: number) => {
    const selectedValue = answer.selectedIds?.[0] || answer.text;
    if (!selectedValue) return;

    if (index === 1) {
      setTransportMode(selectedValue);
    } else if (index === 2) {
      setPlasticReduction(selectedValue);
    } else if (index === 3) {
      setWasteSegregation(selectedValue === "yes" || (selectedValue !== "no" && typeof selectedValue === "string"));
    } else if (index === 4) {
      setOrganicComposting(selectedValue === "yes" || (selectedValue !== "no" && typeof selectedValue === "string"));
    } else if (index === 5) {
      setEnergyConserved(selectedValue === "yes" || (selectedValue !== "no" && typeof selectedValue === "string"));
    }
  };

  return (
    <div className="space-y-8" id="profile-tab-view">
      
      {/* Dynamic Grid: Profile Card on Left, Digital Credentials & Insights on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="profile-identity-grid">
        {/* Left Column: Adapted High-Polish ProfileCard */}
        <div className="md:col-span-5 lg:col-span-4" id="profile-card-column">
          <ProfileCard
            name={userStats.fullName}
            title={userStats.level}
            avatarUrl=""
            backgroundUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
            likes={userStats.verificationsCount}
            posts={userStats.contributionsCount}
            views={pulseSubmitted ? userStats.ecoPulseScore : activeLiveScore}
            instagramUrl="https://instagram.com/greenlens_cameroon"
            twitterUrl="https://twitter.com/greenlens_cm"
            threadsUrl="https://threads.net/@greenlens_cameroon"
            levelProgress={progressPercent}
            xpText={`Rank Progress: ${userStats.xp} / ${nextTargetXP} XP`}
            roleDescription={currentLevelInfo.desc}
          />
        </div>

        {/* Right Column: Digital Registrar Badge & Carbon Savings Index Panel */}
        <div className="md:col-span-7 lg:col-span-8 bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 lg:p-8 space-y-6 flex flex-col justify-between min-h-[440px]" id="profile-credentials-panel">
          <div className="space-y-5" id="credentials-inner">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4" id="credentials-header">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase block">
                  Official GreenLens Registrar ID
                </span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Ranger Intelligence Hub</h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-mono font-extrabold text-primary uppercase" id="ranger-online-badge">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{pulseSubmitted ? "Stats Synchronized" : "Preview Tracking"}</span>
              </div>
            </div>

            {/* Credential Data Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium" id="credentials-data-grid">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Email Registration</span>
                <span className="text-gray-900 font-bold block truncate">{userStats.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Autonomous ID</span>
                <span className="text-gray-900 font-bold block font-mono">GL-REG-4491-CM</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Territory Coordinates</span>
                <span className="text-gray-900 font-bold block font-mono">Cameroon Autonomous Hubs</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-mono">Ecological Rank Status</span>
                <span className="text-gray-900 font-bold block">{userStats.level} Rank</span>
              </div>
            </div>

            {/* Carbon estimate indicator */}
            <div className="p-4 bg-gradient-to-br from-[#00450d] to-[#011a05] rounded-2xl border border-emerald-800/20 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm" id="weekly-carbon-card">
              <div className="space-y-1" id="carbon-lead-text">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] font-extrabold uppercase tracking-widest">
                  <Leaf className="h-4 w-4 shrink-0" />
                  <span>Carbon Mitigation Level</span>
                </div>
                <h4 className="text-sm font-extrabold text-white animate-pulse">Dynamic footprint estimation metrics</h4>
                <p className="text-xs text-emerald-100/75 leading-relaxed max-w-sm">
                  Your logged activities contribute to offset emissions across Cameroon capital districts.
                </p>
              </div>
              <div className="text-center sm:text-right shrink-0 bg-[#002607] p-4 rounded-xl border border-emerald-800/30 min-w-[145px]" id="carbon-display-badge">
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest font-mono block">Weekly CO₂</span>
                <span className="text-3xl font-black text-white font-mono block leading-none pt-1">
                  -{pulseSubmitted ? userStats.carbonFootprint : activeLiveCarbon}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wide font-mono block">kg emissions</span>
              </div>
            </div>
          </div>

          {/* Level status next task banner */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-3 font-medium shadow-inner" id="ranger-next-rank-prompt">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-800 block">XP Accomplishment Goal</span>
                <span className="text-gray-700 leading-tight block">
                  Accumulate <span className="text-[#00450d] font-bold font-mono">{nextTargetXP - userStats.xp} more XP</span> to trigger verification authority upgrades.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered 30-Second EcoPulse Check-In Widget */}
      <div className="max-w-2xl mx-auto w-full" id="ecopulse-outer-grid">
        <QuestionTool
          questions={ECO_PULSE_QUESTIONS}
          onSubmitAnswer={handleAnswerSubmitted}
          isSyncing={isSyncing}
          onFinalSubmit={() => handlePulseSubmit()}
          className="w-full"
        />
      </div>
    </div>
  );
}
