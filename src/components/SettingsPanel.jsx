/* ==========================================
   Aegis Gifted Tracker - SettingsPanel Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { store, DEFAULT_REPORT_CARD_DATES, DEFAULT_CLIENT_ID, DEFAULT_DEADLINES, DEFAULT_HOLIDAYS } from "../utils/studentStore";
import { Cloud, CloudOff, Info, Key, HelpCircle, Check, RefreshCw, Mail, Calendar, Clock, X, Trash2, Plus, Upload } from "lucide-react";

// PDF.js dynamic loader helper
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = (err) => reject(new Error("Failed to load PDF.js from CDN"));
    document.head.appendChild(script);
  });
};

// PDF text extractor helper
const extractTextFromPdf = async (file) => {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      fullText += item.str;
      if (item.hasEOL) {
        fullText += "\n";
      }
    }
    fullText += "\n";
  }
  return fullText;
};

// Regex calendar text scraper helper
const parseHolidaysFromText = (text) => {
  const lines = text.split('\n');
  
  // Try to find academic year
  let startYear = new Date().getFullYear();
  const yearMatch = text.match(/\b(20\d{2})\s*-\s*(20\d{2})\b/);
  if (yearMatch) {
    startYear = parseInt(yearMatch[1], 10);
  } else {
    const singleYearMatch = text.match(/\b(20\d{2})\b/);
    if (singleYearMatch) {
      startYear = parseInt(singleYearMatch[1], 10);
    }
  }

  const holidayKeywords = ['closed', 'no school', 'break', 'holiday', 'in-service', 'workday', 'admin day', 'safety day'];
  const ignoreKeywords = ['return', 'first day', 'last day', 'orientation', 'progress reports', 'report cards', 'conferences'];
  const monthRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z.]*\s+(\d+)/gi;
  
  const parsedHolidays = [];
  
  const monthsMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  const getYearForMonth = (monthIdx, sYear) => {
    return monthIdx >= 7 ? sYear : sYear + 1;
  };
  
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const hasKeyword = holidayKeywords.some(kw => lowerLine.includes(kw));
    if (!hasKeyword) continue;

    const hasIgnore = ignoreKeywords.some(kw => lowerLine.includes(kw));
    if (hasIgnore) continue;
    
    monthRegex.lastIndex = 0;
    const matches = [];
    let match;
    while ((match = monthRegex.exec(line)) !== null) {
      matches.push({
        monthStr: match[1].toLowerCase(),
        dayNum: parseInt(match[2], 10),
        index: match.index,
        length: match[0].length
      });
    }
    
    if (matches.length === 0) continue;
    
    let description = "";
    if (line.includes(':')) {
      description = line.split(':').slice(1).join(':').trim();
    } else {
      description = line.replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,\s*/i, "").trim();
    }
    description = description.replace(/\s+/g, ' ').trim();
    if (!description) {
      description = "School Break / Holiday";
    }
    
    if (matches.length === 2) {
      const startMonthIdx = monthsMap[matches[0].monthStr.substring(0, 3)];
      const endMonthIdx = monthsMap[matches[1].monthStr.substring(0, 3)];
      
      const startY = getYearForMonth(startMonthIdx, startYear);
      const endY = getYearForMonth(endMonthIdx, startYear);
      
      const startDate = new Date(startY, startMonthIdx, matches[0].dayNum, 12, 0, 0);
      const endDate = new Date(endY, endMonthIdx, matches[1].dayNum, 12, 0, 0);
      
      if (startDate <= endDate) {
        let curr = new Date(startDate);
        while (curr <= endDate) {
          const dayOfWeek = curr.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
            parsedHolidays.push({
              date: formatDate(curr),
              description: description
            });
          }
          curr.setDate(curr.getDate() + 1);
        }
      }
    } else if (matches.length === 1) {
      const monthIdx = monthsMap[matches[0].monthStr.substring(0, 3)];
      const startY = getYearForMonth(monthIdx, startYear);
      
      const restOfLine = line.substring(matches[0].index + matches[0].length);
      const rangeMatch = restOfLine.match(/^\s*[-–]\s*(\d+)/);
      
      if (rangeMatch) {
        const endDay = parseInt(rangeMatch[1], 10);
        const startDate = new Date(startY, monthIdx, matches[0].dayNum, 12, 0, 0);
        const endDate = new Date(startY, monthIdx, endDay, 12, 0, 0);
        
        if (startDate <= endDate) {
          let curr = new Date(startDate);
          while (curr <= endDate) {
            const dayOfWeek = curr.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
              parsedHolidays.push({
                date: formatDate(curr),
                description: description
              });
            }
            curr.setDate(curr.getDate() + 1);
          }
        }
      } else {
        const dateObj = new Date(startY, monthIdx, matches[0].dayNum, 12, 0, 0);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          parsedHolidays.push({
            date: formatDate(dateObj),
            description: description
          });
        }
      }
    }
  }
  
  const seenDates = new Set();
  const uniqueHolidays = [];
  for (const h of parsedHolidays) {
    if (!seenDates.has(h.date)) {
      seenDates.add(h.date);
      uniqueHolidays.push(h);
    }
  }
  
  uniqueHolidays.sort((a, b) => a.date.localeCompare(b.date));
  return uniqueHolidays;
};

export default function SettingsPanel({ 
  clientId, 
  updateState, 
  syncStatus, 
  syncError, 
  connectGoogleDrive, 
  disconnectGoogleDrive,
  syncFromGoogleDrive,
  accessToken,
  tokenExpiry,
  holidays
}) {
  const [tempClientId, setTempClientId] = useState(clientId);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  
  const emailAlerts = store.getState().emailAlertsEnabled;
  const calendarSync = store.getState().calendarSyncEnabled;

  const storeWorkEmail = store.getState().workEmail;

  // Email state variables
  const [tempWorkEmail, setTempWorkEmail] = useState(storeWorkEmail);
  const [showEmailSavedMsg, setShowEmailSavedMsg] = useState(false);

  // Keep local inputs synced with external state changes (like after a Google Drive sync)
  useEffect(() => {
    setTempClientId(clientId);
  }, [clientId]);

  useEffect(() => {
    setTempWorkEmail(storeWorkEmail);
  }, [storeWorkEmail]);

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
      workEmail: tempWorkEmail.trim()
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

  const storeDeadlines = store.getState().deadlines || DEFAULT_DEADLINES;
  const [deadlinesState, setDeadlinesState] = useState(storeDeadlines);
  const [showDeadlinesSavedMsg, setShowDeadlinesSavedMsg] = useState(false);

  useEffect(() => {
    setDeadlinesState(storeDeadlines);
  }, [storeDeadlines]);

  const handleSaveDeadlines = (e) => {
    e.preventDefault();
    store.updateState({
      deadlines: deadlinesState
    });
    store.triggerCloudSave();
    setShowDeadlinesSavedMsg(true);
    setTimeout(() => setShowDeadlinesSavedMsg(false), 2000);
  };

  // Holiday & Breaks state management
  const holidaysList = holidays || DEFAULT_HOLIDAYS;
  const [holidaySearch, setHolidaySearch] = useState("");
  const filteredHolidays = holidaysList.filter(h => 
    h.date.includes(holidaySearch) || 
    h.description.toLowerCase().includes(holidaySearch.toLowerCase())
  );
  const [manualDate, setManualDate] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState(null);
  
  // Scraped holidays review modal state
  const [scrapedHolidays, setScrapedHolidays] = useState([]);
  const [checkedHolidays, setCheckedHolidays] = useState({});

  const handleManualAddHoliday = (e) => {
    e.preventDefault();
    if (!manualDate || !manualDescription.trim()) return;
    
    const normalizedDate = manualDate.trim();
    const normalizedDesc = manualDescription.trim();
    
    // Check for duplicate
    if (holidaysList.some(h => h.date === normalizedDate)) {
      alert(`A break date is already configured for ${normalizedDate}. Please delete it first if you want to update it.`);
      return;
    }
    
    const updated = [...holidaysList, { date: normalizedDate, description: normalizedDesc }]
      .sort((a, b) => a.date.localeCompare(b.date));
      
    store.updateState({ holidays: updated });
    store.triggerCloudSave();
    
    setManualDate("");
    setManualDescription("");
  };

  const handleDeleteHoliday = (date) => {
    if (confirm(`Are you sure you want to delete the holiday/break on ${date}?`)) {
      const updated = holidaysList.filter(h => h.date !== date);
      store.updateState({ holidays: updated });
      store.triggerCloudSave();
    }
  };

  const handleResetHolidays = () => {
    if (confirm("Are you sure you want to reset all holidays back to the default 2026-2027 Rutherford County Schools calendar? Any custom breaks you added or uploaded will be overwritten.")) {
      store.updateState({ holidays: DEFAULT_HOLIDAYS });
      store.triggerCloudSave();
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPdfLoading(true);
    setPdfStatus({ type: "info", message: "Extracting text from PDF..." });
    
    try {
      const text = await extractTextFromPdf(file);
      setPdfStatus({ type: "info", message: "Scraping break dates..." });
      
      const parsed = parseHolidaysFromText(text);
      if (parsed.length === 0) {
        setPdfStatus({ type: "error", message: "No holiday or break dates found in the PDF. Please add dates manually." });
        setPdfLoading(false);
        return;
      }
      
      // Initialize check state for all parsed holidays
      const initialChecked = {};
      parsed.forEach((h, idx) => {
        initialChecked[idx] = true; // checked by default
      });
      
      setScrapedHolidays(parsed);
      setCheckedHolidays(initialChecked);
      setPdfStatus({ type: "success", message: `Found ${parsed.length} break dates. Please review them below.` });
    } catch (err) {
      console.error(err);
      setPdfStatus({ type: "error", message: `PDF Error: ${err.message}` });
    } finally {
      setPdfLoading(false);
      e.target.value = "";
    }
  };

  const handleMergeApprovedHolidays = () => {
    const approved = scrapedHolidays.filter((h, idx) => checkedHolidays[idx]);
    if (approved.length === 0) {
      alert("No dates selected to merge.");
      return;
    }
    
    const currentMap = new Map(holidaysList.map(h => [h.date, h]));
    approved.forEach(h => {
      currentMap.set(h.date, h);
    });
    
    const updated = Array.from(currentMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    store.updateState({ holidays: updated });
    store.triggerCloudSave();
    
    setScrapedHolidays([]);
    setCheckedHolidays({});
    setPdfStatus({ type: "success", message: `Successfully merged ${approved.length} holidays into calendar database!` });
    setTimeout(() => setPdfStatus(null), 5000);
  };

  const renderDeadlineInput = (key, label, desc) => {
    const isSchool = key.toLowerCase().includes("school") || 
      ["screeningQuickSurvey", "screeningTeacherChecklist", "iepDataGathering", "iepTransitionSurvey", "iepDraftWritten", "iepDraftSent"].includes(key);
    return (
      <div className="form-group" style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "11.5px", fontWeight: "600", color: "var(--text-heading)", display: "flex", justifyContent: "space-between" }}>
          <span>{label}</span>
          <span style={{ color: "var(--accent-purple)", fontSize: "10.5px" }}>
            {deadlinesState[key]} {isSchool ? "school" : "calendar"} days
          </span>
        </label>
        <input 
          type="number"
          min="0"
          required
          className="input-field"
          style={{ fontSize: "12px", padding: "6px 10px", width: "100%" }}
          value={deadlinesState[key] ?? ""}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setDeadlinesState({
              ...deadlinesState,
              [key]: isNaN(val) ? 0 : val
            });
          }}
        />
        {desc && <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.3" }}>{desc}</p>}
      </div>
    );
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
        {/* Left Column: Cloud database sync & notifications toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
        </div>

        {/* Right Column: Routing emails and Report Card Dates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Email Settings Configuration */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={18} color="var(--accent-purple)" />
              Weekly Summary Work Email
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                {showEmailSavedMsg && (
                  <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                    ✔ Email saved!
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "auto" }}>
                  Save Email Address
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
      </div>

      {/* School Calendar & Holidays Management */}
      <div className="glass-panel" style={{ marginTop: "16px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={18} color="var(--accent-purple)" />
          School Calendar & Holidays Management
        </h3>
        <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" }}>
          Upload academic calendar PDFs (e.g. Rutherford County Schools) to scrape holidays and breaks automatically, or manually add individual dates. Weekends are automatically skipped in school-day calculations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "24px" }}>
          {/* PDF Calendar Scraper */}
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
            <h4 style={{ fontSize: "13px", color: "var(--accent-purple)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Upload size={14} />
              Import PDF Calendar
            </h4>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Scrape holidays, breaks, and teacher admin days directly from a school calendar PDF.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input 
                type="file" 
                accept=".pdf" 
                id="pdf-calendar-upload" 
                style={{ display: "none" }}
                onChange={handlePdfUpload}
              />
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ width: "100%", padding: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                onClick={() => document.getElementById("pdf-calendar-upload").click()}
                disabled={pdfLoading}
              >
                <Upload size={16} />
                {pdfLoading ? "Processing PDF..." : "Upload School Calendar PDF"}
              </button>
              {pdfStatus && (
                <span style={{ 
                  fontSize: "11.5px", 
                  color: pdfStatus.type === "error" ? "var(--accent-rose)" : 
                         pdfStatus.type === "success" ? "var(--accent-emerald)" : "var(--accent-purple)", 
                  fontWeight: "600", 
                  marginTop: "4px" 
                }}>
                  {pdfStatus.message}
                </span>
              )}
            </div>
          </div>

          {/* Manual Entry Form */}
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
            <h4 style={{ fontSize: "13px", color: "var(--accent-purple)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={14} />
              Manually Add Holiday / Break
            </h4>
            <form onSubmit={handleManualAddHoliday} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px" }}>
                <div>
                  <input 
                    type="date" 
                    required
                    className="input-field" 
                    style={{ fontSize: "12px", padding: "8px", width: "100%" }}
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Labor Day" 
                    className="input-field" 
                    style={{ fontSize: "12px", padding: "8px", width: "100%" }}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px", fontSize: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
                <Plus size={14} />
                Add Date
              </button>
            </form>
          </div>
        </div>

        {/* Configured Holidays Table */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "13px", color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
              Configured School Breaks ({holidaysList.length})
            </h4>
            
            {/* Search Box */}
            <div style={{ width: "240px" }}>
              <input 
                type="text" 
                placeholder="Search holidays..." 
                className="input-field"
                style={{ fontSize: "11px", padding: "6px 12px", width: "100%" }}
                value={holidaySearch}
                onChange={(e) => setHolidaySearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ 
            maxHeight: "320px", 
            overflowY: "auto", 
            border: "1px solid var(--border-color)", 
            borderRadius: "8px",
            backgroundColor: "var(--bg-primary)"
          }}>
            {filteredHolidays.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No school holidays found matching the search.
              </div>
            ) : (
              <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                {/* Header Row */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1.2fr 2fr 80px", 
                  padding: "10px 16px", 
                  borderBottom: "1px solid var(--border-color)",
                  fontWeight: "700",
                  fontSize: "11px",
                  color: "var(--text-heading)",
                  textTransform: "uppercase",
                  position: "sticky",
                  top: 0,
                  backgroundColor: "var(--bg-primary)",
                  zIndex: 1
                }}>
                  <span>Date</span>
                  <span>Description</span>
                  <span style={{ textAlign: "right" }}>Action</span>
                </div>
                
                {/* Data Rows */}
                {filteredHolidays.map((holiday, idx) => (
                  <div 
                    key={holiday.date} 
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1.2fr 2fr 80px", 
                      padding: "10px 16px", 
                      borderBottom: idx === filteredHolidays.length - 1 ? "none" : "1px solid var(--border-color)",
                      fontSize: "12px",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontWeight: "600", color: "var(--text-heading)" }}>{holiday.date}</span>
                    <span style={{ color: "var(--text-main)" }}>{holiday.description}</span>
                    <div style={{ textAlign: "right" }}>
                      <button 
                        type="button"
                        className="btn btn-secondary" 
                        style={{ padding: "4px 8px", minHeight: "auto", color: "var(--accent-rose)", borderColor: "var(--accent-rose)", backgroundColor: "transparent" }}
                        onClick={() => handleDeleteHoliday(holiday.date)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ fontSize: "11px", padding: "6px 12px" }}
              onClick={handleResetHolidays}
            >
              Reset to Default 2026-2027 Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Review Scraped Holidays Modal */}
      {scrapedHolidays.length > 0 && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 220, padding: "16px",
          backdropFilter: "blur(4px)"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "24px", backgroundColor: "var(--bg-sidebar)", display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Review & Approve Scraped Dates</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Verify that the dates and descriptions were correctly scraped from the PDF. Checked entries will be merged.
                </p>
              </div>
              <button 
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} 
                onClick={() => setScrapedHolidays([])}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => {
                  const allChecked = {};
                  scrapedHolidays.forEach((_, idx) => { allChecked[idx] = true; });
                  setCheckedHolidays(allChecked);
                }}
              >
                Select All
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => setCheckedHolidays({})}
              >
                Deselect All
              </button>
            </div>

            <div style={{ 
              flexGrow: 1, 
              overflowY: "auto", 
              border: "1px solid var(--border-color)", 
              borderRadius: "8px",
              backgroundColor: "var(--bg-primary)",
              marginBottom: "20px"
            }}>
              <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "40px 1.5fr 2fr", 
                  padding: "10px 16px", 
                  borderBottom: "1px solid var(--border-color)",
                  fontWeight: "700",
                  fontSize: "11px",
                  color: "var(--text-heading)",
                  textTransform: "uppercase",
                  position: "sticky",
                  top: 0,
                  backgroundColor: "var(--bg-primary)",
                  zIndex: 1
                }}>
                  <span></span>
                  <span>Date</span>
                  <span>Description</span>
                </div>

                {/* Rows */}
                {scrapedHolidays.map((holiday, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "40px 1.5fr 2fr", 
                      padding: "8px 16px", 
                      borderBottom: idx === scrapedHolidays.length - 1 ? "none" : "1px solid var(--border-color)",
                      alignItems: "center"
                    }}
                  >
                    <input 
                      type="checkbox"
                      checked={!!checkedHolidays[idx]}
                      onChange={(e) => setCheckedHolidays({ ...checkedHolidays, [idx]: e.target.checked })}
                    />
                    <div>
                      <input 
                        type="date"
                        className="input-field"
                        style={{ fontSize: "11px", padding: "4px 8px", width: "90%" }}
                        value={holiday.date}
                        onChange={(e) => {
                          const updated = [...scrapedHolidays];
                          updated[idx] = { ...updated[idx], date: e.target.value };
                          setScrapedHolidays(updated);
                        }}
                      />
                    </div>
                    <div>
                      <input 
                        type="text"
                        className="input-field"
                        style={{ fontSize: "11px", padding: "4px 8px", width: "100%" }}
                        value={holiday.description}
                        onChange={(e) => {
                          const updated = [...scrapedHolidays];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setScrapedHolidays(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "auto" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: "8px 16px", fontSize: "12px" }} 
                onClick={() => setScrapedHolidays([])}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ padding: "8px 16px", fontSize: "12px" }} 
                onClick={handleMergeApprovedHolidays}
              >
                Merge Approved Holidays
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Deadlines Configuration Section */}
      <div className="glass-panel" style={{ marginTop: "16px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="var(--accent-purple)" />
          Timeline Deadlines Configuration (School & Calendar Days)
        </h3>
        <form onSubmit={handleSaveDeadlines}>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: "1.4" }}>
            Customize the duration thresholds (in calendar or school days) for the screening pipeline, triennial re-evaluations, and IEP planner milestones. Values will instantly update all steppers and compliance warning systems.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {/* Screening Deadlines */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-purple)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Screening Deadlines
              </h4>
              {renderDeadlineInput("screeningQuickSurvey", "Quick Survey Check", "Days to review cumulative file for prior testing/locks.")}
              {renderDeadlineInput("screeningConsentPending", "Consent Form Wait", "Buffer to receive parental consent for screening.")}
              {renderDeadlineInput("screeningEvaluation", "Screening Evaluation", "TN regulatory days to complete all student screening.")}
              {renderDeadlineInput("screeningTeacherChecklist", "Teacher Input SIGS", "School days for gen-ed teachers to return behavior checklists.")}
              {renderDeadlineInput("screeningAcademicCheckin", "Academic WJ/TVAAS", "Calendar days to complete academic check-in testing.")}
              {renderDeadlineInput("screeningCreativityCheckin", "Creativity Rating", "Calendar days to complete creativity rating checklists.")}
              {renderDeadlineInput("screeningInformedConsent", "Informed Consent Phone", "Calendar days notice to contact parent for rubric review.")}
              {renderDeadlineInput("screeningPermissionToTest", "Psych Test Permission", "Days to return psychologist evaluation permissions.")}
              {renderDeadlineInput("screeningPsychEvaluation", "Psychologist IQ Eval", "School psychologist's evaluation window.")}
              {renderDeadlineInput("screeningPsychCheckin", "Psychologist Check-in", "Days to follow up on testing schedule.")}
              {renderDeadlineInput("screeningMeetingNotice", "Legal Meeting Notice", "Required legal notice buffer for eligibility team meeting.")}
              {renderDeadlineInput("screeningArielMeetingNotice", "Ariel Meeting Notice", "Ariel's target buffer to send eligibility meeting notice.")}
            </div>

            {/* Re-evaluation Deadlines */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-purple)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Re-evaluation Deadlines
              </h4>
              {renderDeadlineInput("reevalInvitation", "Parent Invitation", "Days notice to send triennial re-eval meeting invitation.")}
              {renderDeadlineInput("reevalObservation", "Classroom Observation", "Buffer to complete classroom observation notes.")}
              {renderDeadlineInput("reevalPsychHandoff", "Psych Handoff Buffer", "Days prior to submit compiled file to psychologist.")}
            </div>

            {/* IEP Review Deadlines */}
            <div>
              <h4 style={{ fontSize: "13px", color: "var(--accent-purple)", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                IEP Review Deadlines
              </h4>
              {renderDeadlineInput("iepParentProposal", "Proposed Dates Letter", "Calendar days before meeting to send proposed dates letter.")}
              {renderDeadlineInput("iepFormalInvitation", "Formal Team Invitation", "Required notice before annual IEP review meeting.")}
              {renderDeadlineInput("iepTeacherChecklist", "Teacher Input Checklist", "Teacher checklists due before IEP meeting.")}
              {renderDeadlineInput("iepDataGathering", "Academic Data Mining", "School days before meeting to extract test scores.")}
              {renderDeadlineInput("iepTransitionSurvey", "Transition survey goals", "School days before meeting to survey transition goals.")}
              {renderDeadlineInput("iepDraftWritten", "Draft Written Date", "School days before meeting to finish Pulse draft.")}
              {renderDeadlineInput("iepDraftSent", "Draft Sent to Parent", "School days before meeting to send IEP draft (48 hr rule).")}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            {showDeadlinesSavedMsg && (
              <span style={{ color: "var(--accent-emerald)", fontSize: "12.5px", fontWeight: "600" }}>
                ✔ Timeline deadlines updated & synced!
              </span>
            )}
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "13px", marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
              <Check size={16} />
              Save Timeline Deadlines
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Row: Google Cloud API Credentials & Setup Guide (Moved to Bottom) */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "24px", 
          marginTop: "16px", 
          borderTop: "1px dashed var(--border-color)", 
          paddingTop: "24px" 
        }}
      >
        {/* Client ID Configuration */}
        <div className="glass-panel" style={{ height: "fit-content" }}>
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

        {/* Step-by-Step Google Console Help Guide */}
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
