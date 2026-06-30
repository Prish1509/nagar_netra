import React, { useState, useRef, useEffect } from "react";
import { Report, User } from "../types";
import { dbManager } from "../lib/firebase";
import { 
  Camera, Upload, Trash2, MapPin, Sparkles, Loader2, 
  CheckCircle, AlertTriangle, ChevronRight, Map, HelpCircle, ShieldAlert, Search
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Custom Leaflet Pin for the newly reported issue
const reportPinIcon = new L.DivIcon({
  html: `<div style="background-color: #1A237E; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative;"><div style="background-color: #1565C0; width: 6px; height: 6px; border-radius: 50%; position: absolute; top: 3px; left: 3px;"></div></div>`,
  className: "report-leaflet-pin",
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

// Component to handle map clicks to relocate the pin
function MapClickEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Component to center map when coordinates change
function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

interface ReportIssueProps {
  currentUser: User;
  onReportSubmitted: (newReport: Report) => void;
  isDark: boolean;
}

export default function ReportIssueView({ currentUser, onReportSubmitted, isDark }: ReportIssueProps) {
  // Image states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Location states
  const [latitude, setLatitude] = useState(18.5204); // Pune center
  const [longitude, setLongitude] = useState(73.8567);
  const [address, setAddress] = useState("FC Road, Shivajinagar, Pune, Maharashtra 411004");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Place search suggestions states
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

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
    setLatitude(lat);
    setLongitude(lon);
    setAddress(sug.display_name);
    setPlaceQuery("");
    setSuggestions([]);
  };

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ━━━ PHOTO UPLOAD HANDLERS ━━━
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setSelectedImage(base64String);
      triggerAIAnalysis(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setAiResult(null);
    setAiError(null);
    setIsSuccess(false);
    setSubmitResult(null);
  };

  // ━━━ AI ANALYSIS CALL ━━━
  const triggerAIAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        throw new Error("Server analysis returned an error status.");
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError("We couldn't connect with the AI analyzer. However, we've prepared some defaults for you to submit anyway.");
      // Fallback local simulated results if backend fails
      setAiResult({
        issueType: "Pothole",
        severity: 7,
        severityLabel: "High",
        title: "Reported Civic Obstruction / Pothole",
        description: "An infrastructure anomaly reported by community member. Located on Pune local road.",
        estimatedDimensions: "Approx. 1m wide",
        safetyRisk: "Medium",
        affectedArea: "Two-wheelers and passenger vehicles on local roads.",
        recommendedDepartment: "Roads & Highways Department",
        urgencyReason: "Requires active physical inspection to verify local transit impact."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ━━━ LOCATION SERVICES ━━━
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        await reverseGeocode(lat, lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation failed:", error);
        alert("Failed to access GPS. Please pin manually on the map.");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Real reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { "Accept-Language": "en", "User-Agent": "NagarNetraApp" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          return;
        }
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using simulated address:", e);
    }
    // Fallback simulated address based on coordinates
    setAddress(`India, Coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    await reverseGeocode(lat, lng);
  };

  // ━━━ SUBMIT ACTION ━━━
  const handleSubmit = async () => {
    if (!selectedImage || !aiResult) return;

    setIsSubmitting(true);
    try {
      const finalReport = {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userBadge: currentUser.badges[0] || "Active Citizen",
        imageUrl: selectedImage,
        title: aiResult.title,
        description: aiResult.description,
        issueType: aiResult.issueType,
        severity: aiResult.severity,
        severityLabel: aiResult.severityLabel,
        latitude: latitude,
        longitude: longitude,
        address: address,
        status: "Reported",
        verificationCount: 0,
        verifiedBy: [],
        department: aiResult.recommendedDepartment,
        estimatedDimensions: aiResult.estimatedDimensions,
        safetyRisk: aiResult.safetyRisk,
        affectedArea: aiResult.affectedArea,
        urgencyReason: aiResult.urgencyReason,
        createdAt: new Date().toISOString()
      };

      const savedReport = await dbManager.addReport(finalReport);
      setSubmitResult(savedReport);
      setIsSuccess(true);
      onReportSubmitted(savedReport);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper styles
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

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="report-view-container">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
            <Camera className="text-blue-600 dark:text-blue-400 mr-2" />
            Report Infrastructure Issue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            NagarNetra's AI model automatically analyzes issue details, department routing, and severity from your upload!
          </p>
        </div>
        <div className="text-xs bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400 px-3.5 py-1.5 rounded-full font-bold flex items-center shrink-0">
          <Sparkles size={13} className="mr-1" /> AI Engine Online
        </div>
      </div>

      {isSuccess ? (
        /* SUCCESS SCREEN */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-md text-center space-y-6 max-w-xl mx-auto" id="report-success-screen">
          <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle size={40} className="animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-display text-slate-800 dark:text-white">Report Successfully Submitted!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your civic report has been logged under ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{submitResult?.id}</span>. Nearby citizens are being notified for verification, which will alert municipal officers.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-left border border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
            <div className="flex justify-between font-semibold"><span className="text-slate-500">Title:</span> <span className="text-slate-800 dark:text-slate-200">{submitResult?.title}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-slate-500">Issue Category:</span> <span className="text-slate-800 dark:text-slate-200">{submitResult?.issueType}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-slate-500">Assigned Dept:</span> <span className="text-slate-800 dark:text-slate-200">{submitResult?.department}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-slate-500">Severity:</span> <span className="text-red-500 font-bold">{submitResult?.severityLabel} ({submitResult?.severity}/10)</span></div>
            <div className="flex justify-between font-semibold"><span className="text-slate-500">Location:</span> <span className="text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{submitResult?.address}</span></div>
          </div>

          <div className="flex items-center gap-3.5 pt-2">
            <button 
              onClick={handleRemoveImage}
              className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-sm"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      ) : (
        /* CORE REPORT FORM */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="report-main-grid">
          
          {/* LEFT SIDE: PHOTO & UPLOAD AREA */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs">
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                <Camera size={18} className="text-blue-500 mr-2" />
                Step 1: Capture or Select Photo
              </h3>

              {!selectedImage ? (
                /* Drag Drop Zone */
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[260px] transition-all-custom duration-200 ${
                    isDragActive 
                    ? "border-blue-500 bg-blue-50/50 dark:bg-slate-700/50" 
                    : "border-slate-300 hover:border-blue-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/20"
                  }`}
                  id="drop-zone"
                >
                  <div className="bg-blue-50 dark:bg-slate-700/70 p-4 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                    <Camera size={32} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Drag & Drop Issue Image Here
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Supports JPG, PNG, capture on mobile camera
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm transition-all">
                    Browse File or Use Camera
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment" // Forces back camera on mobile
                    className="hidden" 
                  />
                </div>
              ) : (
                /* Preview Zone */
                <div className="relative rounded-xl overflow-hidden group min-h-[260px] bg-slate-900 flex items-center justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded issue preview" 
                    className="max-h-[350px] object-contain w-full"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button 
                      onClick={handleRemoveImage}
                      className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full flex items-center gap-1 shadow-md transition-all text-sm font-bold scale-90 group-hover:scale-100 duration-200"
                    >
                      <Trash2 size={16} /> Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LOCATION CONFIGURATOR */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 flex items-center">
                  <MapPin size={18} className="text-blue-500 mr-2" />
                  Step 2: Tag Location
                </h3>
                <button 
                  onClick={handleUseMyLocation}
                  disabled={isLoadingLocation}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold flex items-center disabled:opacity-50"
                >
                  {isLoadingLocation ? (
                    <Loader2 size={13} className="mr-1 animate-spin" />
                  ) : (
                    <MapPin size={13} className="mr-1 text-red-500" />
                  )}
                  Use GPS Location
                </button>
              </div>

              {/* Autocomplete Search input */}
              <div className="relative mb-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="Search place name to locate..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-8 text-xs focus:outline-none focus:border-blue-500"
                  />
                  {isSearchingPlace && (
                    <Loader2 size={12} className="absolute right-3 top-3 text-slate-400 animate-spin" />
                  )}
                  {!isSearchingPlace && placeQuery && (
                    <button 
                      onClick={() => { setPlaceQuery(""); setSuggestions([]); }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                    {suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(sug)}
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-start gap-1.5"
                      >
                        <MapPin size={11} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{sug.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive map for pin placement */}
              <div className="h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-3.5 relative z-10" id="report-map">
                <MapContainer 
                  center={[latitude, longitude]} 
                  zoom={15} 
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={isDark 
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  />
                  <Marker position={[latitude, longitude]} icon={reportPinIcon} />
                  <MapClickEvents onMapClick={handleMapClick} />
                  <ChangeMapCenter center={[latitude, longitude]} />
                </MapContainer>
              </div>

              {/* Text Address and edits */}
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-500 dark:text-slate-400 block">Reported Site Address:</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Street name, landmark, colony, ward..."
                />
                <span className="text-[10px] text-slate-400 block">
                  📍 Click or tap on the map to re-locate the pin precisely.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: AI ANALYSIS AND SUBMISSION */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs min-h-[350px] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-200 mb-3.5 flex items-center justify-between">
                  <span className="flex items-center">
                    <Sparkles size={18} className="text-blue-500 mr-2" />
                    Step 3: AI prediction & analysis
                  </span>
                  {selectedImage && !isAnalyzing && aiResult && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 font-bold rounded-md px-2 py-0.5">
                      Analysed
                    </span>
                  )}
                </h3>

                {/* NO IMAGE UPLOADED YET */}
                {!selectedImage && (
                  <div className="text-center py-16 text-slate-400 space-y-2 flex-1 flex flex-col items-center justify-center" id="analysis-placeholder">
                    <HelpCircle size={40} className="text-slate-300 dark:text-slate-600" />
                    <h4 className="text-sm font-semibold">Awaiting Image Upload</h4>
                    <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                      AI prediction will execute automatically once you upload a picture in Step 1.
                    </p>
                  </div>
                )}

                {/* LOADING AI SPINNER */}
                {isAnalyzing && (
                  <div className="text-center py-16 space-y-4 flex-1 flex flex-col items-center justify-center" id="analysis-loading">
                    <Loader2 size={36} className="text-blue-600 dark:text-blue-400 animate-spin" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gemini AI is analyzing image...</h4>
                      <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                        Extracting issue type, dimensions, department routes, and security risk levels.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI RESULTS DISPLAY CARD */}
                {!isAnalyzing && aiResult && (
                  <div className="space-y-4 animate-fade-in" id="analysis-results">
                    
                    {/* Error Notice but fallback is active */}
                    {aiError && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-[11px] flex items-start gap-1.5 leading-relaxed">
                        <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {/* Badge and Title */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                          {aiResult.issueType}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getSeverityBadgeClass(aiResult.severityLabel)}`}>
                          Severity: {aiResult.severityLabel}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-white leading-snug">
                        {aiResult.title}
                      </h4>
                    </div>

                    {/* Progress severity slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>Report Severity Score</span>
                        <span className="text-slate-700 dark:text-slate-300">{aiResult.severity} / 10</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getSeverityColor(aiResult.severity)}`} 
                          style={{ width: `${aiResult.severity * 10}%` }}
                        />
                      </div>
                    </div>

                    {/* Description text */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {aiResult.description}
                    </p>

                    {/* Metadata specs chips */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]" id="results-chips">
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block font-medium">Estimated Scale</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">{aiResult.estimatedDimensions || "N/A"}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block font-medium">Safety Risk Level</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 block">{aiResult.safetyRisk || "N/A"}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg col-span-2">
                        <span className="text-slate-400 block font-medium">Municipal Routing Unit</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 truncate block">{aiResult.recommendedDepartment || "N/A"}</span>
                      </div>
                    </div>

                    {/* Urgency Reason alert */}
                    <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/50 p-3 rounded-xl flex items-start gap-2 text-[11px] leading-relaxed">
                      <ShieldAlert size={14} className="shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-800 dark:text-red-400 block mb-0.5">Urgency Warning:</span>
                        <span className="text-slate-600 dark:text-slate-400">{aiResult.urgencyReason}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedImage || isAnalyzing || !aiResult || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting Civic Report...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Verify & Submit Report
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 text-center block mt-2">
                  🔒 Report data complies with civic privacy policies.
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
