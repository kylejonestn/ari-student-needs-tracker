/* ==========================================
   Aegis Gifted Tracker - Sidebar Component
   ========================================== */

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  Heart, 
  Settings, 
  Lock, 
  Unlock,
  Sparkles,
  Sun,
  Moon,
  ClipboardList,
  FileSignature
} from "lucide-react";
import { calculateTimelines } from "../utils/studentStore";

export default function Sidebar({ activeTab, setActiveTab, isParentMode, setIsParentMode, theme, setTheme, students = [] }) {
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Student Directory", icon: Users },
    { id: "screening", label: "Screening Center", icon: CheckSquare },
    { id: "iep", label: "IEP Timeline", icon: FileSignature },
    { id: "progress", label: "Progress Reports", icon: FileText },
    { id: "sel", label: "SEL Studio", icon: Heart },
    { id: "settings", label: "Settings & Cloud", icon: Settings },
  ];

  // Calculate count of pending progress reports
  const pendingReportsCount = students
    .filter(s => s.status === "Active")
    .flatMap(s => calculateTimelines(s, false))
    .filter(t => t.type === "IEP Progress Report").length;

  return (
    <aside className="sidebar">
      {/* Logo Header */}
      <div className="logo-container">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="logo-text">Aegis</span>
            <span className="logo-subtitle">BMS Gifted Hub</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const showBadge = item.id === "progress" && pendingReportsCount > 0;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                // Auto turn off parent mode if navigating elsewhere
                if (item.id !== "dashboard") {
                  setIsParentMode(false);
                }
              }}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
              {showBadge && (
                <span style={{
                  marginLeft: "auto",
                  backgroundColor: "var(--accent-rose)",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  display: "inline-block",
                  lineHeight: "1"
                }}>
                  {pendingReportsCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer (Theme Toggle & Parent Mode Simulation Toggle) */}
      <div className="sidebar-footer">
        {/* Parent Portal Simulator Link */}
        <div 
          className={`nav-item ${isParentMode ? "active" : ""}`}
          style={{ 
            marginBottom: "12px", 
            border: "1px dashed var(--accent-purple)",
            backgroundColor: isParentMode ? "var(--accent-purple-light)" : "transparent"
          }}
          onClick={() => {
            setIsParentMode(!isParentMode);
            setActiveTab("dashboard"); // Redirect to dashboard which will render simulated view
          }}
        >
          {isParentMode ? <Unlock size={18} color="var(--accent-purple)" /> : <Lock size={18} color="var(--text-muted)" />}
          <span style={{ fontSize: "13px", fontWeight: "600" }}>
            {isParentMode ? "Exit Parent View" : "Simulate Parent Portal"}
          </span>
        </div>

        {/* Theme Selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Appearance</span>
          <button 
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? <Sun size={18} color="var(--accent-amber)" /> : <Moon size={18} color="var(--text-main)" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
