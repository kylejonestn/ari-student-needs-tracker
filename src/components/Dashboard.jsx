/* ==========================================
   Aegis Gifted Tracker - Dashboard Component
   ========================================== */

import React, { useState } from "react";
import { 
  store,
  calculateTimelines, 
  getDaysRemaining 
} from "../utils/studentStore";
import { 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Bell, 
  Send,
  Calendar,
  CheckCircle,
  FileCheck,
  Printer,
  Sparkles,
  ClipboardList
} from "lucide-react";

export default function Dashboard({ students, screenings, updateScreening }) {
  const [activityLog, setActivityLog] = useState([
    { id: 1, time: "10:30 AM", msg: "Automated email summary of weekly deadlines generated for Ariel." },
    { id: 2, time: "Yesterday", msg: "Calendar synced 3 new IEP meeting schedules to RCS Outlook." }
  ]);

  const [showAugustSetup, setShowAugustSetup] = useState(false);

  // Aggregate stats
  const activeCount = students.filter(s => s.status === "Active").length;
  const screeningCount = screenings.filter(s => s.status !== "Pending Discontinuation" && s.status !== "Completed").length;
  
  // Consolidate all timelines
  const activeTimelines = students.flatMap(s => calculateTimelines(s, false).map(t => ({ ...t, studentId: s.id, studentName: s.name, type: "Active" })));
  const screeningTimelines = screenings.flatMap(s => calculateTimelines(s, true).map(t => ({ ...t, studentId: s.id, studentName: s.name, type: "Screening" })));
  
  const rawTimelines = [...activeTimelines, ...screeningTimelines];
  
  // Count caseload-wide alert levels
  const overdueCount = rawTimelines.filter(t => t.status === "overdue").length;
  const warningCount = rawTimelines.filter(t => t.status === "warning").length;

  // Filter for: Overdue OR Due within the current calendar week (Sunday or Monday)
  // Current calendar week (Monday to Sunday)
  const allTimelines = rawTimelines.filter(t => {
    // 1. Show overdue items instantly
    if (t.daysRemaining !== null && t.daysRemaining < 0) return true;
    
    // 2. Check if due date falls in the current calendar week (Monday through Sunday)
    if (!t.dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Start of week (Monday)
    const startOfWeek = new Date(today);
    const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(startOfWeek.getDate() + distToMonday);
    
    // End of week (Sunday night)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const dueDateObj = new Date(t.dueDate);
    dueDateObj.setHours(0, 0, 0, 0);
    
    return dueDateObj >= startOfWeek && dueDateObj <= endOfWeek;
  }).sort((a, b) => (a.daysRemaining === null ? 999 : a.daysRemaining) - (b.daysRemaining === null ? 999 : b.daysRemaining));

  // Friday bulk signatures checklist students
  const fridaySignatureStudents = students.filter(
    s => s.status === "Active" && s.iepFinalizedDate && !s.iepAtAGlanceSignaturesCompleted
  );

  const pushActivity = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ id: Date.now(), time, msg }, ...prev]);
  };

  const handleNudge = (screening) => {
    const teacherEmails = store.getState().teacherEmails || {};
    const email = teacherEmails[screening.classroomTeacher] || "teacher@rcschools.net";
    
    const subject = encodeURIComponent(`[Aegis Gifted Checklist] Traits needed for ${screening.name}`);
    const body = encodeURIComponent(
      `Dear ${screening.classroomTeacher},\n\n` +
      `I hope you are doing well! As the Gifted Facilitator, I am currently conducting an intellectual screening evaluation for ${screening.name} under our Tennessee 60-calendar-day timeline.\n\n` +
      `To complete our state-mandated TN K-12 Assessment Scoring Grid, I need your classroom behavior traits checklist (SIGS/Renzulli rating scale points).\n\n` +
      `Could you please complete the characteristics checklist for ${screening.name} as soon as you have a moment, or reply to this email with your observations?\n\n` +
      `Thank you so much for your support and partnership!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );

    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    updateScreening(screening.id, { nudgeSent: true });
    pushActivity(`Opened Mailto: Email nudge generated for ${screening.classroomTeacher} (${email}) regarding ${screening.name}.`);
  };

  const handleFollowUpInvitation = (student) => {
    const subject = encodeURIComponent(`[BMS Gifted IEP] Following up on meeting invitation for ${student.name}`);
    const body = encodeURIComponent(
      `Dear Parent,\n\n` +
      `I hope you are doing well! I am writing to check in regarding the IEP meeting invitation I sent home on ${student.iepInvitationSentDate} for ${student.name}.\n\n` +
      `Could you please let me know if the proposed date works for you, or return the signed invitation form as soon as possible so I can upload it and finalize our schedule?\n\n` +
      `Thank you so much!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );
    window.location.href = `mailto:parent@email.com?subject=${subject}&body=${body}`;
    pushActivity(`Opened Mailto: Email invitation follow-up generated for ${student.name}'s parent.`);
  };

  const handleAugustComplete = (studentId, proposedDate) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    if (!proposedDate) {
      alert("Please specify a proposed IEP meeting date.");
      return;
    }
    store.updateStudent(studentId, {
      iepReviewDate: proposedDate,
      augustSetupComplete: true
    });
    pushActivity(`Completed August bulk setup for ${student.name}. Proposed IEP meeting date: ${proposedDate}.`);
    alert(`August setup concluded for ${student.name}! IEP Review Date updated.`);
  };

  // Mark all Friday signature tasks complete for a student
  const handleFinalizeFridaySignatures = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    store.updateStudent(studentId, {
      iepAtAGlanceSignaturesCompleted: true,
      iepPulseUploadCompleted: true,
      iepSharePointUploadCompleted: true,
      iepPhysicalFileCompleted: true,
      iepMeetingDate: "" // Clear meeting date since workflow concluded
    });

    pushActivity(`Concluded Friday Bulk Signatures & Cume File updates for ${student.name}.`);
    alert(`IEP at a Glance signatures & administrative uploads checked off for ${student.name}!`);
  };

  return (
    <div>
      {/* Quick Stats Banner */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Active Gifted Students</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon emerald">
            <CheckSquare size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{screeningCount}</span>
            <span className="stat-label">Pending Screenings</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon amber">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{warningCount}</span>
            <span className="stat-label">Action Warning Timelines</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon rose">
            <Bell size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{overdueCount}</span>
            <span className="stat-label">Overdue Items</span>
          </div>
        </div>
      </div>

      {/* August Bulk Caseload Setup Panel */}
      {showAugustSetup && (
        <div className="glass-panel" style={{ marginBottom: "24px" }}>
          <div className="section-header">
            <div>
              <h3>August Caseload Bulk Setup Workspace</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                Schedule proposed IEP meeting dates and verify calendar invites for active students in bulk.
              </p>
            </div>
            <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setShowAugustSetup(false)}>
              Close Setup Panel
            </button>
          </div>
          
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {students.filter(s => s.status === "Active" && !s.augustSetupComplete).map(student => (
              <div key={student.id} style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px", 
                border: "1px solid var(--border-color)", 
                backgroundColor: "var(--bg-primary)", 
                gap: "12px" 
              }}>
                <div style={{ minWidth: "180px" }}>
                  <span style={{ fontWeight: "700", fontSize: "14px" }}>{student.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>{student.grade} Grade • {student.classroomTeacher}</span>
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "10px", margin: "0 0 2px" }}>Proposed Meeting Date</label>
                    <input 
                      type="date"
                      className="input-field"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      value={student.augustProposedDate || ""}
                      onChange={(e) => store.updateStudent(student.id, { augustProposedDate: e.target.value })}
                    />
                  </div>
                  <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
                    <input 
                      type="checkbox" 
                      checked={student.augustParentLetterSent || false}
                      onChange={(e) => store.updateStudent(student.id, { augustParentLetterSent: e.target.checked })}
                    />
                    <span>Letter & Surveys Sent</span>
                  </label>
                  <label style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
                    <input 
                      type="checkbox" 
                      checked={student.augustTeacherInvitesSent || false}
                      onChange={(e) => store.updateStudent(student.id, { augustTeacherInvitesSent: e.target.checked })}
                    />
                    <span>Teacher Calendar Invites</span>
                  </label>
                  <button 
                    className="btn btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                    onClick={() => handleAugustComplete(student.id, student.augustProposedDate)}
                    disabled={!student.augustProposedDate || !student.augustParentLetterSent || !student.augustTeacherInvitesSent}
                  >
                    Complete Setup
                  </button>
                </div>
              </div>
            ))}
            {students.filter(s => s.status === "Active" && !s.augustSetupComplete).length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
                ✔ All active students have completed their August caseload setup!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard-columns">
        {/* Left Column: Tennessee Special Ed Timeline Checklist */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="section-header">
            <div>
              <h2>Weekly Timeline & Due Summaries</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Tennessee Special Education mandate countdowns
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button 
                className="btn btn-secondary hide-print" 
                style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px", borderColor: showAugustSetup ? "var(--accent-purple)" : "transparent" }}
                onClick={() => setShowAugustSetup(!showAugustSetup)}
              >
                <ClipboardList size={12} />
                August Caseload Setup
              </button>
              <button 
                className="btn btn-primary hide-print" 
                style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => store.sendWeeklyEmail()}
              >
                <Send size={12} />
                Email Weekly Summary
              </button>
              <button 
                className="btn btn-secondary hide-print" 
                style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => window.print()}
              >
                <Printer size={12} />
                Print Weekly Checklist
              </button>
              <span className="timeline-badge warning hide-print" style={{ fontWeight: "700" }}>RCS Schedule</span>
            </div>
          </div>

          <div className="timeline-list">
            {allTimelines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                <CheckCircle size={40} style={{ color: "var(--accent-emerald)", marginBottom: "12px" }} />
                <p style={{ fontWeight: "600" }}>All clear! No upcoming timelines or overdue reports.</p>
              </div>
            ) : (
              allTimelines.map((timeline, idx) => (
                <div key={idx} className={`timeline-card ${timeline.status}`}>
                  <div className="timeline-content">
                    <div className="timeline-student-info">
                      <span className="timeline-student-name">{timeline.studentName}</span>
                      <span className={`timeline-date-alert ${timeline.status}`}>
                        {timeline.daysRemaining === null ? (
                          "Pending Trigger"
                        ) : timeline.daysRemaining < 0 ? (
                          `${Math.abs(timeline.daysRemaining)} Days OVERDUE`
                        ) : timeline.daysRemaining === 0 ? (
                          "DUE TODAY"
                        ) : (
                          `${timeline.daysRemaining} Days Left`
                        )}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                      <span className={`timeline-badge ${timeline.status}`}>{timeline.type}</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-heading)" }}>
                        {timeline.label}
                      </span>
                    </div>
                    
                    <p className="timeline-step">{timeline.desc}</p>

                    <div className="timeline-meta">
                      <span><Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Due: {timeline.dueDate || "N/A"}</span>
                      {timeline.mandatory && <span style={{ color: "var(--accent-rose)", fontWeight: "600" }}>* Mandatory State Deadline</span>}
                    </div>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div style={{ alignSelf: "center" }}>
                    {timeline.actionNeeded === "Nudge Teacher" && (
                      <button 
                        className="nudge-btn"
                        onClick={() => {
                          const screening = screenings.find(s => s.name === timeline.studentName);
                          if (screening) handleNudge(screening);
                        }}
                      >
                        <Send size={10} style={{ display: "inline", marginRight: "4px" }} />
                        Nudge ELA/Math
                      </button>
                    )}
                    {timeline.actionNeeded === "Follow Up Invite" && (
                      <button 
                        className="nudge-btn"
                        style={{ backgroundColor: "var(--accent-purple)" }}
                        onClick={() => {
                          const student = students.find(s => s.id === timeline.studentId);
                          if (student) handleFollowUpInvitation(student);
                        }}
                      >
                        <Send size={10} style={{ display: "inline", marginRight: "4px" }} />
                        Email Follow-up
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: In-App System notifications & quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Friday Bulk IEP Signatures Checklist */}
          <div className="glass-panel" style={{ border: "1px solid var(--accent-purple)" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={18} color="var(--accent-purple)" />
              Friday Bulk "Glance" Signatures
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Ariel blocks Friday afternoons to collect non-attender signatures and file folders.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {fridaySignatureStudents.map(student => (
                <div key={student.id} style={{ 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)", 
                  backgroundColor: "var(--bg-primary)",
                  fontSize: "13px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "6px" }}>
                    <span>{student.name} ({student.grade})</span>
                    <span style={{ color: "var(--accent-purple)", fontSize: "11px" }}>IEP Finalized</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px", fontSize: "12px" }}>
                    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input type="checkbox" defaultChecked={false} />
                      <span>Glance Signed by {student.classroomTeacher}</span>
                    </label>
                    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input type="checkbox" defaultChecked={false} />
                      <span>Upload Signatures to Pulse</span>
                    </label>
                    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input type="checkbox" defaultChecked={false} />
                      <span>Upload Glance to SharePoint</span>
                    </label>
                    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input type="checkbox" defaultChecked={false} />
                      <span>File in Physical Cume Folder</span>
                    </label>
                  </div>
                  <button 
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "5px", fontSize: "11px" }}
                    onClick={() => handleFinalizeFridaySignatures(student.id)}
                  >
                    Conclude IEP & File Folder
                  </button>
                </div>
              ))}
              {fridaySignatureStudents.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
                  ✔ No IEP at a Glance signatures pending for this Friday.
                </p>
              )}
            </div>
          </div>

          {/* Teacher Checklist Feed */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileCheck size={18} color="var(--accent-purple)" />
              Teacher Checklist Feed
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {screenings
                .filter(s => s.status === "Evaluation in Progress" && !s.teacherChecklistSigned)
                .map(screening => (
                  <div key={screening.id} style={{ 
                    padding: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "var(--bg-primary)",
                    fontSize: "13px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                      <span>{screening.name} ({screening.grade})</span>
                      <span style={{ color: "var(--accent-amber)" }}>Traits Checklist</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "8px" }}>
                      Assigned to: {screening.classroomTeacher} (SIGS traits checklist pending)
                    </p>
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        width: "100%", 
                        padding: "6px 12px", 
                        fontSize: "11px",
                        backgroundColor: screening.nudgeSent ? "var(--accent-emerald)" : "var(--accent-purple)" 
                      }}
                      onClick={() => handleNudge(screening)}
                      disabled={screening.nudgeSent}
                    >
                      {screening.nudgeSent ? "Nudge Sent Successfully" : "Send Automated Email Reminder"}
                    </button>
                  </div>
                ))}
              {screenings.filter(s => s.status === "Evaluation in Progress" && !s.teacherChecklistSigned).length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                  No outstanding classroom teacher checklists.
                </p>
              )}
            </div>
          </div>

          {/* Simulated Activity Feed */}
          <div className="glass-panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={18} color="var(--accent-purple)" />
              Cloud Alerts & Activities
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "250px", overflowY: "auto" }}>
              {activityLog.map((log) => (
                <div key={log.id} style={{ fontSize: "13px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", marginBottom: "2px" }}>
                    <span>{log.time}</span>
                    <span style={{ color: "var(--accent-purple)", fontWeight: "600" }}>System</span>
                  </div>
                  <p style={{ color: "var(--text-heading)", fontWeight: "500" }}>{log.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
