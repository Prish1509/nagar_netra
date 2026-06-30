/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Report, User } from "./types";
import { dbManager, PUNE_SAMPLE_REPORTS, DEFAULT_MEMBER } from "./lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, Camera, Map, Brain, Users, MessageSquare, Trophy, User as UserIcon,
  Bell, Sun, Moon, Menu, ChevronLeft, ChevronRight, X, Search, Sparkles, AlertTriangle, ShieldCheck,
  Loader2
} from "lucide-react";

// Views imports
import DashboardView from "./components/DashboardView";
import ReportIssueView from "./components/ReportIssueView";
import IssuesMapView from "./components/IssuesMapView";
import PredictionsView from "./components/PredictionsView";
import CommunityFeedView from "./components/CommunityFeedView";
import AIAssistantView from "./components/AIAssistantView";
import LeaderboardView from "./components/LeaderboardView";
import MyReportsView from "./components/MyReportsView";

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App Theme state (Light/Dark mode)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("nagarnetra_dark");
    return saved === "true";
  });

  // Database Data state
  const [reports, setReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_MEMBER);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to NagarNetra Pune! Start exploring registered reports.", read: false, time: "Just now" },
    { id: 2, text: "Weekly Predictive analysis updated for Kothrud.", read: false, time: "2 hours ago" },
    { id: 3, text: "Water supply pipeline leak in Samrat Ashok Road assigned to board.", read: true, time: "1 day ago" }
  ]);

  // Global search bar text
  const [globalSearch, setGlobalSearch] = useState("");

  // Seed database and load initial configurations
  useEffect(() => {
    async function initApp() {
      setIsLoading(true);
      try {
        // Seed Firestore/LocalStorage if empty
        await dbManager.seedIfEmpty();
        
        // Fetch active reports
        const loadedReports = await dbManager.getReports();
        setReports(loadedReports);

        // Fetch user profiles
        const activeUser = dbManager.getLocalUser();
        setCurrentUser(activeUser);

        // Seed mock peer contributors (include active user so they appear in leaderboard)
        const mockContributors: User[] = [
          activeUser,
          {
            id: "user_suresh",
            name: "Suresh Kumar",
            email: "suresh.k@gmail.com",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
            points: 420,
            badges: ["Ward Champion", "Change Maker"],
            reportCount: 15,
            verificationCount: 22,
            trustScore: 99,
            joinedAt: "2025-11-01T00:00:00Z"
          },
          {
            id: "user_priya",
            name: "Priya Sharma",
            email: "priya.sharma@gmail.com",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
            points: 295,
            badges: ["Neighborhood Guardian", "First Step"],
            reportCount: 8,
            verificationCount: 19,
            trustScore: 96,
            joinedAt: "2025-12-10T00:00:00Z"
          },
          {
            id: "user_anil",
            name: "Anil Deshmukh",
            email: "anil.deshmukh@yahoo.com",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
            points: 250,
            badges: ["Eagle Eye", "First Step"],
            reportCount: 6,
            verificationCount: 14,
            trustScore: 94,
            joinedAt: "2026-02-15T00:00:00Z"
          },
          {
            id: "user_amit",
            name: "Amit Joshi",
            email: "amitjoshi@gmail.com",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
            points: 115,
            badges: ["First Step"],
            reportCount: 3,
            verificationCount: 8,
            trustScore: 90,
            joinedAt: "2026-03-20T00:00:00Z"
          }
        ];
        
        setAllUsers(mockContributors);
      } catch (err) {
        console.error("Failed to load application data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  // Sync theme to document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("nagarnetra_dark", isDark.toString());
  }, [isDark]);

  // Sidebar Menu Items configuration
  const menuItems = [
    { name: "Dashboard", icon: <Home size={18} />, tab: "Dashboard" },
    { name: "Report Issue", icon: <Camera size={18} />, tab: "Report Issue" },
    { name: "Issues Map", icon: <Map size={18} />, tab: "Issues Map" },
    { name: "AI Predictions", icon: <Brain size={18} />, tab: "AI Predictions" },
    { name: "Community Feed", icon: <Users size={18} />, tab: "Community Feed" },
    { name: "AI Assistant", icon: <MessageSquare size={18} />, tab: "AI Assistant" },
    { name: "Leaderboard", icon: <Trophy size={18} />, tab: "Leaderboard" },
    { name: "My Reports", icon: <UserIcon size={18} />, tab: "My Reports" }
  ];

  // Handle report submission
  const handleNewReportSubmitted = (newReport: Report) => {
    setReports(prev => [newReport, ...prev]);
    // Refresh user details to update points
    const activeUser = dbManager.getLocalUser();
    setCurrentUser(activeUser);

    // Add new notification
    setNotifications(prev => [
      { id: Date.now(), text: `Your report: "${newReport.title}" has been submitted for verification.`, read: false, time: "Just now" },
      ...prev
    ]);
  };

  // Handle Peer Verification upvote points increment
  const handleVerifyReport = async (reportId: string) => {
    try {
      const success = await dbManager.verifyReport(reportId, currentUser.id);
      if (success) {
        // Refresh local memory lists
        const updatedReports = await dbManager.getReports();
        setReports(updatedReports);

        const activeUser = dbManager.getLocalUser();
        setCurrentUser(activeUser);

        // Add a notification alert
        setNotifications(prev => [
          { id: Date.now(), text: `Verification logged! You earned +5 points.`, read: false, time: "Just now" },
          ...prev
        ]);
        alert("✨ Peer Check Registered! You earned +5 civic contribution points!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Global search bar action redirection
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setActivePage("Community Feed");
    }
  };

  // Notification count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Selector callback for individual reports clicked on maps or dashboards
  const handleSelectReport = (_report: Report) => {
    setActivePage("Community Feed");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      
      {/* ━━━ TOP NAVBAR ━━━ */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#1E293B] border-b border-slate-200/60 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-xs">
        
        {/* Brand Label */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-slate-500 dark:text-slate-300 focus:outline-none p-1.5"
          >
            <Menu size={22} />
          </button>
          
          <div 
            onClick={() => setActivePage("Dashboard")}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="bg-[#1A237E] dark:bg-[#1565C0] p-2 rounded-xl text-white shadow-md flex items-center justify-center">
              <Brain size={18} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight font-display text-[#1A237E] dark:text-blue-400">NagarNetra</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider -mt-0.5">CIVIC INTELLIGENCE</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Center) */}
        <form onSubmit={handleGlobalSearchSubmit} className="hidden sm:flex items-center w-full max-w-sm md:max-w-md relative mx-4">
          <Search size={14} className="absolute left-3.5 text-slate-400" />
          <input 
            type="text" 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search potholes, streetlights, street reports..."
            className="w-full bg-[#F1F5F9] dark:bg-[#0F172A] border border-transparent dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none text-slate-800 dark:text-slate-100 transition-all font-medium"
          />
        </form>

        {/* Controls, Notifications Drawer, Theme toggles */}
        <div className="flex items-center gap-3.5">
          {/* Theme Switcher */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>

          {/* Notifications Drawer */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) handleMarkNotificationsRead();
              }}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all relative cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification drop panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1E293B] border border-slate-150 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3.5 animate-fade-in text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bell size={14} className="text-blue-500" /> Notifications
                  </span>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 border ${
                        !n.read 
                        ? "bg-blue-50/40 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900 font-medium" 
                        : "border-transparent"
                      }`}
                    >
                      <p className="leading-normal">{n.text}</p>
                      <span className="text-[9px] text-slate-400 block mt-1">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile avatar */}
          <div 
            onClick={() => setActivePage("Leaderboard")}
            className="flex items-center gap-2 border border-slate-200/50 dark:border-slate-800 p-1 pr-3.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none"
          >
            <img 
              src={currentUser.avatar} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover shadow-sm bg-slate-100"
              referrerPolicy="no-referrer"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold leading-none text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{currentUser.name}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5 leading-none">{currentUser.points} PTS</span>
            </div>
          </div>
        </div>

      </header>

      {/* ━━━ CORE CONTAINER LAYOUT ━━━ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* 1. SIDEBAR NAVIGATION (Desktop left) */}
        <aside 
          className={`hidden md:flex flex-col bg-white dark:bg-[#1E293B] border-r border-slate-200/60 dark:border-slate-800/80 transition-all duration-300 relative z-30 ${
            isSidebarCollapsed ? "w-[72px]" : "w-[240px]"
          }`}
          id="desktop-sidebar"
        >
          {/* Collapse trigger knob */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full w-6.5 h-6.5 flex items-center justify-center text-slate-400 shadow-sm hover:text-blue-500 transition-colors cursor-pointer z-40"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Sidebar Menu options */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto mt-4" id="sidebar-nav">
            {menuItems.map(item => {
              const isActive = activePage === item.tab;
              return (
                <button
                  key={item.name}
                  onClick={() => setActivePage(item.tab)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive 
                    ? "bg-[#1A237E]/10 text-[#1A237E] dark:bg-[#1565C0]/20 dark:text-blue-400 border-l-4 border-[#1A237E] dark:border-blue-400" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className={`shrink-0 ${isActive ? "text-[#1A237E] dark:text-blue-400" : ""}`}>
                    {item.icon}
                  </div>
                  {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Workspace disclaimer */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
              <span className="font-bold flex items-center gap-1 text-slate-500 dark:text-slate-300">
                <Sparkles size={11} className="text-indigo-500" /> NagarNetra Pune
              </span>
              <p>Ward-Operations Management Console.</p>
            </div>
          )}
        </aside>

        {/* 2. MOBILE SIDE MENU (Drawer layout) */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs flex animate-fade-in" id="mobile-drawer-backdrop">
            <div className="w-[260px] bg-white dark:bg-[#1E293B] h-full p-4 flex flex-col justify-between" id="mobile-drawer-body">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold font-display text-[#1A237E] dark:text-blue-400">Navigation Menu</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {menuItems.map(item => {
                    const isActive = activePage === item.tab;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { setActivePage(item.tab); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                          isActive 
                          ? "bg-[#1A237E]/10 text-[#1A237E] dark:bg-blue-950/40 dark:text-blue-400" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                <span>NagarNetra Pune v3.2.0 • Civic AI</span>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* 3. MAIN WORKSPACE VIEW ROUTER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" id="main-viewport-content">
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 py-32" id="app-loading-state">
              <Loader2 size={40} className="text-[#1A237E] dark:text-blue-500 animate-spin" />
              <div className="space-y-1 text-center">
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Synchronizing database nodes...</h3>
                <p className="text-xs text-slate-400">Loading live civic markers, heatmaps, and predictions.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full h-full"
                id="routed-view-wrapper"
              >
                {activePage === "Dashboard" && (
                  <DashboardView 
                    reports={reports} 
                    contributors={allUsers} 
                    onNavigate={setActivePage}
                    onSelectReport={handleSelectReport}
                    isDark={isDark}
                  />
                )}

                {activePage === "Report Issue" && (
                  <ReportIssueView 
                    currentUser={currentUser} 
                    onReportSubmitted={handleNewReportSubmitted}
                    isDark={isDark}
                  />
                )}

                {activePage === "Issues Map" && (
                  <IssuesMapView 
                    reports={reports} 
                    currentUser={currentUser} 
                    onVerifyReport={handleVerifyReport}
                    isDark={isDark}
                  />
                )}

                {activePage === "AI Predictions" && (
                  <PredictionsView 
                    isDark={isDark}
                  />
                )}

                {activePage === "Community Feed" && (
                  <CommunityFeedView 
                    reports={reports} 
                    currentUser={currentUser} 
                    onVerifyReport={handleVerifyReport}
                    isDark={isDark}
                  />
                )}

                {activePage === "AI Assistant" && (
                  <AIAssistantView 
                    currentUser={currentUser} 
                    reports={reports} 
                    onNavigate={setActivePage}
                    isDark={isDark}
                  />
                )}

                {activePage === "Leaderboard" && (
                  <LeaderboardView 
                    currentUser={currentUser} 
                    contributors={allUsers} 
                    isDark={isDark}
                  />
                )}

                {activePage === "My Reports" && (
                  <MyReportsView 
                    currentUser={currentUser} 
                    reports={reports} 
                    isDark={isDark}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

      </div>

      {/* ━━━ MOBILE BOTTOM NAVIGATION BAR ━━━ */}
      <footer className="md:hidden bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 py-1.5 shrink-0" id="mobile-bottom-nav">
        {[
          { name: "Feed", icon: <Users size={16} />, tab: "Community Feed" },
          { name: "Report", icon: <Camera size={16} />, tab: "Report Issue" },
          { name: "Map", icon: <Map size={16} />, tab: "Issues Map" },
          { name: "Copilot", icon: <Brain size={16} />, tab: "AI Assistant" }
        ].map(b => {
          const isActive = activePage === b.tab;
          return (
            <button
              key={b.name}
              onClick={() => setActivePage(b.tab)}
              className={`flex flex-col items-center justify-center text-center gap-1 py-1 ${
                isActive ? "text-[#1A237E] dark:text-blue-400 font-bold" : "text-slate-400"
              }`}
            >
              {b.icon}
              <span className="text-[10px]">{b.name}</span>
            </button>
          );
        })}
      </footer>

    </div>
  );
}
