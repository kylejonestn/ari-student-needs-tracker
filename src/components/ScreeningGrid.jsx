/* ==========================================
   Aegis Gifted Tracker - ScreeningGrid Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { store, addDays, getDaysRemaining, addSchoolDays } from "../utils/studentStore";
import { 
  Check, 
  ClipboardList, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Send, 
  CheckCircle,
  FileCheck,
  PhoneCall,
  UserCheck2,
  Trash2,
  Lock,
  ArrowRight
} from "lucide-react";

export default function ScreeningGrid({ screenings, addScreening, updateScreening, placeStudent }) {
  // Read initial selection from store if present
  const globalSelectedId = store.getState().selectedScreeningId;
  const [selectedScreenId, setSelectedScreenId] = useState(globalSelectedId || screenings[0]?.id || "");
  const [showAddReferral, setShowAddReferral] = useState(false);
  
  // Referral Form State
  const [refName, setRefName] = useState("");
  const [refGrade, setRefGrade] = useState("6th");
  const [refTeacher, setRefTeacher] = useState("");

  const activeScreening = screenings.find(s => s.id === selectedScreenId);

  // Sync selected screening if screenings array changes and selection is empty
  useEffect(() => {
    if (screenings.length > 0 && !selectedScreenId) {
      setSelectedScreenId(screenings[0].id);
    }
  }, [screenings, selectedScreenId]);

  // Sync with global store selection changes (e.g. clicked on dashboard link)
  useEffect(() => {
    const checkGlobalSelection = () => {
      const globalId = store.getState().selectedScreeningId;
      if (globalId && globalId !== selectedScreenId) {
        setSelectedScreenId(globalId);
      }
    };
    
    // Initial check
    checkGlobalSelection();

    // Subscribe to state changes
    const unsubscribe = store.subscribe(() => {
      checkGlobalSelection();
    });
    return unsubscribe;
  }, [selectedScreenId]);

  const handleAddReferral = (e) => {
    e.preventDefault();
    if (!refName || !refTeacher) {
      alert("Please fill in Name and Classroom Teacher.");
      return;
    }

    addScreening({
      name: refName,
      grade: refGrade,
      classroomTeacher: refTeacher,
      school: "Blackman Middle School"
    });

    setRefName("");
    setRefTeacher("");
    setShowAddReferral(false);
    
    // Auto-select newly created referral
    setTimeout(() => {
      const allScreens = store.getState().screenings;
      const latest = allScreens[allScreens.length - 1];
      if (latest) setSelectedScreenId(latest.id);
    }, 100);
  };

  const handleConsentDate = (dateStr) => {
    if (!activeScreening) return;
    
    updateScreening(activeScreening.id, { 
      consentReceivedDate: dateStr,
      status: dateStr ? "Evaluation in Progress" : "Consent Pending",
      teacherChecklistSentDate: dateStr ? dateStr : ""
    });
  };

  const handleBatonPass = (dateStr) => {
    if (!activeScreening) return;
    updateScreening(activeScreening.id, {
      permissionToTestReceivedDate: dateStr,
      psychologistHandoffDate: dateStr,
      status: dateStr ? "Psych Results Pending" : "Permission to Test Pending"
    });
  };

  const handleFinalizePlacement = () => {
    if (!activeScreening) return;
    
    // Move student to active
    placeStudent(activeScreening.id, ["Curriculum Compacting", "Advanced Academic Pacing"]);
    
    // Reset selected screen
    const remaining = screenings.filter(s => s.id !== activeScreening.id);
    if (remaining.length > 0) {
      setSelectedScreenId(remaining[0].id);
    } else {
      setSelectedScreenId("");
    }

    alert(`${activeScreening.name} has been successfully evaluated and placed into the Active Gifted Student directory! An initial IEP timeline has been scheduled due in 30 days.`);
  };

  const handleNudge = () => {
    if (!activeScreening) return;
    const teacherEmails = store.getState().teacherEmails || {};
    const email = teacherEmails[activeScreening.classroomTeacher] || "teacher@rcschools.net";
    
    const subject = encodeURIComponent(`[Aegis Gifted Checklist] Traits needed for ${activeScreening.name}`);
    const body = encodeURIComponent(
      `Dear ${activeScreening.classroomTeacher},\n\n` +
      `I hope you are doing well! As the Gifted Facilitator, I am currently conducting an initial screening evaluation for ${activeScreening.name} under our Tennessee 60-calendar-day timeline.\n\n` +
      `To complete our state-mandated TN K-12 Assessment Scoring Grid, I need your classroom behavior traits checklist (SIGS/Renzulli rating scale points).\n\n` +
      `Could you please complete the characteristics checklist for ${activeScreening.name} as soon as you have a moment (due within 2 school weeks)? Or reply to this email with your observations?\n\n` +
      `Thank you so much for your support and partnership!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    updateScreening(activeScreening.id, { nudgeSent: true });
  };

  // Helper to change phases
  const advanceStatus = (newStatus) => {
    if (!activeScreening) return;
    updateScreening(activeScreening.id, { status: newStatus });
  };

  // Archive and delete screening case
  const handleArchiveCase = () => {
    if (!activeScreening) return;
    if (activeScreening.status === "Pending Discontinuation") {
      if (!activeScreening.discontinuationPWNMailDate || !activeScreening.discontinuationCumeFileDate) {
        alert("Please complete all discontinuation checklist tasks (PWN mailed and cume filed) before archiving.");
        return;
      }
    }
    const name = activeScreening.name;
    store.removeScreening(activeScreening.id);
    setSelectedScreenId("");
    alert(`Screening case for ${name} has been closed and archived.`);
  };

  // Matrix calculation values
  const cognitionPts = activeScreening?.matrix?.cognition?.points || 0;
  const performancePts = activeScreening?.matrix?.performance?.points || 0;
  const creativityPts = activeScreening?.matrix?.creativity?.points || 0;
  
  // Scoring parameters during screening (cognition is blank until psychologist tests)
  const screeningScore = performancePts + creativityPts;
  const totalPoints = cognitionPts + performancePts + creativityPts;

  const handleInformedConsentEmail = () => {
    if (!activeScreening) return;
    const subject = encodeURIComponent(`[Aegis Gifted Tracker] Informed Consent Disclosures for ${activeScreening.name}`);
    const body = encodeURIComponent(
      `Dear Parent,\n\n` +
      `As the Gifted Facilitator at Blackman Middle School, I am writing to share the results of ${activeScreening.name}'s initial gifted screening and explain the next steps in our evaluation process.\n\n` +
      `${activeScreening.name} has passed our initial academic and characteristics screening by earning ${screeningScore} points on our assessment grid.\n\n` +
      `The next step is to proceed to a full psychological evaluation with our School Psychologist, who will administer an IQ test. To qualify for gifted services in Tennessee, a student must meet the following criteria:\n` +
      `1. Score a minimum of 50 points total on the assessment scoring grid.\n` +
      `2. Obtain an IQ score of 123 or higher.\n` +
      `3. Obtain positive points in all three categories (Cognitive, Achievement, and Creativity).\n\n` +
      `I would love to have a brief phone call to discuss this and answer any questions you may have. Please let me know a few dates and times that work best for you. If you do not feel you need a call and are content to move forward, please let me know that as well.\n\n` +
      `Once we align, I will send home the formal 'Permission to Test' and 'Permission to Email Legal Documents' forms for your signature.\n\n` +
      `Thank you so much for your partnership!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );
    window.location.href = `mailto:parent@email.com?subject=${subject}&body=${body}`;
  };

  // Tennessee mandate checklist rules for final active placement:
  // 1. Total score >= 50
  // 2. Score in at least the "First range" (points > 0) on Cognition
  // 3. Score in at least the "First range" (points > 0) on Educational Performance
  // 4. Points are scored on Creativity
  const isEligibleForPlacement = totalPoints >= 50 && cognitionPts > 0 && performancePts > 0 && creativityPts > 0 && activeScreening?.psychResultsReceived;

  // Phase index calculator
  const phases = [
    "Quick Survey",
    "Consent Pending",
    "Evaluation in Progress",
    "Informed Consent",
    "Permission to Test Pending",
    "Psych Results Pending",
    "Meeting Scheduled",
    "Pending Discontinuation"
  ];
  
  const currentPhaseIndex = activeScreening ? phases.indexOf(activeScreening.status) : -1;

  // Meeting date day checks (Psychologist available Monday/Thursday only)
  const isMeetingDayWarning = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day !== 1 && day !== 4; // Monday = 1, Thursday = 4
  };

  // Meeting invitation notice checks
  const getMeetingNoticeDays = () => {
    if (!activeScreening?.meetingDate || !activeScreening?.meetingInvitationSentDate) return null;
    const meet = new Date(activeScreening.meetingDate + "T00:00:00");
    const invite = new Date(activeScreening.meetingInvitationSentDate + "T00:00:00");
    const diff = meet.getTime() - invite.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const noticeDays = getMeetingNoticeDays();

  return (
    <div>
      {/* Tab Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "700" }}>Select Student in Screening:</label>
          <select 
            className="select-field" 
            value={selectedScreenId} 
            onChange={(e) => {
              setSelectedScreenId(e.target.value);
              store.updateState({ selectedScreeningId: e.target.value });
            }}
            style={{ minWidth: "250px" }}
          >
            {screenings.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.grade} • {s.status})</option>
            ))}
            {screenings.length === 0 && <option value="">No Active Screenings</option>}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddReferral(!showAddReferral)}>
          <Plus size={16} />
          {showAddReferral ? "View Workflow Center" : "Log Initial Referral"}
        </button>
      </div>

      {/* Add Referral Form */}
      {showAddReferral && (
        <div className="glass-panel" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={20} color="var(--accent-purple)" />
            Add Gifted Screening Referral
          </h3>
          <form onSubmit={handleAddReferral}>
            <div className="form-row">
              <div className="form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Sarah Jenkins"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Grade Level</label>
                <select className="select-field" value={refGrade} onChange={(e) => setRefGrade(e.target.value)}>
                  <option value="6th">6th Grade</option>
                  <option value="7th">7th Grade</option>
                  <option value="8th">8th Grade</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Classroom Core Referral Teacher</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Mr. Thompson"
                value={refTeacher}
                onChange={(e) => setRefTeacher(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddReferral(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Start Screening Pipeline</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Workflow Grid */}
      {activeScreening ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Phase HUD status indicator */}
          <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Active Screening Phase</span>
              <h2 style={{ fontSize: "20px", color: "var(--accent-purple)", marginTop: "2px" }}>
                {activeScreening.status}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {activeScreening.status !== "Pending Discontinuation" && (
                <button 
                  className="btn btn-secondary" 
                  style={{ color: "var(--accent-rose)", padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => advanceStatus("Pending Discontinuation")}
                >
                  <Trash2 size={12} />
                  Discontinue Case
                </button>
              )}
            </div>
          </div>

          {/* ==========================================
              PHASE 1: QUICK SURVEY
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 0 ? "active" : currentPhaseIndex > 0 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 0 ? "✔" : "1"}</span>
              <h3>Quick Survey (Cume File Check)</h3>
            </div>
            {(currentPhaseIndex === 0) && (
              <div className="workflow-step-body" style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
                  Ariel must inspect the physical student cumulative folder to look for testing lockouts or historical context:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.surveyPriorTestingCheck || false}
                      onChange={(e) => updateScreening(activeScreening.id, { surveyPriorTestingCheck: e.target.checked })}
                    />
                    <span>Double check student has not been tested for Gifted Services recently (TN re-testing lockout rule).</span>
                  </label>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.surveyEslCheck || false}
                      onChange={(e) => updateScreening(activeScreening.id, { surveyEslCheck: e.target.checked })}
                    />
                    <span>Check English as a Second Language (ESL) status logs.</span>
                  </label>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.surveyDcsCheck || false}
                      onChange={(e) => updateScreening(activeScreening.id, { surveyDcsCheck: e.target.checked })}
                    />
                    <span>Identify DCS involvement, chronic attendance issues, or trauma records that nullify low test scores.</span>
                  </label>
                </div>
                <button 
                  className="btn btn-primary"
                  disabled={!activeScreening.surveyPriorTestingCheck}
                  onClick={() => {
                    updateScreening(activeScreening.id, { quickSurveyCompleted: true, status: "Consent Pending" });
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  Proceed to Send Parent Consent Paperwork
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 2: PARENT PAPERWORK PENDING
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 1 ? "active" : currentPhaseIndex > 1 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 1 ? "✔" : "2"}</span>
              <h3>Parent Paperwork & Initial Consent</h3>
            </div>
            {currentPhaseIndex === 1 && (
              <div className="workflow-step-body" style={{ marginTop: "14px" }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date Screening Packet Sent Home</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={activeScreening.parentPaperworkSentDate || ""}
                      onChange={(e) => updateScreening(activeScreening.id, { parentPaperworkSentDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Consent to Screen SIGNED & Received Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={activeScreening.consentReceivedDate || ""}
                      onChange={(e) => handleConsentDate(e.target.value)}
                    />
                  </div>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>
                  Entering the parental consent received date starts the mandatory <strong>Tennessee 60-Calendar-Day Initial Evaluation Deadline</strong>.
                </p>
              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 3: EVALUATION IN PROGRESS
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 2 ? "active" : currentPhaseIndex > 2 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 2 ? "✔" : "3"}</span>
              <h3>Academic & Creativity Testing Grid</h3>
            </div>
            {currentPhaseIndex === 2 && (
              <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 60 day reminder bar */}
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span>Consent Date: <strong>{activeScreening.consentReceivedDate}</strong></span>
                  <span style={{ color: "var(--accent-rose)", fontWeight: "700" }}>
                    60-Day Deadline: {addDays(activeScreening.consentReceivedDate, 60)} ({getDaysRemaining(addDays(activeScreening.consentReceivedDate, 60))} days remaining)
                  </span>
                </div>

                {/* Gen Ed teacher checklist */}
                <div style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Classroom Teacher Input Checklist</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                    General education checklist (SIGS/Renzulli behavior rating) is due in <strong>2 school weeks</strong> (10 school days) from consent.
                    Checklist deadline: <strong>{addSchoolDays(activeScreening.consentReceivedDate, 10)}</strong>.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <label style={{ display: "inline-flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                      <input 
                        type="checkbox"
                        checked={activeScreening.teacherChecklistSigned || false}
                        onChange={(e) => updateScreening(activeScreening.id, { teacherChecklistSigned: e.target.checked })}
                      />
                      <span>checklist Received & Signed</span>
                    </label>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={handleNudge}
                      disabled={activeScreening.nudgeSent}
                    >
                      <Send size={11} />
                      {activeScreening.nudgeSent ? "Checklist Nudge Sent" : `Email Nudge to ${activeScreening.classroomTeacher}`}
                    </button>
                  </div>
                </div>

                {/* Rubrics Form */}
                <div className="scoring-grid-container">
                  {/* Category 1: Academics (Performance) */}
                  <div className="score-card" style={{ border: "1px solid var(--border-color)" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>1. Educational Performance (Academics)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="form-group">
                        <label>Assessment Instrument</label>
                        <select 
                          className="select-field"
                          value={activeScreening.academicInstrument || "T-VAAS"}
                          onChange={(e) => updateScreening(activeScreening.id, { academicInstrument: e.target.value })}
                        >
                          <option value="T-VAAS">T-VAAS Benchmark</option>
                          <option value="Woodcock-Johnson">Woodcock-Johnson (Direct)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Test Score / Percentile</label>
                        <input 
                          type="number"
                          className="input-field"
                          placeholder="e.g. 98"
                          value={activeScreening.matrix.performance.score || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const points = val >= 99 ? 25 : val >= 96 ? 20 : val >= 90 ? 15 : val >= 85 ? 10 : val >= 80 ? 5 : 0;
                            const newMatrix = { ...activeScreening.matrix };
                            newMatrix.performance = { instrument: activeScreening.academicInstrument, score: val, points };
                            updateScreening(activeScreening.id, { matrix: newMatrix });
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>TN Matrix Rubric Points:</span>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: performancePts >= 10 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                          {performancePts} Pts
                        </span>
                      </div>
                      {performancePts < 10 && activeScreening.matrix.performance.score !== "" && (
                        <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600" }}>
                          🚨 Needs $\ge 10$ points to proceed legally.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Creativity (Gifted Characteristics) */}
                  <div className="score-card" style={{ border: "1px solid var(--border-color)" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>2. Creativity / Characteristics</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="form-group">
                        <label>Creativity Assessment</label>
                        <select 
                          className="select-field"
                          value={activeScreening.creativityInstrument || "TN TOL"}
                          onChange={(e) => updateScreening(activeScreening.id, { creativityInstrument: e.target.value })}
                        >
                          <option value="TN TOL">TN TOL Checklist</option>
                          <option value="TN TOL Plus">TN TOL Plus (with Parent Input)</option>
                          <option value="TN Create">TN Create (Raw score)</option>
                          <option value="Torrance">Torrance Test of Creativity (County Grade)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Assessment Score</label>
                        <input 
                          type="number"
                          className="input-field"
                          placeholder={activeScreening.creativityInstrument === "TN Create" ? "Raw Score (need 42+)" : "e.g. 95"}
                          value={activeScreening.matrix.creativity.score || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            let points = 0;
                            const inst = activeScreening.creativityInstrument;
                            if (inst === "TN Create") {
                              points = val >= 42 ? 10 : 0;
                            } else {
                              points = val >= 99 ? 25 : val >= 96 ? 20 : val >= 90 ? 15 : val >= 85 ? 10 : val >= 80 ? 5 : 0;
                            }
                            const newMatrix = { ...activeScreening.matrix };
                            newMatrix.creativity = { instrument: inst, score: val, points };
                            updateScreening(activeScreening.id, { matrix: newMatrix });
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>TN Matrix Rubric Points:</span>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: creativityPts >= 10 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                          {creativityPts} Pts
                        </span>
                      </div>
                      {/* Hierarchical prompts */}
                      {activeScreening.creativityInstrument === "TN TOL" && creativityPts < 10 && activeScreening.matrix.creativity.score !== "" && (
                        <p style={{ fontSize: "10px", color: "var(--accent-amber)", fontWeight: "600" }}>
                          ℹ TOL &lt; 10. Switch to <strong>TN TOL Plus</strong> to include parent survey.
                        </p>
                      )}
                      {activeScreening.creativityInstrument === "TN TOL Plus" && creativityPts < 10 && activeScreening.matrix.creativity.score !== "" && (
                        <p style={{ fontSize: "10px", color: "var(--accent-amber)", fontWeight: "600" }}>
                          ℹ TOL Plus &lt; 10. Administer <strong>TN Create</strong> or <strong>Torrance</strong>.
                        </p>
                      )}
                      {activeScreening.creativityInstrument === "TN Create" && (
                        <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          Requires a raw score of <strong>42</strong> or higher to qualify for 10 matrix points.
                        </p>
                      )}
                      {activeScreening.creativityInstrument === "Torrance" && (
                        <div style={{ padding: "6px", backgroundColor: "var(--accent-rose-light)", borderRadius: "4px", fontSize: "10px", color: "var(--accent-rose)", fontWeight: "600" }}>
                          ⚠️ Sent to county. Factoring 1.5-week grading lag.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Summary Panel */}
                <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Screening Combined Points</span>
                    <h3 style={{ fontSize: "20px", color: "var(--text-heading)", marginTop: "2px" }}>{screeningScore} / 50 Pts</h3>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Minimum 20 points required to pass screening to psychiatrist phase.</p>
                  </div>
                  <div>
                    {screeningScore >= 20 && performancePts >= 10 && creativityPts >= 10 ? (
                      <button 
                        className="btn btn-primary"
                        style={{ backgroundColor: "var(--accent-emerald)" }}
                        onClick={() => advanceStatus("Informed Consent")}
                      >
                        Pass to Informed Consent
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary"
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => advanceStatus("Pending Discontinuation")}
                      >
                        Fail & Discontinue Case
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 4: INFORMED CONSENT
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 3 ? "active" : currentPhaseIndex > 3 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 3 ? "✔" : "4"}</span>
              <h3>Informed Consent (Phone Call)</h3>
            </div>
            {currentPhaseIndex === 3 && (
              <div className="workflow-step-body" style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
                  Ariel must speak with parents (via call or email confirmation) to explain the 50-point rubric qualification criteria and the 123 IQ threshold.
                </p>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleInformedConsentEmail}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Send size={12} />
                    Email Disclosures to Parent
                  </button>
                </div>
                <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", marginBottom: "20px" }}>
                  <input 
                    type="checkbox"
                    checked={activeScreening.informedConsentCompleted || false}
                    onChange={(e) => updateScreening(activeScreening.id, { informedConsentCompleted: e.target.checked })}
                  />
                  <strong>Informed Consent Call Completed & Logged</strong>
                </label>
                <button 
                  className="btn btn-primary"
                  disabled={!activeScreening.informedConsentCompleted}
                  onClick={() => advanceStatus("Permission to Test Pending")}
                >
                  Send Permission to Test Letter
                </button>
              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 5: PERMISSION TO TEST PENDING (BATON PASS)
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 4 ? "active" : currentPhaseIndex > 4 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 4 ? "✔" : "5"}</span>
              <h3>Permission to Test (Baton Pass)</h3>
            </div>
            {currentPhaseIndex === 4 && (
              <div className="workflow-step-body" style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
                  Ariel must obtain the formal parent <strong>Permission to Test</strong> and <strong>Permission to Email Legal Documents</strong>.
                </p>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--text-heading)" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.permissionToEmailReceived || false}
                      onChange={(e) => updateScreening(activeScreening.id, { permissionToEmailReceived: e.target.checked })}
                    />
                    <span>Permission to Email Legal Documents Signed & Received</span>
                  </label>
                </div>

                <div className="form-row" style={{ alignItems: "center" }}>
                  <div className="form-group">
                    <label>Permission to Test Signed & Received Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      disabled={!activeScreening.permissionToEmailReceived}
                      value={activeScreening.permissionToTestReceivedDate || ""}
                      onChange={(e) => handleBatonPass(e.target.value)}
                    />
                    {!activeScreening.permissionToEmailReceived && (
                      <p style={{ fontSize: "11px", color: "var(--accent-rose)", marginTop: "4px", fontWeight: "600" }}>
                        ⚠️ You must check off the Permission to Email Legal Documents form before logging test permission.
                      </p>
                    )}
                  </div>
                  {activeScreening.permissionToTestReceivedDate && (
                    <div style={{ padding: "12px", borderRadius: "6px", backgroundColor: "var(--accent-emerald-light)", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                      ✔ Baton Passed! Scanned & sent to School psychologist today.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 6: PSYCH TESTING (SCHOOL PSYCHOLOGIST)
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 5 ? "active" : currentPhaseIndex > 5 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 5 ? "✔" : "6"}</span>
              <h3>Psychologist Evaluation & Scoring</h3>
            </div>
            {currentPhaseIndex === 5 && (
              <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span>Baton Pass Date: <strong>{activeScreening.permissionToTestReceivedDate}</strong></span>
                  <span style={{ color: "var(--accent-rose)", fontWeight: "700" }}>
                    psychologist 60-Day Deadline: {addDays(activeScreening.permissionToTestReceivedDate, 60)} ({getDaysRemaining(addDays(activeScreening.permissionToTestReceivedDate, 60))} days remaining)
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>psychologist Full Scale IQ Score</label>
                    <input 
                      type="number"
                      className="input-field"
                      placeholder="e.g. 125"
                      value={activeScreening.psychIqScore || ""}
                      onChange={(e) => updateScreening(activeScreening.id, { psychIqScore: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>IQ Matrix Points (0 - 30)</label>
                    <select 
                      className="select-field"
                      value={activeScreening.psychPoints || 0}
                      onChange={(e) => {
                        const pts = parseInt(e.target.value, 10);
                        const newMatrix = { ...activeScreening.matrix };
                        newMatrix.cognition = { instrument: "WISC-V Full Scale IQ", score: activeScreening.psychIqScore, points: pts };
                        updateScreening(activeScreening.id, { psychPoints: pts, matrix: newMatrix });
                      }}
                    >
                      <option value="0">0 Points</option>
                      <option value="10">10 Points (IQ 123-125)</option>
                      <option value="15">15 Points (IQ 126-127)</option>
                      <option value="20">20 Points (IQ 128-129)</option>
                      <option value="25">25 Points (IQ 130-131)</option>
                      <option value="30">30 Points (IQ 132+)</option>
                    </select>
                  </div>
                </div>

                <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={activeScreening.psychResultsReceived || false}
                    onChange={(e) => updateScreening(activeScreening.id, { psychResultsReceived: e.target.checked })}
                  />
                  <strong>Psychological Results Received from School Psychologist</strong>
                </label>

                {activeScreening.psychResultsReceived && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => advanceStatus("Meeting Scheduled")}
                  >
                    Go to Schedule Placement Meeting
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 7: MEETING SCHEDULED
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 6 ? "active" : currentPhaseIndex > 6 ? "completed" : "locked"}`}>
            <div className="workflow-step-header">
              <span className="step-num">{currentPhaseIndex > 6 ? "✔" : "7"}</span>
              <h3>Eligibility / Placement Meeting</h3>
            </div>
            {currentPhaseIndex === 6 && (
              <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Scheduled Meeting Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={activeScreening.meetingDate || ""}
                      onChange={(e) => updateScreening(activeScreening.id, { meetingDate: e.target.value })}
                    />
                    {isMeetingDayWarning(activeScreening.meetingDate) && (
                      <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                        ⚠️ Warning: School psychologist only available Mondays & Thursdays.
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Invitation Sent Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={activeScreening.meetingInvitationSentDate || ""}
                      onChange={(e) => updateScreening(activeScreening.id, { meetingInvitationSentDate: e.target.value })}
                    />
                    {noticeDays !== null && noticeDays < 10 && !activeScreening.meetingNoticeWaived && (
                      <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                        🚨 Notice is less than 10 calendar days ({noticeDays} days). Waiver required!
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.meetingNoticeWaived || false}
                      onChange={(e) => updateScreening(activeScreening.id, { meetingNoticeWaived: e.target.checked })}
                    />
                    <strong>Parent Waived 10-day Meeting Notice Right</strong>
                  </label>
                </div>

                {/* Score check and finalize button */}
                <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Final Eligibility Scoring Audit</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px", marginBottom: "12px" }}>
                    <div>IQ Score: <strong>{activeScreening.psychIqScore}</strong> ({cognitionPts} pts)</div>
                    <div>Achievement: <strong>{activeScreening.matrix.performance.score}%ile</strong> ({performancePts} pts)</div>
                    <div>Creativity: <strong>{activeScreening.matrix.creativity.score}</strong> ({creativityPts} pts)</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Matrix Points:</span>
                      <h3 style={{ fontSize: "22px", color: totalPoints >= 50 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                        {totalPoints} / 90 Pts
                      </h3>
                    </div>
                    {totalPoints >= 50 && cognitionPts > 0 && performancePts > 0 && creativityPts > 0 && activeScreening.psychIqScore >= 123 ? (
                      <button 
                        className="btn btn-primary"
                        style={{ backgroundColor: "var(--accent-emerald)" }}
                        onClick={handleFinalizePlacement}
                      >
                        ✔ Finalize Placement (Add to Active Directory)
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary"
                        style={{ color: "var(--accent-rose)" }}
                        onClick={() => advanceStatus("Pending Discontinuation")}
                      >
                        Child Did Not Qualify - Close & Discontinue
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ==========================================
              PHASE 8: PENDING DISCONTINUATION
              ========================================== */}
          <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 7 ? "active" : "locked"}`} style={{ border: "1px solid var(--accent-rose)" }}>
            <div className="workflow-step-header" style={{ color: "var(--accent-rose)" }}>
              <span className="step-num" style={{ backgroundColor: "var(--accent-rose)", color: "white" }}>🚨</span>
              <h3>Pending Discontinuation Checklists</h3>
            </div>
            {currentPhaseIndex === 7 && (
              <div className="workflow-step-body" style={{ marginTop: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
                  This student failed to qualify for Gifted Services or parental consent was revoked. Ariel must complete administrative clear-downs:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.discontinuationPWNMailDate || false}
                      onChange={(e) => updateScreening(activeScreening.id, { discontinuationPWNMailDate: e.target.checked })}
                    />
                    <strong>Mailed Rejection Letter & Prior Written Notice (PWN) explaining qualifications.</strong>
                  </label>
                  <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="checkbox"
                      checked={activeScreening.discontinuationCumeFileDate || false}
                      onChange={(e) => updateScreening(activeScreening.id, { discontinuationCumeFileDate: e.target.checked })}
                    />
                    <strong>Returned all screening paperwork physically to the student's cumulative folder in the main office.</strong>
                  </label>
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ backgroundColor: "var(--accent-rose)", width: "100%" }}
                  disabled={!activeScreening.discontinuationPWNMailDate || !activeScreening.discontinuationCumeFileDate}
                  onClick={handleArchiveCase}
                >
                  Confirm Archive & Remove Student from Caseload
                </button>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }} className="glass-panel">
          <p>No screening profiles loaded. Add a student using the "Log Initial Referral" form.</p>
        </div>
      )}
    </div>
  );
}
