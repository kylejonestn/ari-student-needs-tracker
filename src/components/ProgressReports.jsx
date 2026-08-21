/* ==========================================
   Aegis Gifted Tracker - ProgressReports Component
   ========================================== */

import React, { useState } from "react";
import { store } from "../utils/studentStore";
import { FileText, Save, CheckCircle, Download, FileSpreadsheet } from "lucide-react";

export default function ProgressReports({ students, saveProgressReport }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [quarter, setQuarter] = useState("Q4"); // Default current quarter (May 2026 is Q4!)

  // Sync with global store selection changes (e.g. clicked on dashboard link)
  React.useEffect(() => {
    const checkGlobalSelection = () => {
      const globalStudentId = store.getState().selectedProgressStudentId;
      const globalQuarter = store.getState().selectedProgressQuarter;
      if (globalStudentId) {
        setSelectedStudentId(globalStudentId);
        if (globalQuarter) {
          setQuarter(globalQuarter);
        }
        // Clear deep-link keys to avoid locked focus states
        store.updateState({ selectedProgressStudentId: null, selectedProgressQuarter: null });
      }
    };
    
    checkGlobalSelection();
    return store.subscribe(checkGlobalSelection);
  }, []);
  
  // Goal Categories
  const GOAL_CATEGORIES = [
    "Advanced ELA",
    "Advanced Math",
    "Advanced Science",
    "Advanced Social Studies",
    "Pre-vocational",
    "Transitional",
    "Social Emotional",
    "Behavioral"
  ];

  const [masterGoals, setMasterGoals] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [commentMap, setCommentMap] = useState({});
  const [generalComment, setGeneralComment] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("Advanced ELA");
  const [activeCategoryEditId, setActiveCategoryEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Sync state if student changes
  React.useEffect(() => {
    if (!activeStudent) return;

    // Load master goals from student profile, default if none exist
    let master = activeStudent.progressReportGoals;
    if (!master || master.length === 0) {
      master = [
        { id: "g-1", title: "Demonstrate mastery in advanced pacing and curriculum compacting", category: "Advanced ELA" },
        { id: "g-2", title: "Engage in self-directed research projects and independent study", category: "Social Emotional" }
      ];
      // Save default list to the student profile
      store.updateStudent(activeStudent.id, { progressReportGoals: master });
    }
    setMasterGoals(master);

    // Load quarter-specific progress and comments
    const existing = activeStudent.progressReports?.find(r => r.quarter === quarter);
    const newProg = {};
    const newComm = {};

    if (existing && existing.goals) {
      existing.goals.forEach((g, idx) => {
        const key = g.id || `g-idx-${idx}`;
        newProg[key] = g.progress || "Progressing";
        newComm[key] = g.comment || "";
      });
      setGeneralComment(existing.generalComment || "");
    } else {
      master.forEach(g => {
        newProg[g.id] = "Progressing";
        newComm[g.id] = "";
      });
      setGeneralComment("");
    }
    setProgressMap(newProg);
    setCommentMap(newComm);
  }, [selectedStudentId, quarter, students]);

  const handleAddGoal = () => {
    if (!newGoalTitle.trim() || !activeStudent) return;
    const newGoal = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: newGoalCategory
    };

    const updated = [...masterGoals, newGoal];
    setMasterGoals(updated);
    store.updateStudent(activeStudent.id, { progressReportGoals: updated });

    setProgressMap(prev => ({ ...prev, [newGoal.id]: "Progressing" }));
    setCommentMap(prev => ({ ...prev, [newGoal.id]: "" }));
    setNewGoalTitle("");
  };

  const handleDeleteGoal = (goalId) => {
    if (!activeStudent) return;
    const updated = masterGoals.filter(g => g.id !== goalId);
    setMasterGoals(updated);
    store.updateStudent(activeStudent.id, { progressReportGoals: updated });

    const newProg = { ...progressMap };
    const newComm = { ...commentMap };
    delete newProg[goalId];
    delete newComm[goalId];
    setProgressMap(newProg);
    setCommentMap(newComm);
  };

  const handleUpdateMasterGoal = (goalId, fields) => {
    if (!activeStudent) return;
    const updated = masterGoals.map(g => (g.id === goalId ? { ...g, ...fields } : g));
    setMasterGoals(updated);
    store.updateStudent(activeStudent.id, { progressReportGoals: updated });
  };

  const showToast = (msg) => {
    store.updateState({
      toastMessage: msg,
      toastStudentId: activeStudent.id,
      toastQuarter: quarter
    });
    setTimeout(() => {
      const current = store.getState();
      if (current.toastMessage === msg) {
        store.updateState({
          toastMessage: "",
          toastStudentId: null,
          toastQuarter: null
        });
      }
    }, 4000);
  };

  const triggerAutoSave = (updatedGoals, updatedGeneralComment) => {
    if (!activeStudent) return;
    saveProgressReport(activeStudent.id, {
      quarter,
      date: new Date().toISOString().split("T")[0],
      goals: updatedGoals,
      generalComment: updatedGeneralComment !== undefined ? updatedGeneralComment : generalComment
    });
  };

  const handleProgressChange = (goalId, val) => {
    const newProg = { ...progressMap, [goalId]: val };
    setProgressMap(newProg);

    const compiled = masterGoals.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: newProg[g.id] || "Progressing",
      comment: commentMap[g.id] || ""
    }));
    triggerAutoSave(compiled);

    const goal = masterGoals.find(g => g.id === goalId);
    const idx = masterGoals.indexOf(goal) + 1;
    showToast(`Auto-saved ${activeStudent.name}'s ${quarter} progress for Goal ${idx}`);
  };

  const handleCommentBlur = (goalId) => {
    const compiled = masterGoals.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: progressMap[g.id] || "Progressing",
      comment: commentMap[g.id] || ""
    }));
    triggerAutoSave(compiled);

    const goal = masterGoals.find(g => g.id === goalId);
    const idx = masterGoals.indexOf(goal) + 1;
    showToast(`Auto-saved ${activeStudent.name}'s ${quarter} notes for Goal ${idx}`);
  };

  const handleGeneralCommentBlur = (val) => {
    const compiled = masterGoals.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: progressMap[g.id] || "Progressing",
      comment: commentMap[g.id] || ""
    }));
    triggerAutoSave(compiled, val);
    showToast(`Auto-saved ${activeStudent.name}'s ${quarter} general comment narrative`);
  };

  const handleStudentChange = (newId) => {
    handleSave();
    setSelectedStudentId(newId);
  };

  const handleQuarterChange = (newQuarter) => {
    handleSave();
    setQuarter(newQuarter);
  };

  const handleSave = () => {
    if (!activeStudent) return;
    
    const compiledGoals = masterGoals.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: progressMap[g.id] || "Progressing",
      comment: commentMap[g.id] || ""
    }));

    saveProgressReport(activeStudent.id, {
      quarter,
      date: new Date().toISOString().split("T")[0],
      goals: compiledGoals,
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
        <>
          <div className="interactive-report-editor" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Controls Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group" style={{ position: "relative" }} ref={dropdownRef}>
              <label>Select Student</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={activeStudent ? `${activeStudent.name} (${activeStudent.grade})` : "Search student..."}
                  value={isDropdownOpen ? searchQuery : (activeStudent ? `${activeStudent.name} (${activeStudent.grade})` : "")}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    setSearchQuery("");
                  }}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "10px", color: "var(--text-muted)" }}>
                  ▼
                </span>
                
                {isDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                    marginTop: "4px"
                  }}>
                    {students
                      .filter(s => {
                        if (!searchQuery) return true;
                        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               s.grade.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            handleStudentChange(s.id);
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          style={{
                            padding: "8px 12px",
                            fontSize: "13px",
                            cursor: "pointer",
                            backgroundColor: s.id === selectedStudentId ? "var(--accent-purple-light)" : "transparent",
                            color: s.id === selectedStudentId ? "var(--accent-purple)" : "var(--text-main)",
                            fontWeight: s.id === selectedStudentId ? "700" : "normal",
                            borderBottom: "1px solid var(--border-color)",
                            textAlign: "left"
                          }}
                        >
                          {s.name} ({s.grade})
                        </div>
                      ))}
                    {students.filter(s => {
                      if (!searchQuery) return true;
                      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.grade.toLowerCase().includes(searchQuery.toLowerCase());
                    }).length === 0 && (
                      <div style={{ padding: "8px 12px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "left" }}>
                        No students found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Select Grading Quarter</label>
              <select 
                className="select-field" 
                value={quarter} 
                onChange={(e) => handleQuarterChange(e.target.value)}
              >
                <option value="Q1">Q1 Progress Report</option>
                <option value="Q2">Q2 Progress Report</option>
                <option value="Q3">Q3 Progress Report</option>
                <option value="Q4">Q4 Progress Report</option>
              </select>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border-color)" }} />

          {/* Section A: Goals Management */}
          <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-sidebar)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--accent-purple)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>1. Manage Active IEP Goals for {activeStudent.name}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>({masterGoals.length} / 5 Goals)</span>
            </h3>

            {/* List of current master goals */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {masterGoals.map((g, idx) => (
                <div key={g.id} style={{ display: "flex", gap: "10px", alignItems: "center", backgroundColor: "var(--bg-primary)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <span style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "12px" }}>#{idx + 1}</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <textarea 
                      className="textarea-field" 
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "13px", 
                        fontWeight: "600", 
                        border: "none", 
                        background: "transparent", 
                        borderBottom: "1px dashed var(--border-color)", 
                        borderRadius: 0,
                        width: "100%",
                        resize: "vertical",
                        minHeight: "44px",
                        fontFamily: "inherit",
                        color: "var(--text-main)",
                        lineHeight: "1.4"
                      }}
                      value={g.title}
                      onChange={(e) => handleUpdateMasterGoal(g.id, { title: e.target.value })}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryEditId(activeCategoryEditId === g.id ? null : g.id)}
                        style={{
                          padding: "3px 10px",
                          fontSize: "10px",
                          borderRadius: "9999px",
                          backgroundColor: "var(--accent-purple-light)",
                          color: "var(--accent-purple)",
                          border: "1px solid var(--accent-purple)",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        🏷️ {g.category} <span style={{ fontSize: "8px", opacity: 0.6 }}>▼</span>
                      </button>

                      {activeCategoryEditId === g.id && (
                        <div style={{ 
                          display: "flex", 
                          flexWrap: "wrap", 
                          gap: "6px", 
                          marginTop: "4px", 
                          padding: "8px", 
                          backgroundColor: "var(--bg-sidebar)", 
                          borderRadius: "6px", 
                          border: "1px solid var(--border-color)",
                          width: "100%"
                        }}>
                          {GOAL_CATEGORIES.map(cat => {
                            const isSelected = g.category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  handleUpdateMasterGoal(g.id, { category: cat });
                                  setActiveCategoryEditId(null);
                                }}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "9px",
                                  borderRadius: "9999px",
                                  border: isSelected ? "1px solid var(--accent-purple)" : "1px solid var(--border-color)",
                                  backgroundColor: isSelected ? "var(--accent-purple-light)" : "var(--bg-primary)",
                                  color: isSelected ? "var(--accent-purple)" : "var(--text-muted)",
                                  cursor: "pointer"
                                }}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "4px 8px", fontSize: "11px", color: "var(--accent-rose)", borderColor: "var(--accent-rose-light)" }}
                    onClick={() => handleDeleteGoal(g.id)}
                    title="Remove Goal"
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {masterGoals.length === 0 && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "10px" }}>
                  No goals defined yet. Add up to 5 goals below.
                </p>
              )}
            </div>

            {/* Form to add a new goal */}
            {masterGoals.length < 5 && (
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: "700", margin: 0 }}>Add New Goal</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Describe the student's advanced academic or behavioral goal..."
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    style={{ flex: 1, fontSize: "12px" }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddGoal} 
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    disabled={!newGoalTitle.trim()}
                    type="button"
                  >
                    + Add Goal
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Goal Category</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {GOAL_CATEGORIES.map(cat => {
                      const isSelected = newGoalCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewGoalCategory(cat)}
                          style={{
                            padding: "3px 10px",
                            fontSize: "10px",
                            borderRadius: "9999px",
                            border: isSelected ? "1px solid var(--accent-purple)" : "1px solid var(--border-color)",
                            backgroundColor: isSelected ? "var(--accent-purple-light)" : "transparent",
                            color: isSelected ? "var(--accent-purple)" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr style={{ borderColor: "var(--border-color)" }} />

          {/* Section B: Quarter Goal Progress Editor */}
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--accent-purple)" }}>
              2. IEP Goals Performance Indicators for {quarter}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {masterGoals.map((g, idx) => (
                <div key={g.id} style={{ 
                  padding: "16px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)", 
                  backgroundColor: "var(--bg-primary)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-heading)" }}>Goal #{idx + 1}: {g.title}</span>
                      <span style={{ 
                        padding: "2px 8px",
                        fontSize: "10px",
                        borderRadius: "4px",
                        backgroundColor: "var(--accent-purple-light)",
                        color: "var(--accent-purple)",
                        fontWeight: "600"
                      }}>{g.category}</span>
                    </div>
                    <select 
                      className="select-field" 
                      style={{ padding: "4px 8px", fontSize: "12px", width: "auto" }}
                      value={progressMap[g.id] || "Progressing"}
                      onChange={(e) => handleProgressChange(g.id, e.target.value)}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Progressing">Progressing</option>
                      <option value="Near Mastery">Near Mastery</option>
                      <option value="Achieved">Achieved / Mastered</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Specific Progress Comments</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Sarah has shown outstanding leadership in ELA seminars..."
                      value={commentMap[g.id] || ""}
                      onChange={(e) => setCommentMap(prev => ({ ...prev, [g.id]: e.target.value }))}
                      onBlur={() => handleCommentBlur(g.id)}
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
              onBlur={(e) => handleGeneralCommentBlur(e.target.value)}
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

        {/* Printable Report Layout (Hidden in Web View, Visible in Print View) */}
        <div className="print-only-report">
          <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid var(--text-heading)", paddingBottom: "10px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-heading)", textTransform: "uppercase", margin: "0 0 4px 0" }}>
              Gifted IEP Progress Report
            </h1>
            <h2 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", margin: 0 }}>
              Rutherford County Schools
            </h2>
          </div>

          {/* Student Metadata Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700", width: "20%" }}>Student Name:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", width: "30%" }}>{activeStudent.name}</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700", width: "20%" }}>Date:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", width: "30%" }}>{new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700" }}>Grade:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)" }}>{activeStudent.grade}</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700" }}>Grading Quarter:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)" }}>{quarter} Academic Term</td>
              </tr>
              <tr>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700" }}>School:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)" }}>{activeStudent.school || "Rutherford Co. School"}</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)", fontWeight: "700" }}>IEP Due Date:</td>
                <td style={{ padding: "6px", border: "1px solid var(--border-color)" }}>{activeStudent.iepDueDate || "N/A"}</td>
              </tr>
            </tbody>
          </table>

          {/* Goals Progress Table */}
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
            IEP Direct Goals Progress Status
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "8px", border: "1px solid var(--border-color)", textAlign: "left", width: "5%" }}>#</th>
                <th style={{ padding: "8px", border: "1px solid var(--border-color)", textAlign: "left", width: "45%" }}>Goal Description & Category</th>
                <th style={{ padding: "8px", border: "1px solid var(--border-color)", textAlign: "center", width: "15%" }}>Progress Status</th>
                <th style={{ padding: "8px", border: "1px solid var(--border-color)", textAlign: "left", width: "35%" }}>Progress Comments / Evidences</th>
              </tr>
            </thead>
            <tbody>
              {masterGoals.map((g, idx) => (
                <tr key={g.id}>
                  <td style={{ padding: "8px", border: "1px solid var(--border-color)", fontWeight: "700", verticalAlign: "top" }}>{idx + 1}</td>
                  <td style={{ padding: "8px", border: "1px solid var(--border-color)", verticalAlign: "top" }}>
                    <div style={{ fontWeight: "700", marginBottom: "4px", fontSize: "12px" }}>{g.title}</div>
                    <span style={{ fontSize: "9px", color: "var(--accent-purple)", backgroundColor: "var(--accent-purple-light)", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                      {g.category}
                    </span>
                  </td>
                  <td style={{ padding: "8px", border: "1px solid var(--border-color)", textAlign: "center", verticalAlign: "top", fontWeight: "700" }}>
                    <span>{progressMap[g.id] || "Progressing"}</span>
                  </td>
                  <td style={{ padding: "8px", border: "1px solid var(--border-color)", verticalAlign: "top", color: "var(--text-main)" }}>
                    {commentMap[g.id] || "Goal progress is on track."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Narrative Summary */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
              Facilitator Narrative Comments Summary
            </h3>
            <div style={{ padding: "12px", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#fff", minHeight: "80px", fontSize: "11px", lineHeight: "1.5" }}>
              {generalComment || "Satisfactory progress observed during this term."}
            </div>
          </div>

          {/* Signatures Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "50px", fontSize: "11px" }}>
            <div>
              <div style={{ borderBottom: "1px solid #333", height: "30px", marginBottom: "4px" }}></div>
              <strong>Facilitator Signature</strong>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #333", height: "30px", marginBottom: "4px" }}></div>
              <strong>Parent/Guardian Signature</strong>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
        <p>Please add active students in the Student Directory first to write reports.</p>
      </div>
    )}


    </div>
  );
}
