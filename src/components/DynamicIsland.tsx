/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Camera, 
  ShieldCheck, 
  BarChart3, 
  User, 
  ChevronUp,
  CheckCircle
} from "lucide-react";
import { UserStats } from "../types";

type TabId = "explore" | "contribute" | "impact" | "insights" | "profile";

interface DynamicIslandProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  userStats: UserStats | null;
  isOfflineMode: boolean;
  successFlashMessage: string;
  onClearFlashMessage: () => void;
}

export default function DynamicIsland({
  activeTab,
  setActiveTab,
  userStats,
  isOfflineMode,
  successFlashMessage,
  onClearFlashMessage
}: DynamicIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);

  // Monitor success flash notifications to trigger temporary expanded status alert
  useEffect(() => {
    if (successFlashMessage) {
      setActiveNotification(successFlashMessage);
      const timer = setTimeout(() => {
        setActiveNotification(null);
        onClearFlashMessage();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successFlashMessage, onClearFlashMessage]);

  // Click outside to collapse the expanded island navigation options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabs = [
    { id: "explore" as TabId, label: "Explore", icon: Compass },
    { id: "contribute" as TabId, label: "Contribute", icon: Camera },
    { id: "impact" as TabId, label: "Impact", icon: ShieldCheck },
    { id: "insights" as TabId, label: "Insights", icon: BarChart3 },
    { id: "profile" as TabId, label: "Profile", icon: User },
  ];

  // Current active configuration
  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveIcon = currentTabObj.icon;

  // Delightful, ultra-snappy, and organic physics-based spring transitions (modeled after professional iOS fluid kinetics)
  const springTransition = {
    type: "spring",
    stiffness: 580,
    damping: 32,
    mass: 0.6,
  };

  const getIslandDimensions = () => {
    if (activeNotification) {
      return {
        width: "min(480px, 94vw)",
        height: "64px",
        borderRadius: "32px",
        background: "rgba(6, 78, 59, 0.98)",
        border: "1px solid rgba(16, 185, 129, 0.45)"
      };
    }
    if (isExpanded) {
      return {
        width: "min(440px, 94vw)",
        height: "58px",
        borderRadius: "29px",
        background: "rgba(13, 16, 15, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.14)"
      };
    }
    // Compact Sizing
    return {
      width: "165px",
      height: "44px",
      borderRadius: "22px",
      background: "rgba(10, 12, 11, 0.98)",
      border: "1px solid rgba(255, 255, 255, 0.08)"
    };
  };

  const dims = getIslandDimensions();

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center justify-end w-full px-4 mb-2 md:mb-0"
      id="dynamic-island-wrapper"
    >
      <motion.div
        ref={islandRef}
        key="island-container"
        layout
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ 
          y: 0, 
          opacity: 1, 
          scale: 1,
          width: dims.width,
          height: dims.height,
          borderRadius: dims.borderRadius,
          background: dims.background,
          border: dims.border
        }}
        transition={springTransition}
        className="pointer-events-auto relative shadow-[0_25px_60px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.04)] backdrop-blur-xl flex flex-col justify-center overflow-hidden cursor-pointer selection:bg-transparent"
        id="interactive-island"
        onClick={() => {
          if (!isExpanded && !activeNotification) {
            setIsExpanded(true);
          }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {activeNotification ? (
            /* Notification State */
            <motion.div
              key="alert-state"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.16 }}
              className="w-full h-full flex items-center justify-between px-5 text-white"
              id="island-alert-container"
            >
              <div className="flex items-center gap-3 truncate pr-2">
                <div className="h-8 w-8 bg-emerald-400/20 border border-emerald-400/30 rounded-full flex items-center justify-center text-[#90d689] shrink-0">
                  <CheckCircle className="h-4.5 w-4.5 animate-bounce" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#90d689]">Eco Status Updated</span>
                  <span className="text-[11px] font-bold text-white leading-tight truncate">
                    {activeNotification}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNotification(null);
                  onClearFlashMessage();
                }}
                className="text-[10px] font-black font-mono text-[#90d689] hover:text-white bg-white/10 px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer"
                id="island-alert-dismiss"
              >
                OK
              </button>
            </motion.div>
          ) : !isExpanded ? (
            /* Compact Action trigger state */
            <motion.div
              key="compact-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              className="w-full h-full flex items-center justify-between px-4.5 text-white select-none"
              id="compact-island-content"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <ActiveIcon className="h-4 w-4 text-[#90d689] shrink-0" />
                <span className="text-[11px] font-black tracking-wider uppercase">
                  {currentTabObj.label}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                <span>Menu</span>
                <ChevronUp className="h-3.5 w-3.5 text-gray-500 animate-bounce" />
              </div>
            </motion.div>
          ) : (
            /* Fully Expanded dynamic navigation mode */
            <motion.div
              key="expanded-navigation-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-between px-2 text-white"
              id="expanded-navigation-content"
            >
              <div className="flex items-center justify-between w-full h-full px-1" id="island-tabs-inner">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(tab.id);
                        // Morph back into the elegant compact pill upon clicking
                        setIsExpanded(false);
                      }}
                      className="relative h-11 px-1 flex flex-col items-center justify-center flex-1 group cursor-pointer"
                      id={`island-direct-tab-${tab.id}`}
                    >
                      {/* Bouncy active tab highlights slides across menu options */}
                      {isActive && (
                        <motion.div
                          layoutId="island-nav-highlighter"
                          transition={springTransition}
                          className="absolute inset-x-0.5 inset-y-1 bg-white/10 border border-white/12 rounded-full z-0 pointer-events-none"
                        />
                      )}
                      
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                          isActive 
                            ? "text-[#90d689] scale-110" 
                            : "text-gray-400 group-hover:text-white group-hover:scale-105"
                        }`} />
                        <span className={`text-[9px] font-extrabold tracking-tight mt-0.5 transition-colors ${
                          isActive 
                            ? "text-[#90d689]" 
                            : "text-gray-500 group-hover:text-white"
                        }`}>
                          {tab.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
