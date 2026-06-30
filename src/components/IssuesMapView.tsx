import React, { useState, useMemo, useEffect } from "react";
import { Report, User } from "../types";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { 
  Filter, Search, MapPin, AlertTriangle, UserCheck, 
  Clock, ShieldAlert, CheckCircle, RefreshCcw, Info, Loader2
} from "lucide-react";

interface IssuesMapProps {
  reports: Report[];
  currentUser: User;
  onVerifyReport: (reportId: string) => void;
  isDark: boolean;
}

// Custom Marker Maker
const createCustomMarker = (severity: number, isSelected: boolean) => {
  let color = "#2E7D32"; // Green (Low)
  if (severity >= 8) color = "#C62828"; // Red (Critical)
  else if (severity >= 5) color = "#E65100"; // Orange (High)
  else if (severity >= 3) color = "#FBC02D"; // Yellow (Medium)

  const size = isSelected ? "18px" : "14px";
  const borderSize = isSelected ? "3px solid #1e293b" : "2px solid white";

  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: ${size}; height: ${size}; border-radius: 50%; border: ${borderSize}; box-shadow: 0 0 8px rgba(0,0,0,0.4); transition: all 0.2s;"></div>`,
    className: "custom-leaflet-pin",
    iconSize: isSelected ? [18, 18] : [14, 14],
    iconAnchor: isSelected ? [9, 9] : [7, 7]
  });
};

// Component to dynamically pan and zoom to selected report or searched location
interface MapControllerProps {
  selectedCoords: [number, number] | null;
  customCenter: [number, number] | null;
  customZoom: number;
}

function MapController({ selectedCoords, customCenter, customZoom }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.setView(selectedCoords, 16);
    }
  }, [selectedCoords, map]);

  useEffect(() => {
    if (customCenter) {
      map.setView(customCenter, customZoom);
    }
  }, [customCenter, customZoom, map]);

  return null;
}

export default function IssuesMapView({ reports, currentUser, onVerifyReport, isDark }: IssuesMapProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Place Search & GPS Location States
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [customCenter, setCustomCenter] = useState<[number, number] | null>(null);
  const [customZoom, setCustomZoom] = useState<number>(5);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch place suggestions from OSM Nominatim
  useEffect(() => {
    if (placeQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlace(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeQuery)}&countrycodes=in&limit=5`,
          {
            headers: {
              "User-Agent": "NagarNetra-Civic-App"
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Error fetching place suggestions:", error);
      } finally {
        setIsSearchingPlace(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [placeQuery]);

  const handleSelectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setCustomCenter([lat, lon]);
    setCustomZoom(14);
    setPlaceQuery(sug.display_name);
    setSuggestions([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCustomCenter([latitude, longitude]);
        setCustomZoom(15);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Failed to get location: ${error.message}. Please make sure you have allowed location access.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Unique categories, statuses for filters
  const categories = ["Pothole", "Water Leak", "Broken Streetlight", "Garbage Dump", "Damaged Road", "Drainage Issue", "Fallen Tree", "Open Manhole", "Other"];
  const severities = ["Critical", "High", "Medium", "Low"];
  const statuses = ["Reported", "Verified", "Assigned", "In Progress", "Resolved"];

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleToggleSeverity = (sev: string) => {
    setSelectedSeverities(prev => 
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    );
  };

  const handleToggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSeverities([]);
    setSelectedStatuses([]);
    setSearchQuery("");
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Search matches
      const matchesSearch = 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(r.issueType);

      // Severity filter
      const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(r.severityLabel);

      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(r.status);

      return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
    });
  }, [reports, searchQuery, selectedCategories, selectedSeverities, selectedStatuses]);

  // Selected coords for map controller
  const selectedCoords = useMemo(() => {
    if (!selectedReportId) return null;
    const report = reports.find(r => r.id === selectedReportId);
    return report ? [report.latitude, report.longitude] as [number, number] : null;
  }, [selectedReportId, reports]);

  // Helper styles
  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-500";
    if (severity >= 5) return "bg-orange-500";
    if (severity >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-500 text-white";
      case "In Progress": return "bg-blue-500 text-white";
      case "Assigned": return "bg-indigo-500 text-white";
      case "Verified": return "bg-teal-500 text-white";
      default: return "bg-slate-400 text-white";
    }
  };

  const activeReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md" id="map-page-layout">
      
      {/* LEFT COLUMN: FILTER PANEL & LIST */}
      <div className="w-full lg:w-[320px] bg-white dark:bg-slate-800 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 flex flex-col h-1/2 lg:h-full z-20" id="map-filter-panel">
        
        {/* Header Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
              <Filter size={16} className="text-blue-600 mr-1.5" />
              Filter Issues
            </h3>
            {(selectedCategories.length > 0 || selectedSeverities.length > 0 || selectedStatuses.length > 0 || searchQuery !== "" || placeQuery !== "") && (
              <button 
                onClick={() => {
                  handleClearFilters();
                  setPlaceQuery("");
                  setSuggestions([]);
                }}
                className="text-[10px] text-red-500 hover:underline font-bold flex items-center gap-0.5"
              >
                <RefreshCcw size={10} /> Clear all
              </button>
            )}
          </div>

          {/* Place Search with Suggestions & Current Location GPS */}
          <div className="space-y-1 relative">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Search Map Location</span>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <MapPin size={13} className="absolute left-2.5 top-2.5 text-red-500 animate-pulse" />
                <input 
                  type="text" 
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder="Enter city or place..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pl-7 pr-8 text-xs focus:outline-none focus:border-blue-500"
                />
                {isSearchingPlace && (
                  <Loader2 size={12} className="absolute right-2.5 top-2.5 text-slate-400 animate-spin" />
                )}
                {!isSearchingPlace && placeQuery && (
                  <button 
                    onClick={() => { setPlaceQuery(""); setSuggestions([]); }}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                title="Use GPS current location"
                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-blue-400 rounded-xl transition-all flex items-center justify-center shrink-0 w-8 h-8 border border-blue-100 dark:border-slate-600"
              >
                {isLocating ? (
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                ) : (
                  <MapPin size={14} className="fill-blue-500 text-blue-600" />
                )}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[9999] overflow-hidden max-h-48 overflow-y-auto">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(sug)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-start gap-1.5"
                  >
                    <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{sug.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Search Reported Issues</span>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2 pl-0.5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports, streets..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Filters and list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Categories checkboxes */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Categories</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {categories.map(cat => {
                const isChecked = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleToggleCategory(cat)}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium border transition-colors ${
                      isChecked 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Filters */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Severity Level</span>
            <div className="grid grid-cols-4 gap-1">
              {severities.map(sev => {
                const isChecked = selectedSeverities.includes(sev);
                return (
                  <button
                    key={sev}
                    onClick={() => handleToggleSeverity(sev)}
                    className={`text-[10px] py-1 text-center font-semibold rounded border transition-colors ${
                      isChecked 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filters */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Status</span>
            <div className="flex flex-wrap gap-1">
              {statuses.map(st => {
                const isChecked = selectedStatuses.includes(st);
                return (
                  <button
                    key={st}
                    onClick={() => handleToggleStatus(st)}
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                      isChecked 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtered Count */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Resulting Issues</span>
            <span className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full">
              {filteredReports.length} pins
            </span>
          </div>

          {/* Scrollable list of matched reports */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
            {filteredReports.map(rep => (
              <div 
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                  selectedReportId === rep.id 
                  ? "bg-blue-50/50 border-blue-400 dark:bg-slate-700/60" 
                  : "bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{rep.title}</span>
                  <span className={`text-[8px] px-1 rounded uppercase font-bold tracking-wide shrink-0 ${getStatusBadgeClass(rep.status)}`}>
                    {rep.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{rep.address}</p>
                <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
                  <span className="font-semibold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded">
                    {rep.issueType}
                  </span>
                  <span>{rep.verificationCount} verifications</span>
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No matching reports.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* RIGHT AREA: THE MAP AND THE ACTIVE POPUP FLOATING CARD */}
      <div className="flex-1 relative h-1/2 lg:h-full z-10" id="map-pane-container">
        <MapContainer 
          center={[20.5937, 78.9629]} // India center
          zoom={5} 
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={isDark 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
          {filteredReports.map((rep) => (
            <Marker 
              key={rep.id} 
              position={[rep.latitude, rep.longitude]} 
              icon={createCustomMarker(rep.severity, selectedReportId === rep.id)}
              eventHandlers={{
                click: () => {
                  setSelectedReportId(rep.id);
                },
              }}
            />
          ))}
          <MapController selectedCoords={selectedCoords} customCenter={customCenter} customZoom={customZoom} />
        </MapContainer>

        {/* FLOATING DETAIL CARD - Opens when marker is selected */}
        {activeReport && (
          <div 
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[350px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl p-4 z-50 space-y-3.5 animate-fade-in"
            id="floating-map-card"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                  {activeReport.issueType}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                  {activeReport.title}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedReportId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Thumbnail and Location */}
            <div className="flex gap-3">
              <img 
                src={activeReport.imageUrl} 
                alt={activeReport.title} 
                className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1.5 text-xs min-w-0">
                <p className="text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {activeReport.description}
                </p>
                <span className="text-[10px] text-slate-400 flex items-center truncate">
                  <MapPin size={11} className="mr-0.5 text-red-500 shrink-0" /> {activeReport.address}
                </span>
              </div>
            </div>

            {/* Progress severity slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold text-slate-400">
                <span>Severity Score</span>
                <span className="text-slate-700 dark:text-slate-300">{activeReport.severity} / 10 ({activeReport.severityLabel})</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getSeverityColor(activeReport.severity)}`} 
                  style={{ width: `${activeReport.severity * 10}%` }}
                />
              </div>
            </div>

            {/* Verification and Status Row */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 text-xs gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Resolution Stage:</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadgeClass(activeReport.status)}`}>
                  {activeReport.status}
                </span>
              </div>

              {activeReport.verifiedBy?.includes(currentUser.id) ? (
                <button 
                  disabled
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0"
                >
                  <CheckCircle size={12} /> Verified by you ({activeReport.verificationCount})
                </button>
              ) : (
                <button 
                  onClick={() => onVerifyReport(activeReport.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer"
                >
                  <UserCheck size={12} /> Verify This ({activeReport.verificationCount})
                </button>
              )}
            </div>

            {/* Extra details indicator */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg flex items-center justify-between text-[10px] text-slate-400">
              <span className="truncate">Department: {activeReport.department}</span>
              <span className="shrink-0">{new Date(activeReport.createdAt).toLocaleDateString()}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
