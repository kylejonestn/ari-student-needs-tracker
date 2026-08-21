/* ==========================================
   Aegis Gifted Tracker - Main App Assembler
   ========================================== */

import React, { useState, useEffect } from "react";
import { store } from "./utils/studentStore";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Students from "./components/Students";
import ScreeningGrid from "./components/ScreeningGrid";
import ProgressReports from "./components/ProgressReports";
import SelStudio from "./components/SelStudio";
import ParentPortal from "./components/ParentPortal";
import SettingsPanel from "./components/SettingsPanel";
import IepPlanner from "./components/IepPlanner";
import SyncConflictModal from "./components/SyncConflictModal";
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, X } from "lucide-react";

export default function App() {
  const [storeState, setStoreState] = useState(store.getState());

  const {
    theme,
    clientId,
    syncStatus,
    syncError,
    conflicts,
    students,
    screenings,
    activeTab,
    isParentMode,
    flashingGreen,
    accessToken,
    tokenExpiry,
    toastMessage,
    toastType,
    hasUndoBackup,
    toastStudentId,
    toastQuarter
  } = storeState;

  // Bind store listener
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setStoreState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Redirect legacy tabs
  useEffect(() => {
    if (activeTab === "reeval") {
      store.updateState({ activeTab: "iep" });
    }
  }, [activeTab]);

  // Header Title Resolver
  const getPageDetails = () => {
    if (isParentMode) {
      return { title: "Parent Portal Simulation", subtitle: "Blackman Middle School Gifted Progress Review" };
    }
    
    switch (activeTab) {
      case "dashboard":
        return { title: "Ariel's Facilitator Dashboard", subtitle: "Weekly timelines & school due summaries" };
      case "students":
        return { title: "Student Directory", subtitle: "Active gifted student database & accommodations" };
      case "screening":
        return { title: "Screening & Placement Matrix", subtitle: "Tennessee K-12 Gifted Scoring Grid (IGAM)" };
      case "iep":
        return { title: "IEP Caseload Timeline", subtitle: "Annual IEP scheduling & checklist tracking" };
      case "progress":
        return { title: "Progress Reports Writer", subtitle: "Quarterly IEP goal indicators & narratives" };
      case "sel":
        return { title: "Social-Emotional Studio", subtitle: "Focus strategies & personal observations" };
      case "settings":
        return { title: "Settings & Cloud Sync", subtitle: "Configure Google Cloud client credentials" };
      default:
        return { title: "Aegis", subtitle: "Gifted Facilitator Hub" };
    }
  };

  const { title, subtitle } = getPageDetails();

  // Trigger Google Login
  const handleConnectClick = () => {
    store.connectGoogleDrive();
  };

  // Render Cloud HUD component
  const renderSyncHUD = () => {
    switch (syncStatus) {
      case "conflict":
        return (
          <div 
            className="sync-hud"
            style={{ borderColor: "var(--accent-amber)", color: "var(--accent-amber)", cursor: "pointer" }}
            onClick={() => store.syncToCloud()}
            title="Data conflicts detected between local cache and Google Drive. Click to resolve."
          >
            <AlertCircle size={14} color="var(--accent-amber)" />
            <span>Sync Conflict</span>
          </div>
        );
      case "synced":
        return (
          <div 
            className={`sync-hud synced ${flashingGreen ? "flash-green" : ""}`}
            onClick={() => store.syncToCloud()}
            title="Database synced with Google Drive. Click to sync and merge."
          >
            <Check size={14} />
            <span>Synced</span>
            <div className="sync-pulse" />
          </div>
        );
      case "saving":
        return (
          <div className="sync-hud saving" title="Auto-saving database back to Google Drive...">
            <RefreshCw size={14} className="spin-icon" />
            <span>Saving...</span>
            <div className="sync-pulse animate" />
          </div>
        );
      case "connecting":
        return (
          <div className="sync-hud connecting" title="Connecting to Google APIs...">
            <RefreshCw size={14} className="spin-icon" />
            <span>Connecting...</span>
            <div className="sync-pulse animate" />
          </div>
        );
      case "error":
        return (
          <div 
            className="sync-hud disconnected" 
            onClick={() => store.connectGoogleDrive()}
            title={`Sync Error: ${syncError || "Check credentials"}. Click to reconnect.`}
            style={{ cursor: "pointer" }}
          >
            <AlertCircle size={14} />
            <span>Sync Error</span>
          </div>
        );
      case "disconnected":
      default:
        return (
          <button 
            className="sync-hud disconnected" 
            onClick={handleConnectClick}
            title="Local storage cache active. Click to connect your Google Drive."
          >
            <CloudOff size={14} />
            <span>Cloud Disabled</span>
          </button>
        );
    }
  };

  return (
    <div className="app-container">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => store.updateState({ activeTab: tab })}
        isParentMode={isParentMode}
        setIsParentMode={(pm) => store.updateState({ isParentMode: pm })}
        theme={theme}
        setTheme={(theme) => store.setTheme(theme)}
        students={students}
      />

      {/* 2. Right Hand Wrapper Area */}
      <div className="main-wrapper">
        
        {/* Header Bar */}
        <header className="header-bar">
          <div className="page-title-box">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="header-right">
            {renderSyncHUD()}
          </div>
        </header>

        {/* Dynamic Content scroll body */}
        <main className="content-body">
          {/* Conditionally render simulated parent portal */}
          {isParentMode ? (
            <ParentPortal 
              students={students} 
              updateStudent={(id, fields) => store.updateStudent(id, fields)} 
            />
          ) : (
            // standard tab views
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  students={students}
                  screenings={screenings}
                  updateScreening={(id, fields) => store.updateScreening(id, fields)}
                />
              )}
              {activeTab === "students" && (
                <Students
                  students={students}
                  addStudent={(student) => store.addStudent(student)}
                  addStudents={(studentsArr) => store.addStudents(studentsArr)}
                  updateStudent={(id, fields) => store.updateStudent(id, fields)}
                  teacherEmails={storeState.teacherEmails}
                  bulkUpdateStudents={(ids, fields) => store.bulkUpdateStudents(ids, fields)}
                  bulkDeleteStudents={(ids) => store.bulkDeleteStudents(ids)}
                  bulkPromoteStudents={(ids) => store.bulkPromoteStudents(ids)}
                />
              )}
              {activeTab === "screening" && (
                <ScreeningGrid
                  screenings={screenings}
                  addScreening={(cand) => store.addScreening(cand)}
                  updateScreening={(id, fields) => store.updateScreening(id, fields)}
                  placeStudent={(id, accoms) => store.placeStudent(id, accoms)}
                />
              )}
              {activeTab === "iep" && (
                <IepPlanner
                  students={students}
                  updateStudent={(id, fields) => store.updateStudent(id, fields)}
                />
              )}
              {activeTab === "progress" && (
                <ProgressReports
                  students={students}
                  saveProgressReport={(id, report) => store.saveProgressReport(id, report)}
                />
              )}
              {activeTab === "sel" && (
                <SelStudio
                  students={students}
                  updateStudent={(id, fields) => store.updateStudent(id, fields)}
                  addSelLog={(id, note) => store.addSelLog(id, note)}
                />
              )}
              {activeTab === "settings" && (
                <SettingsPanel
                  clientId={clientId}
                  updateState={(fields) => store.updateState(fields)}
                  syncStatus={syncStatus}
                  syncError={syncError}
                  connectGoogleDrive={() => store.connectGoogleDrive()}
                  disconnectGoogleDrive={() => store.disconnectGoogleDrive()}
                  syncFromGoogleDrive={() => store.syncFromGoogleDrive()}
                  accessToken={accessToken}
                  tokenExpiry={tokenExpiry}
                  holidays={storeState.holidays}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Cloud Sync Conflict Modal */}
      {syncStatus === "conflict" && storeState.conflicts && storeState.conflicts.length > 0 && (
        <SyncConflictModal
          conflicts={storeState.conflicts}
          onResolve={(conflictList, resolveAllNewest) => {
            store.applyResolution(conflictList || storeState.conflicts, resolveAllNewest);
          }}
          onCancel={() => {
            store.updateState({ syncStatus: "synced", conflicts: [], mergedData: null });
          }}
        />
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "var(--bg-sidebar)",
            color: "var(--text-heading)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            padding: "12px 18px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
            zIndex: 9999,
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            maxWidth: "520px"
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0 }}>
            {toastType === "sync" ? "☁️" : (toastStudentId ? "📬" : "ℹ️")}
          </span>

          <div style={{ flexGrow: 1, lineHeight: "1.4" }}>
            <span>{toastMessage}</span>
            {toastStudentId && (
              <button
                type="button"
                onClick={() => {
                  store.updateState({
                    activeTab: "progress",
                    selectedProgressStudentId: toastStudentId,
                    selectedProgressQuarter: toastQuarter,
                    toastMessage: "",
                    toastStudentId: null,
                    toastQuarter: null
                  });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-purple)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginLeft: "6px",
                  padding: 0
                }}
              >
                View Report
              </button>
            )}
          </div>

          {hasUndoBackup && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => store.undoLastSync()}
              style={{
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: "700",
                color: "var(--accent-amber)",
                borderColor: "rgba(245, 158, 11, 0.4)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                flexShrink: 0
              }}
              title="Undo this sync and revert local data"
            >
              Undo
            </button>
          )}

          <button
            type="button"
            onClick={() => store.updateState({ toastMessage: "", toastStudentId: null, toastQuarter: null, hasUndoBackup: false })}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0
            }}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
