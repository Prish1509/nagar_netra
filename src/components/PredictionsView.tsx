import React, { useState, useEffect, useMemo } from "react";
import { PredictionHotspot } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import { Brain, Sparkles, AlertCircle, Send, CheckCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PredictionsProps {
  isDark: boolean;
}

// 4 Sample prediction hotspots spread across major cities in India
const SAMPLE_HOTSPOTS: PredictionHotspot[] = [
  {
    id: "pred_1",
    locationName: "Mumbai Metropolitan Region",
    latitude: 19.0760,
    longitude: 72.8777,
    probability: 85,
    predictedIssueType: "Monsoon Waterlogging & Drainage Failures",
    reasoning: "Heavy rainfall projections combined with aging low-lying drainage pipelines in central coastal areas.",
    severityLabel: "Critical"
  },
  {
    id: "pred_2",
    locationName: "New Delhi National Capital Region",
    latitude: 28.6139,
    longitude: 77.2090,
    probability: 72,
    predictedIssueType: "Potholes & Asphalt Degradation",
    reasoning: "High traffic density, asphalt age on secondary ring roads, and rapid temperature changes accelerating cracks.",
    severityLabel: "High"
  },
  {
    id: "pred_3",
    locationName: "Bengaluru Tech Hub Corridor",
    latitude: 12.9716,
    longitude: 77.5946,
    probability: 78,
    predictedIssueType: "Solid Waste Management Overflows",
    reasoning: "Rapid local residential growth outstripping collection frequency. Sidewalk choking predicted near major office parks.",
    severityLabel: "High"
  },
  {
    id: "pred_4",
    locationName: "Kolkata Heritage Quarter",
    latitude: 22.5726,
    longitude: 88.3639,
    probability: 60,
    predictedIssueType: "Streetlight & Utility Pole Failures",
    reasoning: "Aging overhead wiring and electrical transformer issues. Maintenance pending for over 6 months.",
    severityLabel: "Medium"
  }
];

// Historical trends data
const HISTORICAL_TRENDS_DATA = [
  { month: "Jan", Reported: 45, Resolved: 38 },
  { month: "Feb", Reported: 50, Resolved: 47 },
  { month: "Mar", Reported: 65, Resolved: 58 },
  { month: "Apr", Reported: 72, Resolved: 64 },
  { month: "May", Reported: 88, Resolved: 75 },
  { month: "Jun", Reported: 105, Resolved: 82 }
];

const PROBLEMATIC_AREAS_DATA = [
  { area: "Kothrud", Potholes: 14, Waste: 8, Water: 12 },
  { area: "Viman Nagar", Potholes: 9, Waste: 15, Water: 6 },
  { area: "Shivajinagar", Potholes: 18, Waste: 10, Water: 8 },
  { area: "Hadapsar", Potholes: 11, Waste: 18, Water: 14 },
  { area: "Kalyani Nagar", Potholes: 7, Waste: 6, Water: 9 }
];

export default function PredictionsView({ isDark }: PredictionsProps) {
  const [notifiedCards, setNotifiedCards] = useState<string[]>([]);
  const [aiReport, setAiReport] = useState<string>("");
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Fetch AI predictive report on load
  useEffect(() => {
    async function fetchPredictionReport() {
      setIsLoadingReport(true);
      try {
        const res = await fetch("/api/generate-predictions-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          setAiReport(data.report);
        }
      } catch (e) {
        console.error("Failed to fetch predictive analysis:", e);
      } finally {
        setIsLoadingReport(false);
      }
    }
    fetchPredictionReport();
  }, []);

  const handleNotify = (id: string, location: string) => {
    if (notifiedCards.includes(id)) return;
    setNotifiedCards(prev => [...prev, id]);
    // Show simulation toast
    alert(`📢 Prevention Alert Sent! Ward Officers for ${location} have been dispatched the prediction report for preventative diagnostics.`);
  };

  const getHeatmapColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "#dc2626"; // Red
      case "High": return "#ea580c"; // Orange
      case "Medium": return "#ca8a04"; // Yellow
      default: return "#16a34a"; // Green
    }
  };

  return (
    <div className="space-y-6" id="predictions-page">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/15 to-purple-900/15 dark:from-indigo-950/40 dark:to-purple-950/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/50">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
            <Brain className="text-purple-600 dark:text-purple-400 mr-2 animate-pulse" />
            NagarNetra AI Predictions & Hotspots
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Machine Learning analysis of seasonal history, complaints velocity, and weather forecasts mapping future civic failure risks.
          </p>
        </div>
        <div className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 px-3.5 py-1.5 rounded-full font-bold flex items-center shrink-0">
          <Sparkles size={13} className="mr-1" /> Predictive Modelling Enabled
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: HEATMAP & LIVE AI STATEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap (2 cols) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs lg:col-span-2 flex flex-col justify-between" id="heatmap-container">
          <div>
            <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-1 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-ping" />
              Civic Predictive Heatmap (Upcoming Week)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Geographic overlay of sectors flagged with accelerated risk values. Tap circle overlays for local reasoning.
            </p>
          </div>

          <div className="h-80 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative z-10" id="prediction-map-wrapper">
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
              {SAMPLE_HOTSPOTS.map((hot) => (
                <Circle
                  key={hot.id}
                  center={[hot.latitude, hot.longitude]}
                  radius={120000} // meters (120km) for visible scale on India map
                  pathOptions={{
                    fillColor: getHeatmapColor(hot.severityLabel),
                    color: getHeatmapColor(hot.severityLabel),
                    fillOpacity: 0.35,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="p-1 max-w-[200px] text-xs">
                      <h4 className="font-bold text-red-600 mb-1">{hot.locationName}</h4>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Predicted: {hot.predictedIssueType}</p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{hot.reasoning}</p>
                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hot.probability}% Chance</span>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Live AI Analysis Summary (1 col) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col h-full" id="live-ai-report">
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-3 flex items-center">
            <Sparkles size={16} className="text-purple-500 mr-2" />
            NagarNetra AI Weekly Outlook
          </h3>

          {isLoadingReport ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
              <Loader2 size={32} className="text-purple-600 dark:text-purple-400 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Gemini AI synthesizing risk patterns...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto text-xs space-y-3 leading-relaxed text-slate-600 dark:text-slate-300 bg-purple-50/20 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-100/50 dark:border-slate-800">
              <div className="markdown-body">
                <ReactMarkdown>{aiReport}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="mt-4 bg-amber-50/50 dark:bg-slate-900 p-3 rounded-lg border border-amber-100 dark:border-slate-800 text-[10px] text-slate-400 flex gap-1.5 leading-relaxed">
            <AlertCircle size={13} className="shrink-0 text-amber-500 mt-0.5" />
            <span>AI alerts are dispatched automatically to municipal supervisors to allocate standby workforce schedules.</span>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION - AI PREDICTION CARDS */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200">Municipal Mitigation Directives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="predictions-grid">
          {SAMPLE_HOTSPOTS.map((card) => {
            const hasNotified = notifiedCards.includes(card.id);
            return (
              <div 
                key={card.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Location & Probability Circular Indicator */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase truncate max-w-[130px]" title={card.locationName}>
                      {card.locationName}
                    </span>
                    {/* Prob circle progress */}
                    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="3" fill="transparent" />
                        <circle 
                          cx="20" cy="20" r="16" 
                          stroke={card.probability >= 75 ? "#dc2626" : "#ea580c"} 
                          strokeWidth="3.5" 
                          fill="transparent" 
                          strokeDasharray={100}
                          strokeDashoffset={100 - card.probability}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-extrabold text-slate-700 dark:text-slate-200">
                        {card.probability}%
                      </span>
                    </div>
                  </div>

                  {/* Predicted Issue details */}
                  <div className="space-y-1">
                    <span className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 rounded-md px-2 py-0.5 font-bold">
                      {card.predictedIssueType}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed pt-1.5">
                      {card.reasoning}
                    </p>
                  </div>
                </div>

                {/* Notify Action */}
                <button
                  onClick={() => handleNotify(card.id, card.locationName)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    hasNotified 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900" 
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  {hasNotified ? (
                    <>
                      <CheckCircle size={13} /> Preventative Dispatched
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Notify Ward Engineers
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION - HISTORICAL TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="predictions-charts">
        {/* Chart 1: Issues Reported vs Resolved */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs">
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-4">Issues Reported vs Resolved (Historical)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HISTORICAL_TRENDS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="Reported" stroke="#1565C0" fillOpacity={1} fill="url(#colorReported)" strokeWidth={2} />
                <Area type="monotone" dataKey="Resolved" stroke="#2E7D32" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Most Problematic Areas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs">
          <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-4">Most Problematic Wards by Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROBLEMATIC_AREAS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="area" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? "#1e293b" : "#ffffff", 
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Potholes" fill="#1565C0" stackId="a" />
                <Bar dataKey="Waste" fill="#E65100" stackId="a" />
                <Bar dataKey="Water" fill="#2E7D32" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
