/* ==========================================
   Aegis Gifted Tracker - ParentPortal Component
   ========================================== */

import React, { useState } from "react";
import { store } from "../utils/studentStore";
import { Lock, FileSignature, CheckCircle, ExternalLink, Calendar, ShieldCheck, Printer, Mail } from "lucide-react";

export default function ParentPortal({ students, updateStudent }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");

  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Filter student data to simulate reading strictly parent-portal.json
  // We recreate the sanitized parent object here to prove complete data segregation!
  const getSanitizedParentData = (student) => {
    if (!student) return null;
    return {
      id: student.id,
      name: student.name,
      grade: student.grade,
      school: student.school,
      classroomTeacher: student.classroomTeacher,
      status: student.status,
      iepDueDate: student.iepDueDate,
      reevalDueDate: student.reevalDueDate,
      accommodations: student.accommodations || [],
      selNeeds: student.selNeeds ? {
        type: student.selNeeds.type,
        strategies: student.selNeeds.strategies || []
      } : null,
      progressReports: student.progressReports || [],
      parentSignature: student.parentSignature || null
    };
  };

  const parentData = getSanitizedParentData(activeStudent);

  const handleEmailToSelf = () => {
    if (!parentData) return;
    
    const subject = encodeURIComponent(`IEP Progress Report Summary for ${parentData.name}`);
    
    const accommodationsList = parentData.accommodations.length > 0
      ? parentData.accommodations.map(a => `- ${a}`).join("\n")
      : "No accommodations logged.";
      
    const reportsList = parentData.progressReports.length > 0
      ? parentData.progressReports.map(report => {
          const goalsText = report.goals 
            ? report.goals.map(g => `  * ${g.title}: ${g.progress}`).join("\n")
            : "  No goals listed.";
          return `[${report.quarter} Academic Term (Released: ${report.date})]\n${goalsText}\n  Narrative: ${report.generalComment || 'N/A'}`;
        }).join("\n\n")
      : "No progress reports recorded.";
      
    const bodyText = `Aegis Gifted Education Portal - Student IEP Report

Student: ${parentData.name}
Grade: ${parentData.grade}
School: Blackman Middle School
Classroom Teacher: ${parentData.classroomTeacher}

--- UPCOMING IEP TIMELINES ---
IEP Due Date: ${parentData.iepDueDate}
Triennial Re-evaluation Due: ${parentData.reevalDueDate}

--- CLASSROOM GIFTED ACCOMMODATIONS ---
${accommodationsList}

--- IEP GOALS & PROGRESS ---
${reportsList}

---
Sent from Aegis Student Needs Tracker.`;

    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Simulation Header Banner */}
      <div className="parent-toggle-banner" style={{ borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Lock size={16} />
          <span>Parent Access Portal (Simulated Read-Only View of parent-portal.json)</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <label style={{ fontSize: "11px", color: "#c084fc" }}>Child Profile:</label>
            <select 
              className="select-field" 
              style={{ 
                backgroundColor: "#111827", 
                color: "white", 
                borderColor: "#374151",
                padding: "2px 8px", 
                fontSize: "11px",
                height: "auto"
              }}
              value={selectedStudentId} 
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
              }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {parentData ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }} className="dashboard-columns">
          {/* Main Parent Dashboard */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header branding */}
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--accent-purple)", fontWeight: "700", textTransform: "uppercase" }}>Blackman Middle School</span>
                <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-heading)", margin: "4px 0" }}>Gifted Education Portal</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Rutherford County Schools Special Education Service Feed</p>
              </div>
              <ShieldCheck size={40} color="var(--accent-purple)" />
            </div>

            {/* Action buttons */}
            <div className="hide-print" style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => window.print()}
                style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  borderRadius: "6px"
                }}
              >
                <Printer size={16} />
                Print Report
              </button>
              
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleEmailToSelf}
                style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  borderRadius: "6px"
                }}
              >
                <Mail size={16} />
                Email Report to Self
              </button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", backgroundColor: "var(--bg-primary)", padding: "16px", borderRadius: "10px", fontSize: "13px" }}>
              <div><label style={{ color: "var(--text-muted)" }}>Student Name:</label> <p style={{ fontWeight: "700" }}>{parentData.name}</p></div>
              <div><label style={{ color: "var(--text-muted)" }}>Grade / School:</label> <p style={{ fontWeight: "700" }}>{parentData.grade} • Blackman Middle</p></div>
              <div><label style={{ color: "var(--text-muted)" }}>Facilitator Contact:</label> <p style={{ fontWeight: "700" }}>Ariel (Gifted Facilitator)</p></div>
              <div><label style={{ color: "var(--text-muted)" }}>Core Classroom:</label> <p style={{ fontWeight: "700" }}>{parentData.classroomTeacher}</p></div>
            </div>

            {/* IEP Goals Progress Reports */}
            <div>
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ExternalLink size={16} color="var(--accent-purple)" />
                Latest IEP Goals Progress Reports
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {parentData.progressReports && parentData.progressReports.map((report, idx) => (
                  <div key={idx} style={{ 
                    padding: "16px", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "var(--bg-sidebar)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                      <span style={{ fontWeight: "700", color: "var(--accent-purple)" }}>{report.quarter} Academic Term</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Date Released: {report.date}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {report.goals && report.goals.map((goal, gIdx) => (
                        <div key={gIdx} style={{ fontSize: "13px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{goal.title}</span>
                              {goal.category && (
                                <span style={{ 
                                  padding: "1px 6px",
                                  fontSize: "9px",
                                  borderRadius: "4px",
                                  backgroundColor: "var(--accent-purple-light)",
                                  color: "var(--accent-purple)",
                                  fontWeight: "600"
                                }}>{goal.category}</span>
                              )}
                            </span>
                            <span style={{ 
                              color: goal.progress === "Achieved" ? "var(--accent-emerald)" : "var(--accent-purple)",
                              backgroundColor: goal.progress === "Achieved" ? "var(--accent-emerald-light)" : "var(--accent-purple-light)",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              fontSize: "11px"
                            }}>{goal.progress}</span>
                          </div>
                          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>{goal.comment || "Goal progress is on track. Working standard advanced compacting curriculum."}</p>
                        </div>
                      ))}
                    </div>

                    {report.generalComment && (
                      <div style={{ marginTop: "16px", padding: "10px", borderRadius: "6px", backgroundColor: "var(--bg-primary)", fontSize: "12px" }}>
                        <span style={{ fontWeight: "700", display: "block", marginBottom: "4px" }}>Facilitator Narrative Summary:</span>
                        <p style={{ color: "var(--text-main)" }}>{report.generalComment}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(!parentData.progressReports || parentData.progressReports.length === 0) && (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px", fontSize: "13px" }}>
                    No quarterly progress reports released for this child yet.
                  </p>
                )}
              </div>
            </div>

            {/* Classroom Accommodations & Strategies */}
            <div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Classroom Gifted Accommodations</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {parentData.accommodations && parentData.accommodations.map((accom, i) => (
                <div key={i} style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: "var(--accent-purple-light)",
                  color: "var(--accent-purple)",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  ✔ {accom.label}
                </div>
              ))}
                {(!parentData.accommodations || parentData.accommodations.length === 0) && (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No accommodations logged.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Timelines & Signature panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Scheduled IEP Meetings */}
            <div className="glass-panel">
              <h3 style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} color="var(--accent-purple)" />
                Upcoming IEP Timelines
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>IEP Due Date</label>
                  <span style={{ fontWeight: "700", color: "var(--accent-amber)" }}>{parentData.iepDueDate}</span>
                </div>
                <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Triennial Re-evaluation Due</label>
                  <span style={{ fontWeight: "700" }}>{parentData.reevalDueDate}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Physical Signature Block for Paper/PDF Reports */}
        <div className="print-only" style={{ marginTop: "40px", paddingTop: "24px", borderTop: "2px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", color: "var(--text-heading)" }}>Signatures & Receipt Confirmation</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
            <div>
              <div style={{ borderBottom: "1px solid var(--text-main)", height: "36px", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Parent/Guardian Signature</span>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid var(--text-main)", height: "36px", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Date</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginTop: "24px" }}>
            <div>
              <div style={{ borderBottom: "1px solid var(--text-main)", height: "36px", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Ariel, BMS Gifted Facilitator Signature</span>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid var(--text-main)", height: "36px", marginBottom: "6px" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Date</span>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }} className="glass-panel">
          <p>Please select a valid child profile above to load simulated portal content.</p>
        </div>
      )}
    </div>
  );
}
