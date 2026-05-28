/* ==========================================
   Aegis Gifted Tracker - ScreeningGrid Component
   ========================================== */

import React, { useState } from "react";
import { store } from "../utils/studentStore";
import { Check, ClipboardList, UserCheck, AlertCircle, Plus, Calendar } from "lucide-react";

export default function ScreeningGrid({ screenings, addScreening, updateScreening, placeStudent }) {
  const [selectedScreenId, setSelectedScreenId] = useState(screenings[0]?.id || "");
  const [showAddReferral, setShowAddReferral] = useState(false);
  
  // Referral Form State
  const [refName, setRefName] = useState("");
  const [refGrade, setRefGrade] = useState("6th");
  const [refTeacher, setRefTeacher] = useState("");

  const activeScreening = screenings.find(s => s.id === selectedScreenId);

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
    }, 50);
  };

  const handleUpdateMatrix = (category, instrument, score, points) => {
    if (!activeScreening) return;
    
    const currentMatrix = { ...activeScreening.matrix };
    currentMatrix[category] = { instrument, score: parseFloat(score) || 0, points: parseInt(points, 10) || 0 };
    
    updateScreening(activeScreening.id, { matrix: currentMatrix });
  };

  const handleConsentDate = (dateStr) => {
    if (!activeScreening) return;
    
    updateScreening(activeScreening.id, { 
      consentReceivedDate: dateStr,
      status: dateStr ? "Evaluation in Progress" : "Consent Pending"
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

  // Matrix calculation values
  const cognitionPts = activeScreening?.matrix?.cognition?.points || 0;
  const performancePts = activeScreening?.matrix?.performance?.points || 0;
  const creativityPts = activeScreening?.matrix?.creativity?.points || 0;
  const totalPoints = cognitionPts + performancePts + creativityPts;

  // Tennessee mandate checklist rules:
  // 1. Total score >= 50
  // 2. Score in at least the "First range" (points > 0) on Cognition
  // 3. Score in at least the "First range" (points > 0) on Educational Performance
  // 4. Points are scored on Creativity
  const isEligible = totalPoints >= 50 && cognitionPts > 0 && performancePts > 0 && creativityPts > 0;

  return (
    <div>
      {/* Tab Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "700" }}>Select Student in Screening:</label>
          <select 
            className="select-field" 
            value={selectedScreenId} 
            onChange={(e) => setSelectedScreenId(e.target.value)}
            style={{ minWidth: "220px" }}
          >
            {screenings.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.grade} • {s.status})</option>
            ))}
            {screenings.length === 0 && <option value="">No Active Screenings</option>}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddReferral(!showAddReferral)}>
          <Plus size={16} />
          {showAddReferral ? "View Matrix calculator" : "Log Initial Referral"}
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
                  placeholder="e.g. Liam Taylor"
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
                placeholder="e.g. Ms. Davis (Social Studies)"
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

      {/* Main Scoring Grid Matrix */}
      {activeScreening ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Step 1: Consent Checklist & 60-day calendar marker */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Consent & Evaluation Timeline</h3>
            <div className="form-row" style={{ alignItems: "center" }}>
              <div className="form-group">
                <label>Parental Consent Signed & Received Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={activeScreening.consentReceivedDate || ""}
                  onChange={(e) => handleConsentDate(e.target.value)}
                />
              </div>

              <div style={{ 
                padding: "16px", 
                borderRadius: "8px", 
                backgroundColor: activeScreening.consentReceivedDate ? "var(--bg-primary)" : "var(--accent-rose-light)",
                border: `1px solid ${activeScreening.consentReceivedDate ? "var(--border-color)" : "var(--accent-rose)"}`,
                fontSize: "13px"
              }}>
                <p style={{ fontWeight: "700", color: activeScreening.consentReceivedDate ? "var(--text-heading)" : "var(--accent-rose)" }}>
                  {activeScreening.consentReceivedDate ? (
                    <span>
                      ✔ TN 60-Day Calendar Activated! Due: {
                        new Date(new Date(activeScreening.consentReceivedDate).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                      }
                    </span>
                  ) : (
                    <span>🚨 parental Consent Needed to start evaluation! 60-day calendar is locked.</span>
                  )}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
                  Under TN Rules, Ariel has 60 calendar days from the date of written parental consent to complete all cognitive, performance, and creative testing.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Interactive TN Assessment Matrix scoring */}
          <div className="glass-panel">
            <div className="section-header">
              <h2>Tennessee K-12 Intellectually Gifted Assessment Grid</h2>
              <span className="timeline-badge on-track" style={{ fontWeight: "700" }}>TN IGAM Standard</span>
            </div>

            <div className="scoring-grid-container">
              {/* Category 1: Cognition */}
              <div className="score-card">
                <h3>1. Cognition / Intelligence</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Standardized tests of intelligence (WISC, RIAS, Stanford-Binet)</p>
                <div className="scoring-rows">
                  <div className="form-group">
                    <label>Test Instrument</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. WISC-V IQ"
                      value={activeScreening.matrix.cognition.instrument || ""}
                      onChange={(e) => handleUpdateMatrix("cognition", e.target.value, activeScreening.matrix.cognition.score, activeScreening.matrix.cognition.points)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Score (IQ or %ile)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="e.g. 130"
                      value={activeScreening.matrix.cognition.score || ""}
                      onChange={(e) => handleUpdateMatrix("cognition", activeScreening.matrix.cognition.instrument, e.target.value, activeScreening.matrix.cognition.points)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700" }}>TN Matrix Point Assignment</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[10, 15, 20, 25, 30].map(pts => (
                        <button 
                          key={pts}
                          type="button"
                          className={`score-badge-matrix ${cognitionPts === pts ? "active" : ""}`}
                          onClick={() => handleUpdateMatrix("cognition", activeScreening.matrix.cognition.instrument, activeScreening.matrix.cognition.score, pts)}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 2: Educational Performance */}
              <div className="score-card">
                <h3>2. Educational Performance</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Standardized achievement tests (TCAP ELA/Math, Woodcock-Johnson)</p>
                <div className="scoring-rows">
                  <div className="form-group">
                    <label>Achievement Instrument</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. TCAP ELA %ile"
                      value={activeScreening.matrix.performance.instrument || ""}
                      onChange={(e) => handleUpdateMatrix("performance", e.target.value, activeScreening.matrix.performance.score, activeScreening.matrix.performance.points)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Percentile (%ile)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="e.g. 98"
                      value={activeScreening.matrix.performance.score || ""}
                      onChange={(e) => handleUpdateMatrix("performance", activeScreening.matrix.performance.instrument, e.target.value, activeScreening.matrix.performance.points)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700" }}>TN Matrix Point Assignment</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[5, 10, 15, 20, 25].map(pts => (
                        <button 
                          key={pts}
                          type="button"
                          className={`score-badge-matrix ${performancePts === pts ? "active" : ""}`}
                          onClick={() => handleUpdateMatrix("performance", activeScreening.matrix.performance.instrument, activeScreening.matrix.performance.score, pts)}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 3: Creativity/Characteristics */}
              <div className="score-card">
                <h3>3. Creativity / Characteristics</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Tests of creativity (Torrance Test TTCT) or behavior rating scales (SIGS)</p>
                <div className="scoring-rows">
                  <div className="form-group">
                    <label>Creativity Assessment</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Renzulli Scale"
                      value={activeScreening.matrix.creativity.instrument || ""}
                      onChange={(e) => handleUpdateMatrix("creativity", e.target.value, activeScreening.matrix.creativity.score, activeScreening.matrix.creativity.points)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Percentile or Score</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="e.g. 95"
                      value={activeScreening.matrix.creativity.score || ""}
                      onChange={(e) => handleUpdateMatrix("creativity", activeScreening.matrix.creativity.instrument, e.target.value, activeScreening.matrix.creativity.points)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700" }}>TN Matrix Point Assignment</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[5, 10, 15, 20, 25].map(pts => (
                        <button 
                          key={pts}
                          type="button"
                          className={`score-badge-matrix ${creativityPts === pts ? "active" : ""}`}
                          onClick={() => handleUpdateMatrix("creativity", activeScreening.matrix.creativity.instrument, activeScreening.matrix.creativity.score, pts)}
                        >
                          {pts}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Total Score Aggregator Panel */}
            <div className="matrix-summary-bar">
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "500" }}>Combined Grid Score</p>
                <span className="total-score-badge">{totalPoints} / 90 Points</span>
              </div>

              <div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "500", textAlign: "right" }}>Eligibility Status</p>
                {isEligible ? (
                  <span className="eligibility-status-text eligible" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <UserCheck size={18} />
                    Qualifies for Services (50+)
                  </span>
                ) : (
                  <span className="eligibility-status-text ineligible" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={18} />
                    Incomplete / Under 50 pts
                  </span>
                )}
              </div>
            </div>

            {/* placement finalizer trigger */}
            {isEligible && (
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  fontSize: "15px", 
                  backgroundColor: "var(--accent-emerald)",
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
                }}
                onClick={handleFinalizePlacement}
              >
                <Check size={20} />
                Finalize Special Education Placement (Move to Active Students)
              </button>
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
