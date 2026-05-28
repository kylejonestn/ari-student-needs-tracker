/* ==========================================
   Aegis Gifted Tracker - Dashboard Component
   ========================================== */

import React, { useState } from "react";
import { 
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
  Printer
} from "lucide-react";

export default function Dashboard({ students, screenings, updateScreening }) {
  const [activityLog, setActivityLog] = useState([
    { id: 1, time: "10:30 AM", msg: "Simulated: Automated email summary of weekly deadlines sent to Ariel." },
    { id: 2, time: "Yesterday", msg: "Simulated: Calendar synced 3 new IEP meeting schedules to Outlook." }
  ]);

  // Aggregate stats
  const activeCount = students.filter(s => s.status === "Active").length;
  const screeningCount = screenings.filter(s => s.status !== "Completed").length;
  
  // Consolidate all timelines
  const activeTimelines = students.flatMap(s => calculateTimelines(s, false).map(t => ({ ...t, studentName: s.name, type: "Active" })));
  const screeningTimelines = screenings.flatMap(s => calculateTimelines(s, true).map(t => ({ ...t, studentName: s.name, type: "Screening" })));
  
  const allTimelines = [...activeTimelines, ...screeningTimelines].sort((a, b) => a.daysRemaining - b.daysRemaining);
  
  // Count alert levels
  const overdueCount = allTimelines.filter(t => t.status === "overdue").length;
  const warningCount = allTimelines.filter(t => t.status === "warning").length;

  const pushActivity = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ id: Date.now(), time, msg }, ...prev]);
  };

  const handleNudge = (screening) => {
    updateScreening(screening.id, { nudgeSent: true });
    pushActivity(`Simulated: Nudge email successfully sent to ${screening.classroomTeacher} for ${screening.name}'s gifted traits checklist.`);
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
                      <span><Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Due: {timeline.dueDate}</span>
                      {timeline.mandatory && <span style={{ color: "var(--accent-rose)", fontWeight: "600" }}>* Mandatory State Deadline</span>}
                    </div>
                  </div>

                  {/* Contextual Action Buttons */}
                  {timeline.actionNeeded === "Nudge Teacher" && (
                    <div style={{ alignSelf: "center" }}>
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
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: In-App System notifications & quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Screening Nudge Panel */}
          <div className="glass-panel" style={{ flexGrow: "1" }}>
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
                      Assigned to: {screening.classroomTeacher} (Classroom Checklists needed for TN Matrix Points)
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
