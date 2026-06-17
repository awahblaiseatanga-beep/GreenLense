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
import { AnimatedDock, DockItemData } from "./ui/animated-dock";

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

  // Map application tabs to AnimatedDock items with active tracking state
  const dockItems: DockItemData[] = tabs.map((tab) => {
    const IconComponent = tab.icon;
    return {
      Icon: <IconComponent className="h-[22px] w-[22px]" />,
      onClick: () => {
        setActiveTab(tab.id);
        setIsExpanded(false);
      },
      label: tab.label,
      isActive: activeTab === tab.id,
    };
  });

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
        width: "min(520px, 94vw)",
        height: "72px",
        borderRadius: "36px",
        background: "rgba(6, 78, 59, 0.98)",
        border: "1px solid rgba(16, 185, 129, 0.45)"
      };
    }
    if (isExpanded) {
      return {
        width: "min(420px, 94vw)",
        height: "72px",
        borderRadius: "36px",
        background: "rgba(10, 12, 11, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.12)"
      };
    }
    // Compact Sizing
    return {
      width: "220px",
      height: "56px",
      borderRadius: "28px",
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
              className="w-full h-full flex items-center justify-between px-6 text-white"
              id="island-alert-container"
            >
              <div className="flex items-center gap-4 truncate pr-2">
                <div className="h-10 w-10 bg-emerald-400/20 border border-emerald-400/30 rounded-full flex items-center justify-center text-[#90d689] shrink-0">
                  <CheckCircle className="h-5 w-5 animate-bounce" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#90d689]">Eco Status Updated</span>
                  <span className="text-sm font-bold text-white leading-tight truncate">
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
                className="text-xs font-black font-mono text-[#90d689] hover:text-white bg-white/10 px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer"
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
              className="w-full h-full flex items-center justify-between px-5 text-white select-none"
              id="compact-island-content"
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <ActiveIcon className="h-5 w-5 text-[#90d689] shrink-0" />
                <span className="text-xs font-black tracking-wider uppercase">
                  {currentTabObj.label}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                <span>Menu</span>
                <ChevronUp className="h-4 w-4 text-gray-500 animate-bounce" />
              </div>
            </motion.div>
          ) : (
            /* Fully Expanded dynamic navigation mode powered by animated dock */
            <motion.div
              key="expanded-navigation-state"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-center"
              id="expanded-navigation-content"
            >
              <AnimatedDock
                className="bg-transparent border-none shadow-none h-full pb-0.5 px-0 w-full gap-2 items-center"
                items={dockItems}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
