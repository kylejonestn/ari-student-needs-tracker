/* ==========================================
   Aegis Gifted Tracker - ProgressReports Component
   ========================================== */

import React, { useState } from "react";
import { FileText, Save, CheckCircle, Download, FileSpreadsheet } from "lucide-react";

export default function ProgressReports({ students, saveProgressReport }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [quarter, setQuarter] = useState("Q4"); // Default current quarter (May 2026 is Q4!)
  
  // Goals report state
  const [goals, setGoals] = useState([
    { title: "Advanced Analytical Reading", progress: "Progressing", comment: "" },
    { title: "Managing Task Perfectionism", progress: "Progressing", comment: "" }
  ]);
  const [generalComment, setGeneralComment] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Sync state if student changes
  React.useEffect(() => {
    if (!activeStudent) return;
    const existing = activeStudent.progressReports?.find(r => r.quarter === quarter);
    if (existing) {
      setGoals(existing.goals || []);
      setGeneralComment(existing.generalComment || "");
    } else {
      // Setup initial goals from accommodations or standard templates
      const initialGoals = activeStudent.accommodations?.slice(0, 2).map(acc => ({
        title: `Goal: Mastery in ${acc}`,
        progress: "Progressing",
        comment: ""
      })) || [
        { title: "Academic Pacing Mastery", progress: "Progressing", comment: "" },
        { title: "Independent Topic Deep-Dive", progress: "Progressing", comment: "" }
      ];
      setGoals(initialGoals);
      setGeneralComment("");
    }
  }, [selectedStudentId, quarter, students]);

  const handleGoalChange = (idx, field, value) => {
    const updated = [...goals];
    updated[idx][field] = value;
    setGoals(updated);
  };

  const handleSave = () => {
    if (!activeStudent) return;
    
    saveProgressReport(activeStudent.id, {
      quarter,
      date: new Date().toISOString().split("T")[0],
      goals,
      generalComment
    });

    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const handleSimulatePrint = () => {
    alert("Simulated: progress report compiled. A print-friendly formatting layout has been prepared for browser print settings.");
    window.print();
  };

  return (
    <div className="glass-panel">
      <div className="section-header">
        <h2>Quarterly IEP Progress Reports Writer</h2>
        <span className="timeline-badge warning" style={{ fontWeight: "700" }}>Quarterly Mandate</span>
      </div>

      {activeStudent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Controls Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label>Select Student</label>
              <select 
                className="select-field" 
                value={selectedStudentId} 
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Grading Quarter</label>
              <select 
                className="select-field" 
                value={quarter} 
                onChange={(e) => setQuarter(e.target.value)}
              >
                <option value="Q1">Q1 Progress Report</option>
                <option value="Q2">Q2 Progress Report</option>
                <option value="Q3">Q3 Progress Report</option>
                <option value="Q4">Q4 Progress Report</option>
              </select>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)" }} />

          {/* Goal Matrices Editors */}
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>IEP Direct Goals Performance Indicators</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {goals.map((goal, idx) => (
                <div key={idx} style={{ 
                  padding: "16px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)", 
                  backgroundColor: "var(--bg-primary)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)" }}>{goal.title}</span>
                    <select 
                      className="select-field" 
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      value={goal.progress}
                      onChange={(e) => handleGoalChange(idx, "progress", e.target.value)}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Progressing">Progressing</option>
                      <option value="Near Mastery">Near Mastery</option>
                      <option value="Achieved">Achieved / Mastered</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Specific Progress Comments</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Sarah has shown outstanding leadership during the advanced ELA seminars..."
                      value={goal.comment}
                      onChange={(e) => handleGoalChange(idx, "comment", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Comments Narrative */}
          <div className="form-group">
            <label>General Facilitator Narrative Comments</label>
            <textarea 
              rows={4}
              className="textarea-field" 
              placeholder="Provide a summary of accommodations delivered and Social-Emotional progress noticed..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          {/* Footer Save Operations */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
            {showSavedMsg && (
              <span style={{ color: "var(--accent-emerald)", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={16} /> Progress report saved & synced!
              </span>
            )}
            <button className="btn btn-secondary" onClick={handleSimulatePrint}>
              <Download size={14} />
              Print / Export PDF
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={14} />
              Save Progress Report
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          <p>Please add active students in the Student Directory first to write reports.</p>
        </div>
      )}
    </div>
  );
}
