import React, { useMemo, useState } from "react";
import { Report, User } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";
import { 
  AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowUpRight, 
  MapPin, Award, ArrowRight, UserCheck
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface DashboardProps {
  reports: Report[];
  contributors: User[];
  onNavigate: (page: string) => void;
  onSelectReport: (report: Report) => void;
  isDark: boolean;
}

export default function DashboardView({ reports, contributors, onNavigate, onSelectReport, isDark }: DashboardProps) {
  // ━━━ CALCULATIONS FROM ACTIVE REPORTS ━━━
  const stats = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === "Resolved").length;
    const pending = reports.filter(r => r.status === "Reported" || r.status === "Verified").length;
    const critical = reports.filter(r => r.severity >= 8 && r.status !== "Resolved").length;
    
    // Percent change comparison mock
    const pctChange = "+12.4%";

    return { total, resolved, pending, critical, pctChange };
  }, [reports]);

  // Chart 1 Data: Issues by Category
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {
      "Pothole": 0,
      "Water Leak": 0,
      "Broken Streetlight": 0,
      "Garbage Dump": 0,
      "Drainage Issue": 0,
      "Other": 0
    };

    reports.forEach(r => {
      let type = r.issueType;
      if (type === "Damaged Road") type = "Pothole"; // group similar for chart
      if (type === "Fallen Tree" || type === "Open Manhole" || type === "Illegal Construction") {
        type = "Other";
      }
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts["Other"]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  // Chart 2 Data: Reports Over Time (last 6 months trend)
  const trendsChartData = [
    { month: "Jan", Reported: 12, Resolved: 8 },
    { month: "Feb", Reported: 18, Resolved: 14 },
    { month: "Mar", Reported: 25, Resolved: 19 },
    { month: "Apr", Reported: 22, Resolved: 21 },
    { month: "May", Reported: 31, Resolved: 26 },
    { month: "Jun", Reported: reports.length, Resolved: reports.filter(r => r.status === "Resolved").length }
  ];

  // Get 5 most recent reports
  const recentReports = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [reports]);

  // Helper for severity color badges
  const getSeverityBadgeClass = (level: string) => {
    switch (level) {
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
    <div className="space-y-6" id="dashboard-container">
      {/* ━━━ ROW 1: STAT CARDS ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
        {/* Total Reports */}
        <div 
          onClick={() => onNavigate("Community Feed")}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="stat-total"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Reports</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" />
                {stats.pctChange}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Weekly incoming volume</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Resolved */}
        <div 
          onClick={() => onNavigate("My Reports")}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="stat-resolved"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved Issues</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% success rate
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Closed by civic departments</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Pending */}
        <div 
          onClick={() => onNavigate("Community Feed")}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="stat-pending"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active / Pending</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</span>
              <span className="text-xs text-slate-400">Awaiting validation/dispatch</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Under active community review</span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/40 p-3 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200">
            <Clock size={24} />
          </div>
        </div>

        {/* Critical */}
        <div 
          onClick={() => onNavigate("Issues Map")}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="stat-critical"
        >
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical Hazards</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.critical}</span>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Requires Urgent Fix</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Severity level &gt;= 8/10</span>
          </div>
          <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* ━━━ ROW 2: CHARTS ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-grid">
        {/* LEFT: Issues by Category */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs" id="chart-categories">
          <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200 mb-4">Issues by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? "#1e293b" : "#ffffff", 
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a"
                  }} 
                />
                <Bar dataKey="value" fill="#1565C0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Reports Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs" id="chart-trends">
          <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200 mb-4">Reports Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="month" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? "#1e293b" : "#ffffff", 
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Reported" stroke="#1565C0" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Resolved" stroke="#2E7D32" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ━━━ ROW 3: RECENT & LEADERS ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="tables-grid">
        {/* LEFT: Recent Reports */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between" id="recent-reports-sec">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200">Recent Community Reports</h3>
              <button 
                onClick={() => onNavigate("Community Feed")}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center hover:underline"
              >
                View all feed <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700" id="recent-reports-list">
              {recentReports.map(report => (
                <div 
                  key={report.id} 
                  onClick={() => onSelectReport(report)}
                  className="py-3.5 flex items-start gap-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-lg transition-colors"
                >
                  <img 
                    src={report.imageUrl} 
                    alt={report.title} 
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{report.title}</h4>
                    <p className="text-xs text-slate-400 truncate mb-1.5">{report.address}</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {report.issueType}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getSeverityBadgeClass(report.severityLabel)}`}>
                        {report.severityLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-12">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadgeClass(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <UserCheck size={11} className="mr-0.5 text-blue-500" /> {report.verificationCount} checks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Top Contributors */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between" id="top-contributors-sec">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200">Top Local Guardians</h3>
              <button 
                onClick={() => onNavigate("Leaderboard")}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center hover:underline"
              >
                View board <ArrowRight size={14} className="ml-1" />
              </button>
            </div>

            <div className="space-y-3.5" id="mini-leaderboard">
              {contributors.slice(0, 5).map((user, idx) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div className="text-sm font-bold text-slate-400 w-5 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </div>
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</h4>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-medium rounded">
                        {user.badges[0] || "Citizen"}
                      </span>
                      <span className="text-[10px] text-slate-400">• {user.reportCount} Filed • {user.verificationCount} Checked</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{user.points} pts</div>
                    <span className="text-[10px] text-slate-400 flex items-center justify-end">
                      <Award size={11} className="mr-0.5 text-yellow-500" /> Trust: {user.trustScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ ROW 4: MAP PREVIEW ━━━ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs" id="map-preview-sec">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200 flex items-center">
              <MapPin size={20} className="text-blue-600 dark:text-blue-400 mr-1.5" />
              Live Civic Issue Map
            </h3>
            <p className="text-xs text-slate-400">Showing active pinned civic issues across India.</p>
          </div>
          <button 
            onClick={() => onNavigate("Issues Map")}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3.5 rounded-lg flex items-center transition-all duration-200 shadow-sm"
          >
            Launch Full Screen Map <ArrowRight size={14} className="ml-1.5" />
          </button>
        </div>
        
        {/* Leaflet Map Preview */}
        <div className="h-80 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative z-10" id="mini-leaflet-wrapper">
          <MapContainer 
            center={[20.5937, 78.9629]} // India center
            zoom={5} 
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={isDark 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            />
            {reports.map((report) => {
              let color = "#2E7D32"; // Green (Low)
              if (report.severity >= 8) color = "#C62828"; // Red (Critical)
              else if (report.severity >= 5) color = "#E65100"; // Orange (High)
              else if (report.severity >= 3) color = "#FBC02D"; // Yellow (Medium)

              const customIcon = new L.DivIcon({
                html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
                className: "custom-leaflet-pin",
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });

              return (
                <Marker 
                  key={report.id} 
                  position={[report.latitude, report.longitude]} 
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-1 max-w-[200px]" onClick={() => onSelectReport(report)}>
                      <img 
                        src={report.imageUrl} 
                        alt={report.title} 
                        className="w-full h-24 object-cover rounded-md mb-1.5 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                      <h5 className="font-bold text-xs truncate hover:underline cursor-pointer">{report.title}</h5>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[8px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-semibold">{report.issueType}</span>
                        <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">{report.status}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
