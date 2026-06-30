import React, { useState, useMemo } from "react";
import { Report, User } from "../types";
import { 
  Heart, MessageSquare, Share2, AlertOctagon, MapPin, 
  UserCheck, ShieldCheck, CheckCircle2, ChevronDown, Clock, Search
} from "lucide-react";

interface CommunityFeedProps {
  reports: Report[];
  currentUser: User;
  onVerifyReport: (reportId: string) => void;
  isDark: boolean;
}

export default function CommunityFeedView({ reports, currentUser, onVerifyReport, isDark }: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Comments temporary state per report
  const [commentsOpenReportId, setCommentsOpenReportId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [mockComments, setMockComments] = useState<Record<string, Array<{ author: string, text: string, time: string }>>>({
    "pune_rep_1": [
      { author: "Anil Deshmukh", text: "I rode past this yesterday. It is massive indeed, almost hit it! Thanks for reporting.", time: "1 day ago" },
      { author: "Priya Sharma", text: "Verified this physically today, please fix this PMC!", time: "18 hours ago" }
    ],
    "pune_rep_2": [
      { author: "Suresh Kumar", text: "Thousands of liters are leaking here. Called the board but reporting on NagarNetra is much faster.", time: "2 days ago" }
    ]
  });

  const handleAddComment = (reportId: string) => {
    if (!newCommentText.trim()) return;
    setMockComments(prev => ({
      ...prev,
      [reportId]: [
        ...(prev[reportId] || []),
        { author: currentUser.name, text: newCommentText, time: "Just now" }
      ]
    }));
    setNewCommentText("");
  };

  // Filter Tabs: All | Nearby | Critical | Verified | Resolved
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Tab filter
      if (activeTab === "Critical" && r.severityLabel !== "Critical") return false;
      if (activeTab === "Verified" && r.status === "Reported") return false; // anything validated or higher
      if (activeTab === "Resolved" && r.status !== "Resolved") return false;
      if (activeTab === "Nearby" && !r.address.toLowerCase().includes("kothrud") && !r.address.toLowerCase().includes("viman")) {
        // Mocking nearby by checking if it contains some major suburbs
        return false;
      }

      // Search queries
      const matchesSearch = 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.issueType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [reports, activeTab, searchQuery]);

  // Sort: Newest, Most Verified, Highest Severity
  const sortedAndFilteredReports = useMemo(() => {
    const list = [...filteredReports];
    if (sortBy === "Newest") {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "Most Verified") {
      return list.sort((a, b) => b.verificationCount - a.verificationCount);
    } else if (sortBy === "Highest Severity") {
      return list.sort((a, b) => b.severity - a.severity);
    }
    return list;
  }, [filteredReports, sortBy]);

  // Status timeline stages
  const STAGES = ["Reported", "Verified", "Assigned", "In Progress", "Resolved"];

  const getStageIndex = (status: string) => {
    return STAGES.indexOf(status);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-500";
    if (severity >= 5) return "bg-orange-500";
    if (severity >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSeverityBadgeClass = (label: string) => {
    switch (label) {
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900";
      default: return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900";
    }
  };

  const handleShare = (title: string) => {
    alert(`🔗 Share Link Copied! Send this link to prompt nearby citizens to verify: [https://nagarnetra.gov/issue/${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}]`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="community-feed-page">
      
      {/* SEARCH AND NAVIGATION FILTER HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search neighborhood feed, categories, locations..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tab filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" id="feed-tab-filters">
            {["All", "Nearby", "Critical", "Verified", "Resolved"].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setVisibleCount(5); }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="Newest">Newest First</option>
              <option value="Most Verified">Popular Checks</option>
              <option value="Highest Severity">High Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* FEED CARDS LIST */}
      <div className="space-y-6" id="feed-cards-container">
        {sortedAndFilteredReports.slice(0, visibleCount).map((report) => {
          const currentStageIdx = getStageIndex(report.status);
          const isVerifiedByMe = report.verifiedBy?.includes(currentUser.id);
          const comments = mockComments[report.id] || [];
          const isCommentsOpen = commentsOpenReportId === report.id;

          return (
            <div 
              key={report.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
              id={`feed-card-${report.id}`}
            >
              {/* Header: Citizen details */}
              <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <img 
                    src={report.userAvatar} 
                    alt={report.userName} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center">
                      {report.userName}
                      <span className="ml-1.5 text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-1.5 py-0.2 rounded font-medium">
                        {report.userBadge || "Guardian"}
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                      <Clock size={10} className="mr-0.5" />
                      {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    report.status === "Resolved" 
                    ? "bg-emerald-500 text-white" 
                    : report.status === "In Progress" 
                    ? "bg-blue-500 text-white" 
                    : "bg-slate-400 text-white"
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Large Image */}
              <div className="aspect-video w-full overflow-hidden bg-slate-950 relative">
                <img 
                  src={report.imageUrl} 
                  alt={report.title} 
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                
                {/* Float badges over image */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] bg-slate-900/80 text-white backdrop-blur-xs font-bold px-2.5 py-1 rounded-md">
                    {report.issueType}
                  </span>
                  <span className={`text-[10px] backdrop-blur-xs font-bold px-2.5 py-1 rounded-md ${getSeverityBadgeClass(report.severityLabel)}`}>
                    Severity: {report.severityLabel}
                  </span>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Technical specs in flex chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] border-y border-slate-50 dark:border-slate-700 py-2.5">
                  <span className="text-slate-400 font-medium">Department: <strong className="text-slate-700 dark:text-slate-300">{report.department}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-400 font-medium">Scale: <strong className="text-slate-700 dark:text-slate-300">{report.estimatedDimensions}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-400 font-medium">Risk: <strong className="text-orange-600 dark:text-orange-400 font-bold">{report.safetyRisk}</strong></span>
                </div>

                {/* Geolocation Tag */}
                <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-500 shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>

                {/* STATUS TIMELINE PIPELINE */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolution Progress</span>
                  
                  <div className="flex justify-between items-center relative" id="timeline-bar">
                    {/* Background Line */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-700 z-0" />
                    
                    {/* Active Line Fill */}
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-300"
                      style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                    />

                    {/* Nodes */}
                    {STAGES.map((stage, idx) => {
                      const isActive = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div key={stage} className="flex flex-col items-center z-10">
                          <div 
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-200 ${
                              isCurrent 
                              ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20 scale-110" 
                              : isActive 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            }`}
                          >
                            {isActive ? "✓" : idx + 1}
                          </div>
                          <span className={`text-[8px] mt-1 font-semibold ${isCurrent ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SOCIAL ACTION ROW */}
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-3 text-xs">
                  {/* Verify checklist */}
                  {isVerifiedByMe ? (
                    <button 
                      disabled
                      className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900"
                    >
                      <CheckCircle2 size={14} className="animate-pulse" /> Verified by you ({report.verificationCount})
                    </button>
                  ) : (
                    <button 
                      onClick={() => onVerifyReport(report.id)}
                      className="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <UserCheck size={14} /> Verify ({report.verificationCount})
                    </button>
                  )}

                  {/* Comment Toggle */}
                  <button 
                    onClick={() => setCommentsOpenReportId(isCommentsOpen ? null : report.id)}
                    className="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <MessageSquare size={14} /> Comment ({comments.length})
                  </button>

                  {/* Share button */}
                  <button 
                    onClick={() => handleShare(report.title)}
                    className="text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>

              {/* COMMENTS SUB-PANEL */}
              {isCommentsOpen && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-700 space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Community Discussions</span>
                  
                  {/* List of comments */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {comments.map((comm, cIdx) => (
                      <div key={cIdx} className="text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{comm.author}</span>
                          <span className="text-[9px] text-slate-400">{comm.time}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{comm.text}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <span className="text-[11px] text-slate-400 text-center block py-2">No comments yet. Start the conversation!</span>
                    )}
                  </div>

                  {/* Add comment field */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a supportive comment..."
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(report.id)}
                    />
                    <button 
                      onClick={() => handleAddComment(report.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs shrink-0 cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {/* Load More Button */}
        {sortedAndFilteredReports.length > visibleCount && (
          <div className="text-center pt-2">
            <button 
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-5 rounded-full text-xs shadow-xs transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              Load More Feed <ChevronDown size={14} />
            </button>
          </div>
        )}

        {sortedAndFilteredReports.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Clock size={36} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-500">No reports matched your tab/filter.</h4>
          </div>
        )}
      </div>

    </div>
  );
}
