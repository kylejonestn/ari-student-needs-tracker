/* ==========================================
   Aegis Gifted Tracker - Reevaluation Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { store, addDays, getDaysRemaining, guessTeacherEmail } from "../utils/studentStore";
import { 
  ClipboardCheck, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  BookOpen,
  FileCheck,
  Send,
  UserCheck
} from "lucide-react";

export default function Reevaluation({ students, updateStudent }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students.filter(s => s.status === "Active" && s.reevalDueDate)[0]?.id || "");
  const [obsTimer, setObsTimer] = useState(2100); // 35 minutes in seconds (35 * 60 = 2100)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [obsNoteText, setObsNoteText] = useState("");
  const [showLogSuccess, setShowLogSuccess] = useState(false);

  // Meeting date day checks (Psychologist available Monday/Thursday only)
  const isMeetingDayWarning = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day !== 1 && day !== 4; // Monday = 1, Thursday = 4
  };

  // Handle survey request email mailto generator
  const handleEmailTeacherSurvey = () => {
    if (!activeStudent) return;
    const email = store.getState().workEmail || "ariel.facilitator@rcschools.net";
    const subject = encodeURIComponent(`[Aegis Action Required] Gifted Re-evaluation Survey for ${activeStudent.name}`);
    const body = encodeURIComponent(
      `Hi ${activeStudent.classroomTeacher || "Teacher"},\n\n` +
      `As part of the mandatory 3-year triennial re-evaluation process for ${activeStudent.name}, ` +
      `could you please complete the characteristics/behavior checklist as soon as possible?\n\n` +
      `We need this compiled at least 10 days before our upcoming meeting scheduled on ${activeStudent.reevalMeetingDate || "[Date TBD]"}.\n\n` +
      `Please let me know if you have any questions or need a print copy of the survey.\n\n` +
      `Thank you,\n` +
      `Ariel`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Sync selected student if list changes
  useEffect(() => {
    const reevalStudents = students.filter(s => s.status === "Active" && s.reevalDueDate);
    if (reevalStudents.length > 0 && (!selectedStudentId || !students.some(s => s.id === selectedStudentId))) {
      setSelectedStudentId(reevalStudents[0].id);
    }
  }, [students, selectedStudentId]);

  // Sync with global store selection changes (e.g. clicked on dashboard link)
  useEffect(() => {
    const checkGlobalSelection = () => {
      const globalStudentId = store.getState().selectedReevalStudentId;
      if (globalStudentId) {
        setSelectedStudentId(globalStudentId);
        // Clear deep-link keys to avoid locked focus states
        store.updateState({ selectedReevalStudentId: null });
      }
    };
    
    checkGlobalSelection();
    return store.subscribe(checkGlobalSelection);
  }, []);

  // Observation Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && obsTimer > 0) {
      interval = setInterval(() => {
        setObsTimer(prev => prev - 1);
      }, 1000);
    } else if (obsTimer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, obsTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogObservationNotes = () => {
    if (!activeStudent || !obsNoteText.trim()) return;
    
    // 1. Add log to student's SEL observations list
    const logs = activeStudent.selNeeds ? [...(activeStudent.selNeeds.logs || [])] : [];
    logs.unshift({
      date: new Date().toISOString().split("T")[0],
      note: `[Classroom Re-evaluation Observation - 35min]: ${obsNoteText.trim()}`
    });

    const selNeeds = {
      ...(activeStudent.selNeeds || {}),
      type: activeStudent.selNeeds?.type || "Asynchronous Development",
      logs
    };

    // 2. Mark observation complete
    updateStudent(activeStudent.id, {
      selNeeds,
      reevalDirectObservationCompleted: true,
      reevalDirectObservationDate: new Date().toISOString().split("T")[0]
    });

    setObsNoteText("");
    setObsTimer(2100);
    setShowLogSuccess(true);
    setTimeout(() => setShowLogSuccess(false), 2000);
  };

  const handleCompleteReeval = () => {
    if (!activeStudent) return;
    
    if (!activeStudent.reevalDirectObservationCompleted) {
      alert("Please complete the direct classroom student observation notes first.");
      return;
    }
    if (!activeStudent.reevalParentSurveyReturned || !activeStudent.reevalTeacherSurveyReturned || !activeStudent.reevalSelfSurveyCompleted) {
      alert("Please ensure all surveys (Parent, Teacher, and Facilitator) are completed/returned.");
      return;
    }
    if (!activeStudent.reevalPsychologistHandoffDate) {
      alert("Please complete the school psychologist handoff step before holding the meeting.");
      return;
    }

    // Set new reeval date 3 years in the future, clear meeting details
    const today = new Date().toISOString().split("T")[0];
    const newReevalDueDate = addDays(today, 3 * 365);
    
    updateStudent(activeStudent.id, {
      reevalDueDate: newReevalDueDate,
      reevalMeetingDate: "",
      reevalInvitationSentDate: "",
      reevalParentSurveyDispatched: false,
      reevalParentSurveyReturned: false,
      reevalTeacherSurveyDispatched: false,
      reevalTeacherSurveyReturned: false,
      reevalSelfSurveyCompleted: false,
      reevalDirectObservationCompleted: false,
      reevalDirectObservationDate: "",
      reevalPsychologistHandoffDate: "",
      reevalMeetingCompleted: false
    });

    alert(`Re-evaluation completed successfully for ${activeStudent.name}! The next triennial evaluation has been calendared for ${newReevalDueDate}.`);
  };

  const activeReevals = students.filter(s => s.status === "Active" && s.reevalDueDate).sort((a,b) => getDaysRemaining(a.reevalDueDate) - getDaysRemaining(b.reevalDueDate));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Selection Panel */}
      <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ClipboardCheck size={22} color="var(--accent-purple)" />
          <h2 style={{ fontSize: "18px" }}>Triennial Re-evaluations Center</h2>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px", fontWeight: "700" }}>Focus Student:</label>
          <select 
            className="select-field" 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{ minWidth: "220px" }}
          >
            {activeReevals.map(s => (
              <option key={s.id} value={s.id}>{s.name} (Due: {s.reevalDueDate})</option>
            ))}
            {activeReevals.length === 0 && <option value="">No students due for re-eval</option>}
          </select>
        </div>
      </div>

      {activeStudent ? (
        <div className="dashboard-columns">
          
          {/* Left Column: Workflow checklist & details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Stage Selector / Date Input */}
            <div className="glass-panel">
              <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Re-evaluation Schedule</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Scheduled Re-evaluation Meeting Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={activeStudent.reevalMeetingDate || ""}
                    onChange={(e) => updateStudent(activeStudent.id, { reevalMeetingDate: e.target.value })}
                  />
                  {isMeetingDayWarning(activeStudent.reevalMeetingDate) && (
                    <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                      ⚠️ Warning: School psychologist only available Mondays & Thursdays.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Meeting Invitation Sent Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={activeStudent.reevalInvitationSentDate || ""}
                    onChange={(e) => updateStudent(activeStudent.id, { reevalInvitationSentDate: e.target.value })}
                  />
                  {activeStudent.reevalMeetingDate && activeStudent.reevalInvitationSentDate && (
                    <div style={{ fontSize: "11px", marginTop: "4px" }}>
                      {(() => {
                        const mDate = new Date(activeStudent.reevalMeetingDate + "T00:00:00");
                        const iDate = new Date(activeStudent.reevalInvitationSentDate + "T00:00:00");
                        const days = Math.ceil((mDate.getTime() - iDate.getTime()) / (1000 * 60 * 60 * 24));
                        const isUnderBuffer = days < 20;
                        const isUnderLegal = days < 10;
                        
                        if (isUnderLegal) {
                          return <span style={{ color: "var(--accent-rose)", fontWeight: "700" }}>🚨 Legal Warning: Invitation notice is less than 10 calendar days ({days} days).</span>;
                        } else if (isUnderBuffer) {
                          return <span style={{ color: "var(--accent-amber)", fontWeight: "600" }}>⚠️ Notice is less than Ariel's 20-day buffer ({days} days).</span>;
                        } else {
                          return <span style={{ color: "var(--accent-emerald)", fontWeight: "600" }}>✔ Sent {days} days prior. On track with 20-day buffer.</span>;
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Surveys Dispatch & Return Tracker */}
            {activeStudent.reevalMeetingDate && (
              <div className="glass-panel">
                <h3 style={{ fontSize: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileCheck size={18} color="var(--accent-purple)" />
                  Re-evaluation Survey Checklists
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Send surveys to Parent, Gen Ed Teacher, and yourself to compile for the school psychologist.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Parent Survey */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ fontWeight: "600", fontSize: "13px", display: "block" }}>Parent Re-evaluation Survey</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Tracking parent concerns and home observations.</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "12px" }}>
                        <input 
                          type="checkbox"
                          checked={activeStudent.reevalParentSurveyDispatched || false}
                          onChange={(e) => updateStudent(activeStudent.id, { reevalParentSurveyDispatched: e.target.checked })}
                        />
                        <span>Sent</span>
                      </label>
                      <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "12px" }}>
                        <input 
                          type="checkbox"
                          checked={activeStudent.reevalParentSurveyReturned || false}
                          onChange={(e) => updateStudent(activeStudent.id, { reevalParentSurveyReturned: e.target.checked })}
                        />
                        <span>Returned</span>
                      </label>
                    </div>
                  </div>

                  {/* Teacher Survey */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ fontWeight: "600", fontSize: "13px", display: "block" }}>Teacher Re-evaluation Survey</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Behavior checklists from: {activeStudent.classroomTeacher}.</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "4px 8px", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px" }}
                        onClick={handleEmailTeacherSurvey}
                      >
                        <Send size={10} />
                        Email Survey Request to Teacher
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "12px" }}>
                        <input 
                          type="checkbox"
                          checked={activeStudent.reevalTeacherSurveyDispatched || false}
                          onChange={(e) => updateStudent(activeStudent.id, { reevalTeacherSurveyDispatched: e.target.checked })}
                        />
                        <span>Sent</span>
                      </label>
                      <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "12px" }}>
                        <input 
                          type="checkbox"
                          checked={activeStudent.reevalTeacherSurveyReturned || false}
                          onChange={(e) => updateStudent(activeStudent.id, { reevalTeacherSurveyReturned: e.target.checked })}
                        />
                        <span>Returned</span>
                      </label>
                    </div>
                  </div>

                  {/* Self/Facilitator Survey */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "4px" }}>
                    <div>
                      <span style={{ fontWeight: "600", fontSize: "13px", display: "block" }}>Facilitator IEP Input Survey</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Internal review of student progress.</span>
                    </div>
                    <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "12px" }}>
                      <input 
                        type="checkbox"
                        checked={activeStudent.reevalSelfSurveyCompleted || false}
                        onChange={(e) => updateStudent(activeStudent.id, { reevalSelfSurveyCompleted: e.target.checked })}
                      />
                      <span>Completed</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Psychologist Handoff Check */}
            {activeStudent.reevalMeetingDate && (
              <div className="glass-panel">
                <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>psychologist Compilation & Handoff</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-main)" }}>
                    All observations and surveys must be submitted to the School Psychologist at least <strong>10 days before the meeting</strong>.
                    Handoff deadline: <strong>{addDays(activeStudent.reevalMeetingDate, -10)}</strong>.
                  </p>
                  <div className="form-group">
                    <label>Handoff Completed Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={activeStudent.reevalPsychologistHandoffDate || ""}
                      onChange={(e) => updateStudent(activeStudent.id, { reevalPsychologistHandoffDate: e.target.value })}
                    />
                  </div>
                  {activeStudent.reevalPsychologistHandoffDate && (
                    <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--accent-emerald-light)", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                      ✔ Files packaged and handed off to school psychologist.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Finalize Meeting */}
            {activeStudent.reevalMeetingDate && (
              <div className="glass-panel" style={{ border: "1px solid var(--accent-purple)" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Conclude Re-evaluation</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Once the meeting is held and it is confirmed the student continues to receive gifted support, click below to log the renewal.
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", padding: "12px" }}
                  onClick={handleCompleteReeval}
                >
                  <UserCheck size={16} />
                  Conclude Meeting & Renew Services (3-Year Reset)
                </button>
              </div>
            )}

          </div>

          {/* Right Column: Direct Observation Timer widget */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-panel" style={{ height: "fit-content" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="var(--accent-rose)" />
                Direct Classroom Observation
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Due <strong>13 days</strong> before meeting. Sit in classroom for 35-40 minutes and log notes comparing the student's behavior to their peers.
              </p>

              {/* Timer UI widget */}
              <div style={{ 
                padding: "24px 16px", 
                borderRadius: "12px", 
                backgroundColor: "var(--bg-primary)", 
                border: "1px solid var(--border-color)",
                textAlign: "center",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "40px", fontWeight: "800", color: isTimerRunning ? "var(--accent-rose)" : "var(--text-heading)", fontFamily: "monospace", letterSpacing: "1px", marginBottom: "12px" }}>
                  {formatTime(obsTimer)}
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", gap: "4px" }}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                    {isTimerRunning ? "Pause" : "Start 35m"}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "6px", fontSize: "12px" }}
                    onClick={() => {
                      setIsTimerRunning(false);
                      setObsTimer(2100);
                    }}
                    title="Reset Timer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Log Notes Text Area */}
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700" }}>Live Observation Notes</label>
                <textarea 
                  rows={6}
                  className="textarea-field"
                  placeholder="Type notes in real-time here... Notes will be saved directly into the student's SEL observation history upon logging."
                  value={obsNoteText}
                  onChange={(e) => setObsNoteText(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {showLogSuccess && (
                  <span style={{ color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                    ✔ Logged and checked off!
                  </span>
                )}
                <button 
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={!obsNoteText.trim()}
                  onClick={handleLogObservationNotes}
                >
                  Log Notes & Check Off Observation
                </button>
              </div>

              {activeStudent.reevalDirectObservationCompleted && (
                <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--accent-emerald-light)", color: "var(--accent-emerald)", fontSize: "11px", fontWeight: "600", marginTop: "12px", textAlign: "center" }}>
                  ✔ Classroom observation completed on {activeStudent.reevalDirectObservationDate || "Date"}
                </div>
              )}
            </div>

            {/* Quick history of notes */}
            <div className="glass-panel" style={{ flexGrow: "1" }}>
              <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
                <BookOpen size={14} color="var(--accent-purple)" />
                SEL Observation Logs
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                {activeStudent.selNeeds?.logs && activeStudent.selNeeds.logs.map((log, idx) => (
                  <div key={idx} style={{ 
                    padding: "8px", 
                    borderRadius: "6px", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "var(--bg-primary)",
                    fontSize: "11px"
                  }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>{log.date}</span>
                    <p style={{ color: "var(--text-heading)", marginTop: "2px", fontWeight: "500" }}>{log.note}</p>
                  </div>
                ))}
                {(!activeStudent.selNeeds?.logs || activeStudent.selNeeds.logs.length === 0) && (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: "11px" }}>No previous logs.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }} className="glass-panel">
          <p>No active students are currently due for re-evaluations.</p>
        </div>
      )}
    </div>
  );
}
