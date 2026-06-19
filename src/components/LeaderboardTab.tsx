import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Trophy, Award, Search, User, CheckCircle2 } from "lucide-react";
import { Organization, UserStats } from "../types";

// Types
export interface LeaderboardRankingItem {
  id: string;
  name: string;
  score: number;
  avatarUrl?: string;
  rank: number;
  change?: "up" | "down" | "same";
}

export interface LeaderboardPodiumRanking extends LeaderboardRankingItem {
  rank: 1 | 2 | 3;
}

interface LeaderboardRunOption {
  id: string;
  label: string;
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  fromDate: string | Date;
  toDate: string | Date;
  podiumRankings: LeaderboardPodiumRanking[];
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  runOptions?: LeaderboardRunOption[];
  selectedRunId?: string;
  onRunChange?: (runId: string) => void;
}

// Subcomponents
function LeaderboardPodium({ rankings, className }: { rankings: LeaderboardPodiumRanking[], className?: string }) {
  const first = rankings.find(r => r.rank === 1);
  const second = rankings.find(r => r.rank === 2);
  const third = rankings.find(r => r.rank === 3);

  return (
    <div className={cn("flex flex-row items-end justify-center gap-4 mt-8 pb-4 h-48", className)}>
      {/* 2nd Place */}
      {second && (
        <div className="flex flex-col items-center flex-1">
          <div className="relative mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 overflow-hidden border-2 border-slate-300">
               {second.avatarUrl ? <img src={second.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="h-6 w-6"/>}
            </div>
          </div>
          <span className="text-xs font-semibold text-center mt-1 truncate w-full px-2" title={second.name}>{second.name}</span>
          <span className="text-xs text-gray-500 mb-2">{second.score} pts</span>
          <div className="w-full bg-slate-200 rounded-t-lg h-24 flex items-start justify-center pt-2 relative">
            <span className="font-black text-2xl text-slate-400">2</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {first && (
        <div className="flex flex-col items-center flex-1 -mt-8">
          <div className="relative mb-2">
             <Trophy className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-500" />
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center font-bold text-amber-600 overflow-hidden border-4 border-yellow-400 shadow-md">
               {first.avatarUrl ? <img src={first.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="h-8 w-8"/>}
            </div>
          </div>
          <span className="text-sm font-bold text-center mt-1 truncate w-full px-2 text-gray-900" title={first.name}>{first.name}</span>
          <span className="text-xs font-bold text-primary mb-2">{first.score} pts</span>
          <div className="w-full bg-gradient-to-t from-yellow-300 to-yellow-100 rounded-t-lg h-32 flex items-start justify-center pt-2 relative shadow-[0_-4px_10px_rgba(252,211,77,0.4)]">
            <span className="font-black text-4xl text-yellow-600 drop-shadow-sm">1</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div className="flex flex-col items-center flex-1">
          <div className="relative mb-2">
            <div className="w-12 h-12 bg-amber-900/10 rounded-full flex items-center justify-center font-bold text-amber-700 overflow-hidden border-2 border-amber-600/50">
               {third.avatarUrl ? <img src={third.avatarUrl} alt="" className="w-full h-full object-cover"/> : <User className="h-6 w-6"/>}
            </div>
          </div>
          <span className="text-xs font-semibold text-center mt-1 truncate w-full px-2" title={third.name}>{third.name}</span>
          <span className="text-xs text-gray-500 mb-2">{third.score} pts</span>
          <div className="w-full bg-amber-700/20 rounded-t-lg h-20 flex items-start justify-center pt-2 relative">
            <span className="font-black text-2xl text-amber-800/50">3</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardRankings({ rankings, currentUserId, showPagination, defaultPageSize = 10 }: { rankings: LeaderboardRankingItem[], currentUserId?: string, showPagination?: boolean, defaultPageSize?: number }) {
  const [page, setPage] = useState(1);
  const pageSize = defaultPageSize;
  const totalPages = Math.ceil(rankings.length / pageSize);
  
  const displayedRankings = showPagination 
    ? rankings.slice((page - 1) * pageSize, page * pageSize)
    : rankings;

  return (
    <div className="space-y-2 mt-4">
      {displayedRankings.map((user) => (
        <div key={user.id} className={cn(
          "flex items-center justify-between p-3 rounded-xl border transition-all",
          user.id === currentUserId 
            ? "border-primary bg-emerald-50 shadow-sm" 
            : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
              user.rank === 1 ? "bg-yellow-100 text-yellow-700" :
              user.rank === 2 ? "bg-slate-200 text-slate-700" :
              user.rank === 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"
            )}>
              {user.rank}
            </div>
            {user.avatarUrl ? (
               <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : null}
            <div>
              <div className="font-bold text-sm text-gray-900 text-left">
                {user.name} {user.id === currentUserId && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded ml-1 font-bold">You</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-primary">{user.score} pts</div>
          </div>
        </div>
      ))}
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 pb-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs px-3 py-1 border border-gray-200 rounded text-gray-600 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs px-3 py-1 border border-gray-200 rounded text-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = "Leaderboard",
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      ...props
    },
    ref
  ) => {
    const fromLabel = formatRangeDate(fromDate)
    const toLabel = formatRangeDate(toDate)
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ""
    const hasOnRunChange = Boolean(onRunChange)
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId)

    React.useEffect(() => {
      if (hasOnRunChange) return
      setLocalRunId(resolvedRunId)
    }, [hasOnRunChange, resolvedRunId])

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId

    return (
      <div
        ref={ref}
        className={cn("bg-white rounded-2xl border border-gray-100 p-6 shadow-sm", className)}
        {...props}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-gray-500 text-sm">
              {fromLabel} - {toLabel}
            </p>
          </div>

          {runOptions && runOptions.length > 0 ? (
            <select
              aria-label="Select leaderboard run"
              value={activeRunId}
              onChange={(e) => {
                if (onRunChange) {
                  onRunChange(e.target.value)
                  return
                }
                setLocalRunId(e.target.value)
              }}
              className="bg-white text-gray-900 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {runOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {podiumRankings.length > 0 && (
           <LeaderboardPodium rankings={podiumRankings} className="mb-6" />
        )}

        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
        />
      </div>
    )
  }
)

LeaderboardCard.displayName = "LeaderboardCard"

// The main Tab Component
export default function LeaderboardTab({ organizations, currentUserStats }: { organizations: Organization[], currentUserStats: UserStats | null }) {
  const [activeTab, setActiveTab] = useState<"contributors" | "organizations">("contributors");

  // Mock top contributors data
  const mockContributors = [
    { email: "awahblaiseatanga@gmail.com", fullName: "Awah Blaise", xp: 1250 },
    { email: "john.doe@example.com", fullName: "John Doe", xp: 950 },
    { email: "marie.ndomo@example.com", fullName: "Marie Ndomo", xp: 820 },
    { email: "samuel.t@example.com", fullName: "Samuel T.", xp: 600 },
    { email: "alice.k@example.com", fullName: "Alice K.", xp: 540 },
    { email: "beno.x@example.com", fullName: "Benoit X.", xp: 440 },
    { email: "zara.n@example.com", fullName: "Zara N.", xp: 320 },
    { email: "marc.v@example.com", fullName: "Marc V.", xp: 210 },
  ];

  const sortedContributors = [...mockContributors].sort((a, b) => b.xp - a.xp).map((c, i) => ({
    id: c.email,
    name: c.fullName,
    score: c.xp,
    rank: i + 1,
  }));

  const sortedOrgs = [...organizations].sort((a, b) => b.impactScore - a.impactScore).map((o, i) => ({
    id: o.id,
    name: o.name,
    score: o.impactScore,
    rank: i + 1,
  }));

  const currentRankings = activeTab === "contributors" ? sortedContributors : sortedOrgs;
  const podium = currentRankings.slice(0, 3) as LeaderboardPodiumRanking[];
  const rest = currentRankings.slice(3); // Although LeaderboardRankings can handle all, typically you exclude podium if desired. Wait, no, we can pass all to rankings and it shows them all. Let's pass all to rankings so they see their rank properly in the list.

  return (
    <div className="space-y-6 pt-1 animate-fadeIn pb-24">
      {/* Header section matches other tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Environmental<span className="text-primary block sm:inline sm:ml-2">Hall of Fame</span></h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Recognizing our top citizen heroes and impactful organizations.</p>
        </div>
      </div>

      <div className="flex bg-gray-100/50 rounded-xl p-1 border border-gray-100 max-w-sm">
        <button
          onClick={() => setActiveTab("contributors")}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2",
            activeTab === "contributors" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <User className="h-4 w-4" />
          Contributors
        </button>
        <button
          onClick={() => setActiveTab("organizations")}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2",
            activeTab === "organizations" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Award className="h-4 w-4" />
          Organizations
        </button>
      </div>

      <LeaderboardCard
        title={activeTab === "contributors" ? "Top Individual Contributors" : "Leading Organizations"}
        fromDate={new Date("2024-01-01")} // Mock start of year
        toDate={new Date()} // Current date
        podiumRankings={podium}
        rankings={currentRankings} // passing all rankings, podium included
        currentUserId={currentUserStats?.email}
        runOptions={[
          { id: "all-time", label: "All Time Winners" },
          { id: "this-month", label: "This Month" },
        ]}
      />
    </div>
  );
}
