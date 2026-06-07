/* ==========================================
   Aegis Gifted Tracker - SettingsPanel Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { store, DEFAULT_REPORT_CARD_DATES, DEFAULT_CLIENT_ID } from "../utils/studentStore";
import { Cloud, CloudOff, Info, Key, HelpCircle, Check, RefreshCw, Mail, Calendar } from "lucide-react";

export default function SettingsPanel({ 
  clientId, 
  updateState, 
  syncStatus, 
  syncError, 
  connectGoogleDrive, 
  disconnectGoogleDrive,
  syncFromGoogleDrive,
  accessToken,
  tokenExpiry
}) {
  const [tempClientId, setTempClientId] = useState(clientId);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  
  const emailAlerts = store.getState().emailAlertsEnabled;
  const calendarSync = store.getState().calendarSyncEnabled;

  const storeWorkEmail = store.getState().workEmail;
  const storeTeacherEmails = store.getState().teacherEmails;

  // Email state variables
  const [tempWorkEmail, setTempWorkEmail] = useState(storeWorkEmail);
  const [teacherEmailsState, setTeacherEmailsState] = useState(storeTeacherEmails);
  const [showEmailSavedMsg, setShowEmailSavedMsg] = useState(false);

  // Keep local inputs synced with external state changes (like after a Google Drive sync)
  useEffect(() => {
    setTempClientId(clientId);
  }, [clientId]);

  useEffect(() => {
    setTempWorkEmail(storeWorkEmail);
  }, [storeWorkEmail]);

  useEffect(() => {
    setTeacherEmailsState(storeTeacherEmails);
  }, [storeTeacherEmails]);

  const storeReportCardDates = store.getState().reportCardDates || DEFAULT_REPORT_CARD_DATES;
  const [reportCardDatesState, setReportCardDatesState] = useState(storeReportCardDates);
  const [showDatesSavedMsg, setShowDatesSavedMsg] = useState(false);

  useEffect(() => {
    setReportCardDatesState(storeReportCardDates);
  }, [storeReportCardDates]);

  const handleSaveReportCardDates = (e) => {
    e.preventDefault();
    store.updateState({
      reportCardDates: reportCardDatesState
    });
    store.triggerCloudSave();
    setShowDatesSavedMsg(true);
    setTimeout(() => setShowDatesSavedMsg(false), 2000);
  };

  const handleSaveEmails = (e) => {
    e.preventDefault();
    store.updateState({
      workEmail: tempWorkEmail.trim(),
      teacherEmails: teacherEmailsState
    });
    store.triggerCloudSave(); // Debounced save to Google Drive JSON
    setShowEmailSavedMsg(true);
    setTimeout(() => setShowEmailSavedMsg(false), 2000);
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    updateState({ clientId: tempClientId.trim() });
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const getMinutesRemaining = () => {
    if (!tokenExpiry) return 0;
    const diff = tokenExpiry - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Two Column Settings */}
      <div className="dashboard-columns">
        {/* Left Column: Cloud sync and connection parameters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Client ID Configuration */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Key size={18} color="var(--accent-purple)" />
              Google Cloud API Credentials (Optional)
            </h3>
            
            <form onSubmit={handleSaveClientId}>
              <div className="form-group">
                <label>OAuth 2.0 Client ID (Custom Override)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ fontSize: "12px" }}
                  placeholder={`Default System ID Active: ${DEFAULT_CLIENT_ID.substring(0, 20)}...`}
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {tempClientId.trim() 
                    ? "Custom Client ID configured. Aegis will use your custom credentials." 
                    : "No custom Client ID entered. Aegis is running in Standard SSO Mode using default system credentials."}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {showSavedMsg && (
                  <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                    ✔ Configuration saved!
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "auto" }}>
                  Save Custom ID
                </button>
              </div>
            </form>
          </div>

          {/* Connection Operations */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Cloud size={18} color="var(--accent-purple)" />
              Google Drive Cloud Database
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                Aegis will automatically create a dedicated folder named <strong>"Aegis"</strong> in your Google Drive and save your secure tracker databases inside it.
              </p>

              {/* Connection state HUD info */}
              <div style={{ 
                padding: "16px", 
                borderRadius: "8px", 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                fontSize: "13px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Connection Status:</span>
                  <span style={{ 
                    fontWeight: "700",
                    color: syncStatus === "synced" ? "var(--accent-emerald)" : 
                           syncStatus === "saving" ? "var(--accent-purple)" : 
                           syncStatus === "connecting" ? "var(--accent-amber)" : "var(--accent-rose)"
                  }}>
                    {syncStatus.toUpperCase()}
                  </span>
                </div>
                {accessToken && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>OAuth Token Expires:</span>
                      <span style={{ fontWeight: "600" }}>{getMinutesRemaining()} mins</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Using Google Scope: <code style={{ fontSize: "10px" }}>drive.file</code> (Authorized to only access the <strong>Aegis</strong> folder and files created by this app)
                    </div>
                  </>
                )}
                {syncError && (
                  <div style={{ color: "var(--accent-rose)", fontSize: "11px", marginTop: "8px", fontWeight: "600" }}>
                    Error details: {syncError}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {accessToken ? (
                  <>
                    <button 
                      className="btn btn-secondary" 
                      onClick={disconnectGoogleDrive}
                      style={{ flexGrow: "1" }}
                    >
                      <CloudOff size={16} />
                      Disconnect Account
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={syncFromGoogleDrive}
                      style={{ flexGrow: "1" }}
                      disabled={syncStatus === "connecting" || syncStatus === "saving"}
                    >
                      <RefreshCw size={16} />
                      Force Sync Now
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={connectGoogleDrive}
                    style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                  >
                    <Cloud size={16} />
                    Sign in with Google (SSO)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Simulator */}
          <div className="glass-panel">
             <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="var(--accent-purple)" />
              Weekly Summary & Alert Sync
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: "600", display: "block" }}>Email Weekly Summary</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Send weekly outline of timelines due directly to Ariel's email.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailAlerts} 
                  onChange={(e) => {
                    updateState({ emailAlertsEnabled: e.target.checked });
                    store.triggerCloudSave();
                  }} 
                />
              </div>

              <hr style={{ borderColor: "var(--border-color)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: "600", display: "block" }}>Google Calendar Integration</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Subscribe and sync all IEP/Re-eval dates to personal school calendar.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={calendarSync} 
                  onChange={(e) => {
                    updateState({ calendarSyncEnabled: e.target.checked });
                    store.triggerCloudSave();
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Email Settings Configuration */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="var(--accent-purple)" />
              Weekly Summary & Teacher Email Routing
            </h3>

            <form onSubmit={handleSaveEmails}>
              <div className="form-group">
                <label>Ariel's Work Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  style={{ fontSize: "12px" }}
                  placeholder="e.g. ariel.facilitator@rcschools.net"
                  value={tempWorkEmail}
                  onChange={(e) => setTempWorkEmail(e.target.value)}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Your personal weekly due summary will be sent directly to this work address.
                </p>
              </div>

              <hr style={{ borderColor: "var(--border-color)", margin: "16px 0" }} />

              <h4 style={{ fontSize: "12px", fontWeight: "700", marginBottom: "12px", color: "var(--text-heading)" }}>
                Classroom Teacher Email Routing
              </h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {Object.keys(teacherEmailsState).map(teacher => (
                  <div key={teacher} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", alignItems: "center" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-heading)" }}>{teacher}:</label>
                    <input 
                      type="email" 
                      className="input-field"
                      style={{ padding: "6px 10px", fontSize: "12px", width: "100%" }}
                      value={teacherEmailsState[teacher]}
                      onChange={(e) => setTeacherEmailsState({ ...teacherEmailsState, [teacher]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {showEmailSavedMsg && (
                  <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                    ✔ Email configs saved!
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "auto" }}>
                  Save Email Routing
                </button>
              </div>
            </form>
          </div>

          {/* Report Card Dates Configuration */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--accent-purple)" />
              Grading Quarter & Report Card Dates
            </h3>

            <form onSubmit={handleSaveReportCardDates}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Define the dates when IEP progress reports are due for each quarter. Ariel will be alerted a week prior to these deadlines.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {reportCardDatesState.map((q, idx) => (
                  <div key={q.quarter} className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-heading)", display: "block", marginBottom: "4px" }}>
                      {q.quarter} Report Card Date
                    </label>
                    <input 
                      type="date" 
                      className="input-field"
                      style={{ fontSize: "12px", padding: "6px 10px", width: "100%" }}
                      value={q.date}
                      onChange={(e) => {
                        const updated = [...reportCardDatesState];
                        updated[idx] = { ...updated[idx], date: e.target.value };
                        setReportCardDatesState(updated);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {showDatesSavedMsg && (
                  <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                    ✔ Dates saved & synced!
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "auto" }}>
                  Save Calendar Dates
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Step-by-Step Google Console Help Guide */}
        <div className="glass-panel" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpCircle size={18} color="var(--accent-purple)" />
            How to Set Up Your Free Google App Credentials
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "var(--text-main)" }}>
            <p>
              To ensure complete privacy, Aegis runs purely in your local browser and writes data directly to <strong>your personal Google Drive</strong>. Setting up a Client ID is free and takes under two minutes.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>1.</span>
                <span>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: "var(--accent-purple)", fontWeight: "600", textDecoration: "underline" }}>Google Cloud Console</a> and create a new project.</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>2.</span>
                <span>Search for <strong>"Google Drive API"</strong> and click <strong>Enable</strong>.</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>3.</span>
                <span>Go to <strong>OAuth consent screen</strong>:
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", listStyleType: "disc" }}>
                    <li>Choose <strong>External</strong> User Type.</li>
                    <li>Enter app name <code>Aegis Gifted Tracker</code>.</li>
                    <li>Add the scope: <code>.../auth/drive.file</code> (restricts access strictly to files Aegis creates).</li>
                  </ul>
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>4.</span>
                <span>Go to <strong>Credentials</strong> &gt; <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>:
                  <ul style={{ paddingLeft: "16px", marginTop: "4px", listStyleType: "disc" }}>
                    <li>Select Application Type: <strong>Web application</strong>.</li>
                    <li>Under <strong>Authorized JavaScript origins</strong> add:<br/>
                      <code>http://localhost:5173</code> (local testing origins)
                    </li>
                  </ul>
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>5.</span>
                <span>Copy your generated <strong>Client ID</strong> and paste it in the form on the left!</span>
              </div>
            </div>
            
            <div style={{ 
              padding: "10px", 
              borderRadius: "6px", 
              backgroundColor: "var(--bg-primary)", 
              borderLeft: "4px solid var(--accent-purple)",
              fontSize: "11px",
              marginTop: "8px"
            }}>
              <span style={{ fontWeight: "700", display: "block" }}>Note on local storage backups:</span>
              If Google Drive is disconnected, Aegis will continue to save all your data seamlessly in your browser's local cache so you never lose work.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
