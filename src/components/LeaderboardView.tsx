import React, { useMemo } from "react";
import { User } from "../types";
import { Award, Trophy, Star, Shield, Zap, Sparkles, UserCheck, CheckCircle } from "lucide-react";

interface LeaderboardProps {
  currentUser: User;
  contributors: User[];
  isDark: boolean;
}

export default function LeaderboardView({ currentUser, contributors, isDark }: LeaderboardProps) {
  // Badges catalog
  const BADGES = [
    {
      id: "First Step",
      name: "First Step",
      description: "Submitted your first civic report.",
      color: "from-blue-500 to-indigo-600",
      icon: <Zap size={20} className="text-white" />,
      requirement: "1 Report filed"
    },
    {
      id: "Eagle Eye",
      name: "Eagle Eye",
      description: "Verified 5 active community reports.",
      color: "from-emerald-500 to-teal-600",
      icon: <Star size={20} className="text-white" />,
      requirement: "5 Verifications submitted"
    },
    {
      id: "Neighborhood Guardian",
      name: "Neighborhood Guardian",
      description: "Completed 10 active verifications.",
      color: "from-purple-500 to-indigo-700",
      icon: <Shield size={20} className="text-white" />,
      requirement: "10 Verifications submitted"
    },
    {
      id: "Change Maker",
      name: "Change Maker",
      description: "Got 3 of your filed reports resolved.",
      color: "from-amber-500 to-orange-600",
      icon: <Award size={20} className="text-white" />,
      requirement: "3 Reports resolved"
    },
    {
      id: "Ward Champion",
      name: "Ward Champion",
      description: "The top monthly contributor for your sector.",
      color: "from-red-500 to-rose-600",
      icon: <Trophy size={20} className="text-white" />,
      requirement: "Rank #1 in Sector"
    },
    {
      id: "AI Ally",
      name: "AI Ally",
      description: "Report details exactly matched predictive AI hotspots.",
      color: "from-teal-400 to-cyan-600",
      icon: <Sparkles size={20} className="text-white" />,
      requirement: "AI Prediction Alignment"
    }
  ];

  // Merge current user with list if not exists, and sort
  const sortedLeaderboard = useMemo(() => {
    const list = [...contributors];
    const hasMe = list.some(u => u.id === currentUser.id);
    if (!hasMe) {
      list.push(currentUser);
    }
    // Update current user points dynamically in list if she is present
    const meIndex = list.findIndex(u => u.id === currentUser.id);
    if (meIndex > -1) {
      list[meIndex] = currentUser;
    }
    return list.sort((a, b) => b.points - a.points);
  }, [contributors, currentUser]);

  return (
    <div className="space-y-6" id="leaderboard-page">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-yellow-950/10 to-amber-950/10 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-yellow-200/50 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
            <Trophy className="text-yellow-600 dark:text-yellow-400 mr-2" />
            Civic Leaders & Gamification
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Earn points by filing high-fidelity reports, completing peer-verifications, and helping municipal engineers!
          </p>
        </div>
        <div className="text-xs bg-yellow-50 text-yellow-700 dark:bg-slate-800 dark:text-yellow-400 px-3.5 py-1.5 rounded-full font-bold flex items-center shrink-0">
          🏆 Season 3: Active
        </div>
      </div>

      {/* TOP THREE PODIUM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2" id="podium-grid">
        {sortedLeaderboard.slice(0, 3).map((leader, index) => {
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
          const border = index === 0 
            ? "border-yellow-400 ring-4 ring-yellow-400/10" 
            : index === 1 
            ? "border-slate-300" 
            : "border-amber-600";
          
          return (
            <div 
              key={leader.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border text-center space-y-3 relative overflow-hidden flex flex-col justify-between ${border}`}
            >
              <div className="absolute top-2 right-2 text-2xl">{medal}</div>
              
              <div className="space-y-2">
                <img 
                  src={leader.avatar} 
                  alt={leader.name} 
                  className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-blue-500/10"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{leader.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{leader.badges[0] || "Guardian"}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-1 text-[11px] mt-2">
                <div>
                  <span className="text-slate-400 block font-medium">Filed</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{leader.reportCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Checks</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{leader.verificationCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Trust</span>
                  <span className="font-bold text-emerald-600">{leader.trustScore}%</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{leader.points} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* LEADERBOARD TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden" id="leaderboard-table-sec">
        <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 p-4 border-b border-slate-100 dark:border-slate-700">
          Rankings Standings
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Citizen</th>
                <th className="py-3 px-4">Honor Badge</th>
                <th className="py-3 px-4 text-center">Reports Filed</th>
                <th className="py-3 px-4 text-center">Verifications Done</th>
                <th className="py-3 px-4 text-center">Trust Score</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedLeaderboard.map((user, idx) => {
                const isMe = user.id === currentUser.id;
                return (
                  <tr 
                    key={user.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/10 ${
                      isMe ? "bg-blue-50/40 dark:bg-blue-950/20 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-500">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 font-bold block">{user.name} {isMe && "(You)"}</span>
                        <span className="text-[10px] text-slate-400 block">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                        {user.badges[0] || "Citizen"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-350">{user.reportCount}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-350">{user.verificationCount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{user.trustScore}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-600 dark:text-blue-400">{user.points} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MIDDLE SECTION - BADGES GALLERY */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs" id="badges-gallery-sec">
        <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-4 flex items-center">
          <Award size={18} className="text-blue-500 mr-2" />
          NagarNetra Badges & Achievements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-grid">
          {BADGES.map((badge) => {
            const isEarned = currentUser.badges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-200 ${
                  isEarned 
                  ? "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-xs hover:shadow-md" 
                  : "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-60"
                }`}
              >
                {/* Icon blob */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isEarned ? `bg-gradient-to-br ${badge.color}` : "bg-slate-300 dark:bg-slate-800 text-slate-400"
                }`}>
                  {badge.icon}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-bold ${isEarned ? "text-slate-800 dark:text-slate-150" : "text-slate-400"}`}>
                      {badge.name}
                    </h4>
                    {isEarned && (
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-md uppercase">
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{badge.description}</p>
                  <span className="text-[9px] text-slate-400 font-bold block pt-1">Condition: {badge.requirement}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION - PERSONAL IMPACT CARD */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6" id="personal-impact-sec">
        <div className="space-y-3.5 flex-1 text-center md:text-left">
          <div className="space-y-1">
            <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest block">Your National Civic Impact</span>
            <h3 className="text-lg font-bold font-display leading-tight">Neighborhood Security Guardian Level</h3>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed max-w-xl">
            "Your <strong>{currentUser.reportCount} filed reports</strong> and <strong>{currentUser.verificationCount} verified peer checks</strong> have helped direct municipal operations to clear potholes and secure darkened paths, directly assisting an estimated <strong>420 neighboring residents</strong>. Keep netra active, the community is grateful!"
          </p>
        </div>

        {/* Stats bubbles */}
        <div className="flex gap-4 shrink-0">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[70px]">
            <span className="text-lg font-black text-white block">{currentUser.reportCount}</span>
            <span className="text-[9px] text-indigo-200 block">Reports</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[70px]">
            <span className="text-lg font-black text-white block">{currentUser.verificationCount}</span>
            <span className="text-[9px] text-indigo-200 block">Checks</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center min-w-[70px]">
            <span className="text-lg font-black text-white block">3</span>
            <span className="text-[9px] text-indigo-200 block">Resolved</span>
          </div>
        </div>
      </div>

    </div>
  );
}
