"use client";

import { useState, useEffect } from "react";
import { Instagram, Twitter, Award, Check } from "lucide-react";

interface ProfileCardProps {
  name?: string;
  title?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  likes?: number;
  posts?: number;
  views?: number;
  instagramUrl?: string;
  twitterUrl?: string;
  threadsUrl?: string;
  // Extensible fields to seamlessly bind the app's user stats
  levelProgress?: number;
  xpText?: string;
  roleDescription?: string;
  isCustomTheme?: boolean;
}

export function ProfileCard({
  name = "Bhomik Chauhan",
  title = "Product Designer who focuses on simplicity & usability.",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  backgroundUrl = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
  likes = 72900,
  posts = 828,
  views = 342900,
  instagramUrl = "https://instagram.com/bhomikchauhan",
  twitterUrl = "https://twitter.com/bhomikchauhan",
  threadsUrl = "https://threads.net/@bhomikchauhan",
  levelProgress = 65,
  xpText = "Level Progress",
  roleDescription = "Initial environmental registrar capturing local anomalies.",
  isCustomTheme = true,
}: ProfileCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [expProgress, setExpProgress] = useState(0);
  const [animatedLikes, setAnimatedLikes] = useState(0);
  const [animatedPosts, setAnimatedPosts] = useState(0);
  const [animatedViews, setAnimatedViews] = useState(0);

  // Animate experience bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setExpProgress((prev) => {
          if (prev >= levelProgress) {
            clearInterval(interval);
            return levelProgress;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [levelProgress]);

  // Animate counters
  useEffect(() => {
    const duration = 1500;
    const steps = 50;
    const stepDuration = duration / steps;

    const likesIncrement = likes / steps;
    const postsIncrement = posts / steps;
    const viewsIncrement = views / steps;

    let currentStep = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedLikes(Math.min(Math.floor(likesIncrement * currentStep), likes));
        setAnimatedPosts(Math.min(Math.floor(postsIncrement * currentStep), posts));
        setAnimatedViews(Math.min(Math.floor(viewsIncrement * currentStep), views));

        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(timer);
  }, [likes, posts, views]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="w-full max-w-sm mx-auto" id="profile-card-ui-wrapper">
      <div className="bg-white rounded-[2rem] border border-gray-200/80 shadow-[0_16px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Header with background */}
        <div className="relative h-44 bg-gradient-to-br from-primary via-[#043310] to-[#011405] overflow-hidden" id="profile-card-cover">
          <img
            src={backgroundUrl}
            alt="Background Horizon"
            className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#043310]/80 via-transparent to-transparent pointer-events-none" />

          {/* Follow/Status button */}
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            type="button"
            className={`absolute top-4 right-4 rounded-full px-5 py-2 text-xs font-bold font-mono tracking-wider uppercase transition-all duration-300 shadow-sm cursor-pointer border ${
              isFollowing
                ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-emerald-500/30"
                : "bg-white hover:bg-gray-100 text-primary border-transparent"
            }`}
            id="profile-card-action-btn"
          >
            <span className="flex items-center gap-1">
              <span>{isFollowing ? "Active" : "Monitor"}</span>
              <span className="text-sm font-bold leading-none">{isFollowing ? <Check className="h-3 w-3 shrink-0" /> : "+"}</span>
            </span>
          </button>
        </div>

        {/* Profile content */}
        <div className="px-6 pb-6 -mt-14 relative z-10">
          
          {/* Avatar frame */}
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center" id="profile-card-avatar-container">
            <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-emerald-50 shadow-md">
              {avatarUrl && !avatarUrl.includes("caarton") ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-2xl font-black font-mono">
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
              )}
            </div>
            {/* Intel mini-badge */}
            <div className="absolute bottom-1 right-1 bg-amber-500 text-white p-1.5 rounded-full border border-white shadow-sm" title="Verified Ambassador">
              <Award className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          {/* Experience level custom progression slider */}
          <div className="mb-5" id="profile-card-exp-bar">
            <div className="flex flex-col gap-1.5 mb-1">
              <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                <span className="text-gray-400 font-bold uppercase tracking-wider">{xpText}</span>
                <span className="text-primary font-black font-mono">{Math.round(expProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                <div
                  className="h-full bg-gradient-to-r from-primary via-primary-light to-emerald-400 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Name and title/roles */}
          <div className="space-y-1.5 mb-5" id="profile-card-identifiers">
            <h2 className="text-xl font-extrabold text-gray-950 tracking-tight leading-tight flex items-center gap-1.5">
              <span>{name}</span>
            </h2>
            <div className="inline-block px-2.5 py-1 bg-emerald-50 text-[10px] font-bold text-[#1b6d24] rounded-md font-mono border border-emerald-100 uppercase tracking-tight">
              {title}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-normal min-h-[32px]">
              {roleDescription}
            </p>
          </div>

          {/* Stats Grid mapped to actual green lens activities */}
          <div className="grid grid-cols-3 gap-3 mb-5 py-4 border-t border-b border-gray-100" id="profile-card-metrics">
            <div className="text-center">
              <div className="text-lg font-black text-gray-900 font-mono tracking-tight">{formatNumber(animatedPosts)}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Reports</div>
            </div>
            <div className="text-center border-l border-r border-gray-100">
              <div className="text-lg font-black text-primary font-mono tracking-tight">{animatedLikes}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Audits</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-700 font-mono tracking-tight">{animatedViews}/100</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Pulse Index</div>
            </div>
          </div>

          {/* Social connections focused on local community channels */}
          <div className="flex justify-center items-center gap-3 pt-4 border-t border-gray-100/80" id="profile-card-social-links">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 flex items-center justify-center bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition-all duration-300 border border-gray-150/80 hover:border-pink-200 hover:shadow-sm"
              aria-label="Instagram Environmental Feed"
              title="Instagram Community Feed"
            >
              <div className="flex items-center gap-1">
                <Instagram className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Insta</span>
              </div>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 flex items-center justify-center bg-gray-50 hover:bg-sky-50 text-gray-400 hover:text-sky-500 rounded-xl transition-all duration-300 border border-gray-150/80 hover:border-sky-200 hover:shadow-sm"
              aria-label="Twitter News Desk"
              title="Twitter Local Alerts"
            >
              <div className="flex items-center gap-1">
                <Twitter className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Twitter</span>
              </div>
            </a>
            <a
              href={threadsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-primary rounded-xl transition-all duration-300 border border-gray-150/80 hover:border-emerald-200 hover:shadow-sm"
              aria-label="National Green Registry"
              title="Green Registry"
            >
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 fill-none stroke-current"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Registry</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
