/* ==========================================
   Aegis Gifted Tracker - SelStudio Component
   ========================================== */

import React, { useState } from "react";
import { SEL_STRATEGY_TEMPLATES } from "../utils/mockData";
import { Heart, Plus, BookOpen, AlertCircle, Sparkles } from "lucide-react";

export default function SelStudio({ students, updateStudent, addSelLog }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [newLogText, setNewLogText] = useState("");
  const [showAddLogMsg, setShowAddLogMsg] = useState(false);

  const activeStudent = students.find(s => s.id === selectedStudentId);

  const handleLogSubmit = (e) => {
    e.preventDefault();
    if (!activeStudent || !newLogText.trim()) return;

    addSelLog(activeStudent.id, newLogText.trim());
    setNewLogText("");

    setShowAddLogMsg(true);
    setTimeout(() => setShowAddLogMsg(false), 2000);
  };

  const handleNeedChange = (field, value) => {
    if (!activeStudent) return;
    const currentNeeds = { ...(activeStudent.selNeeds || {}) };
    currentNeeds[field] = value;
    
    updateStudent(activeStudent.id, { selNeeds: currentNeeds });
  };

  const handleAddStrategy = (strategyText) => {
    if (!activeStudent) return;
    const currentNeeds = { ...(activeStudent.selNeeds || {}) };
    const currentStrats = [...(currentNeeds.strategies || [])];
    
    if (currentStrats.includes(strategyText)) return;
    currentStrats.push(strategyText);
    currentNeeds.strategies = currentStrats;
    
    updateStudent(activeStudent.id, { selNeeds: currentNeeds });
  };

  const handleRemoveStrategy = (index) => {
    if (!activeStudent) return;
    const currentNeeds = { ...(activeStudent.selNeeds || {}) };
    const currentStrats = currentNeeds.strategies.filter((_, idx) => idx !== index);
    currentNeeds.strategies = currentStrats;
    
    updateStudent(activeStudent.id, { selNeeds: currentNeeds });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Selector banner */}
      <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Heart size={22} color="var(--accent-rose)" />
          <h2 style={{ fontSize: "18px" }}>Social-Emotional Learning (SEL) Studio</h2>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "700" }}>Focus Student:</label>
          <select 
            className="select-field" 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.filter(s => !s.deleted && s.status === "Active").map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
            ))}
          </select>
        </div>
      </div>

      {activeStudent ? (
        <div className="dashboard-columns">
          {/* Left Column: Student Specific SEL Details & Logs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Student Profile Configuration */}
            <div className="glass-panel">
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} color="var(--accent-purple)" />
                Focus Area for {activeStudent.name}
              </h3>
              
              <div className="form-group">
                <label>Focus Category</label>
                <select 
                  className="select-field"
                  value={activeStudent.selNeeds?.type || "Perfectionism & Anxiety"}
                  onChange={(e) => handleNeedChange("type", e.target.value)}
                >
                  <option value="Perfectionism & Anxiety">Perfectionism & Anxiety</option>
                  <option value="Asynchronous Development">Asynchronous Development</option>
                  <option value="Sensory & Emotional Overexcitability">Sensory & Emotional Overexcitability</option>
                  <option value="Twice-Exceptional (2e) Support">Twice-Exceptional (2e) Support</option>
                </select>
              </div>

              <div className="form-group">
                <label>Specific Observations & Context</label>
                <textarea 
                  rows={3}
                  className="textarea-field"
                  placeholder="e.g. Student exhibits extreme anxiety during timed math drills..."
                  value={activeStudent.selNeeds?.details || ""}
                  onChange={(e) => handleNeedChange("details", e.target.value)}
                />
              </div>

              {/* Active Strategies for student */}
              <div style={{ marginTop: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-heading)", display: "block", marginBottom: "8px" }}>
                  Active Strategies Selected
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {activeStudent.selNeeds?.strategies && activeStudent.selNeeds.strategies.map((strat, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-primary)",
                      fontSize: "12px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <span>{strat}</span>
                      <button 
                        style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", fontWeight: "600" }}
                        onClick={() => handleRemoveStrategy(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(!activeStudent.selNeeds?.strategies || activeStudent.selNeeds.strategies.length === 0) && (
                    <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>No strategies added yet. Click templates on the right to select.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Confidential facilitator Journal Logs */}
            <div className="glass-panel">
              <h3 style={{ fontSize: "16px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={18} color="var(--accent-purple)" />
                Confidential facilitator Logs
              </h3>
              <div style={{ padding: "8px", borderRadius: "6px", backgroundColor: "var(--accent-rose-light)", color: "var(--accent-rose)", fontSize: "11px", fontWeight: "600", display: "inline-flex", gap: "6px", alignItems: "center", marginBottom: "16px" }}>
                <AlertCircle size={14} /> Only saved to all-data.json. Excluded from parent logs!
              </div>

              <form onSubmit={handleLogSubmit} style={{ marginBottom: "20px" }}>
                <div className="form-group">
                  <label>Add Observation Journal Note</label>
                  <textarea 
                    rows={3}
                    className="textarea-field"
                    placeholder="Log daily observations, behavioral trends, or breakthroughs..."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {showAddLogMsg && (
                    <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                      ✔ Note logged successfully!
                    </span>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px", marginLeft: "auto" }}>
                    Log Note
                  </button>
                </div>
              </form>

              {/* Display Log Lists */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                {activeStudent.selNeeds?.logs && activeStudent.selNeeds.logs.map((log, idx) => (
                  <div key={idx} style={{ 
                    padding: "10px", 
                    borderRadius: "6px", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "var(--bg-primary)",
                    fontSize: "12px"
                  }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "10px", display: "block", marginBottom: "4px" }}>{log.date}</span>
                    <p style={{ color: "var(--text-heading)", fontWeight: "500" }}>{log.note}</p>
                  </div>
                ))}
                {(!activeStudent.selNeeds?.logs || activeStudent.selNeeds.logs.length === 0) && (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "12px", padding: "20px" }}>No observation logs recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Prepopulated Expert Strategy Templates */}
          <div className="glass-panel" style={{ height: "fit-content" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Expert Strategy Templates</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {SEL_STRATEGY_TEMPLATES.map((tmpl, idx) => (
                <div key={idx} style={{ 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)"
                }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px", color: "var(--accent-purple)" }}>{tmpl.need}</h4>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>{tmpl.description}</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {tmpl.strategies.map((strat, sIdx) => (
                      <button
                        key={sIdx}
                        className="btn btn-secondary"
                        style={{ 
                          padding: "4px 8px", 
                          fontSize: "11px", 
                          textAlign: "left", 
                          justifyContent: "flex-start",
                          border: "1px solid transparent"
                        }}
                        onClick={() => handleAddStrategy(strat)}
                        title="Click to add to student's active plan"
                      >
                        + {strat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }} className="glass-panel">
          <p>Please enroll active students in the Student Directory first.</p>
        </div>
      )}
    </div>
  );
}
