import React, { useState, useMemo } from "react";
import { Report, User } from "../types";
import { 
  Folder, Calendar, CheckCircle2, Loader2, MapPin, 
  ChevronDown, ChevronUp, AlertCircle, ShieldAlert, Award
} from "lucide-react";

interface MyReportsProps {
  currentUser: User;
  reports: Report[];
  isDark: boolean;
}

export default function MyReportsView({ currentUser, reports, isDark }: MyReportsProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Filter reports to only contain CURRENT USER reports
  const myReports = useMemo(() => {
    return reports.filter(r => r.userId === currentUser.id);
  }, [reports, currentUser]);

  // Filters: All | Active (Reported, Verified, In Progress, Assigned) | Resolved | Escalated (Critical severity and unresolved)
  const filteredMyReports = useMemo(() => {
    return myReports.filter(r => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Resolved") return r.status === "Resolved";
      if (activeFilter === "Active") return r.status !== "Resolved";
      if (activeFilter === "Escalated") return r.severity >= 8 && r.status !== "Resolved";
      return true;
    });
  }, [myReports, activeFilter]);

  const STAGES = ["Reported", "Verified", "Assigned", "In Progress", "Resolved"];

  const getStageIndex = (status: string) => {
    return STAGES.indexOf(status);
  };

  const getSeverityBadgeClass = (label: string) => {
    switch (label) {
      case "Critical": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900";
      case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900";
      default: return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-500 text-white";
      case "In Progress": return "bg-blue-500 text-white animate-pulse";
      case "Assigned": return "bg-indigo-500 text-white";
      case "Verified": return "bg-teal-500 text-white";
      default: return "bg-slate-400 text-white";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="my-reports-page">
      
      {/* PAGE INTRO ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
            <Folder className="text-blue-600 dark:text-blue-400 mr-2" />
            My Submitted Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active resolution status, department handovers, and milestone dates for your logs.
          </p>
        </div>
        
        {/* Count badge */}
        <span className="text-xs bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full font-bold self-start sm:self-auto shrink-0">
          {myReports.length} Submitted Logs
        </span>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" id="my-reports-tab-filters">
        {["All", "Active", "Resolved", "Escalated"].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveFilter(tab); setExpandedReportId(null); }}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeFilter === tab 
              ? "bg-blue-600 text-white shadow-xs" 
              : "bg-white border border-slate-150 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            }`}
          >
            {tab} Reports
          </button>
        ))}
      </div>

      {/* REPORTS VERTICAL CARDS */}
      <div className="space-y-4" id="my-reports-list-container">
        {filteredMyReports.map((report) => {
          const isExpanded = expandedReportId === report.id;
          const currentStageIdx = getStageIndex(report.status);

          return (
            <div 
              key={report.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden"
              id={`my-card-${report.id}`}
            >
              {/* Card Header Row */}
              <div 
                onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                className="p-4 flex items-start gap-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/20 select-none transition-colors"
              >
                <img 
                  src={report.imageUrl} 
                  alt={report.title} 
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100 dark:border-slate-700"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] bg-blue-50 text-blue-600 dark:bg-slate-900 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold uppercase">
                      {report.issueType}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${getSeverityBadgeClass(report.severityLabel)}`}>
                      {report.severityLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">
                    {report.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Calendar size={11} className="mr-0.5" />
                    Filed on {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {/* Expandable Lifecycle Detail Panel */}
              {isExpanded && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-fade-in">
                  
                  {/* Detailed Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-700">
                      {report.description}
                    </p>
                  </div>

                  {/* Dynamic checklist details */}
                  <div className="grid grid-cols-2 gap-3 text-[11px]" id="specs-grid">
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Resolution Department:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">{report.department}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Estimated Proportions:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">{report.estimatedDimensions}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Safety Hazard Level:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400 block">{report.safetyRisk}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700">
                      <span className="text-slate-400 block font-medium">Location Coordinate:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700 col-span-2 flex items-start gap-1.5">
                      <MapPin size={13} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block font-medium">Complete Physical Address:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 leading-normal">{report.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE PIPELINE CHECKPOINT */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Log Progression Pipeline</span>
                    
                    <div className="flex justify-between items-center relative" id="prog-pipeline">
                      {/* Line background */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-150 dark:bg-slate-700 z-0" />
                      {/* Active fill */}
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0"
                        style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                      />

                      {/* Timeline Node steps */}
                      {STAGES.map((stage, idx) => {
                        const isActive = idx <= currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div key={stage} className="flex flex-col items-center z-10">
                            <div 
                              className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
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

                  {/* Support Contact / Next action message */}
                  <div className="bg-blue-50/50 dark:bg-slate-900 p-3 rounded-xl border border-blue-100/50 dark:border-slate-800 text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      {report.status === "Reported" && "Awaiting verification checks from neighboring platform members."}
                      {report.status === "Verified" && "The log has reached 3 active verifications. Ward Engineers are allocating a dispatch team."}
                      {report.status === "Assigned" && "Handed over to municipal division. standby personnel scheduled."}
                      {report.status === "In Progress" && "Active maintenance crew has reached coordinates. Excavating site."}
                      {report.status === "Resolved" && "Resolution complete. Site cleared. Award points allocated to your personal profile."}
                    </span>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {filteredMyReports.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <AlertCircle size={36} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-500">No logs found under this filter.</h4>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto mt-1">
              Submit a report on the **Report Issue** page to populate your records.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
