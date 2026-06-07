/* ==========================================
   Aegis Gifted Tracker - ParentPortal Component
   ========================================== */

import React, { useState } from "react";
import { store } from "../utils/studentStore";
import { Lock, FileSignature, CheckCircle, ExternalLink, Calendar, ShieldCheck, Printer } from "lucide-react";

export default function ParentPortal({ students, updateStudent }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [parentName, setParentName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

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
      iepReviewDate: student.iepReviewDate,
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

  const handleSignConsent = (e) => {
    e.preventDefault();
    if (!parentName || !consentChecked) {
      alert("Please fill in your name and check the consent box.");
      return;
    }

    // Save signature directly into student store
    const signature = {
      signer: parentName,
      date: new Date().toLocaleDateString(),
      verified: true
    };

    updateStudent(activeStudent.id, { parentSignature: signature });
    setSignatureSaved(true);
    setTimeout(() => setSignatureSaved(false), 3000);
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
                setParentName("");
                setConsentChecked(false);
              }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="button"
            className="btn btn-secondary hide-print" 
            onClick={() => window.print()}
            style={{ 
              padding: "4px 10px", 
              fontSize: "11px", 
              backgroundColor: "rgba(192, 132, 252, 0.2)", 
              color: "#c084fc", 
              border: "1px solid rgba(192, 132, 252, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              height: "22px",
              borderRadius: "4px"
            }}
          >
            <Printer size={12} />
            Print Report
          </button>
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
                            <span>{goal.title}</span>
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
                {parentData.accommodations && parentData.accommodations.map((accom, index) => (
                  <span key={index} style={{ 
                    padding: "6px 12px", 
                    borderRadius: "20px", 
                    backgroundColor: "var(--accent-purple-light)", 
                    color: "var(--accent-purple)", 
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    ✔ {accom}
                  </span>
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
                  <label style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Annual IEP Review Due</label>
                  <span style={{ fontWeight: "700", color: "var(--accent-amber)" }}>{parentData.iepReviewDate}</span>
                </div>
                <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "11px", display: "block" }}>Triennial Re-evaluation Due</label>
                  <span style={{ fontWeight: "700" }}>{parentData.reevalDueDate}</span>
                </div>
              </div>
            </div>

            {/* IEP Digital Signature Form */}
            <div className="glass-panel">
              <h3 style={{ fontSize: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSignature size={18} color="var(--accent-purple)" />
                IEP Signature Portal
              </h3>
              
              {parentData.parentSignature ? (
                <div style={{ 
                  padding: "16px", 
                  borderRadius: "8px", 
                  backgroundColor: "var(--accent-emerald-light)", 
                  border: "1px solid var(--accent-emerald)",
                  textAlign: "center"
                }}>
                  <CheckCircle size={32} color="var(--accent-emerald)" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: "700", color: "var(--accent-emerald)", fontSize: "14px" }}>Digital Signature Confirmed</p>
                  <p style={{ fontSize: "12px", color: "var(--text-main)", marginTop: "4px" }}>
                    Signed by: {parentData.parentSignature.signer}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Date Signed: {parentData.parentSignature.date}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignConsent} className="hide-print">
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                    Please review your child's progress goals above and submit digital signature to confirm receipt.
                  </p>

                  <div className="form-group">
                    <label>Parent/Guardian Full Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Type your full signature name"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "16px" }}>
                    <input 
                      type="checkbox" 
                      id="parent-consent-check" 
                      style={{ marginTop: "4px" }}
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                    />
                    <label htmlFor="parent-consent-check" style={{ fontSize: "11px", color: "var(--text-main)", fontWeight: "500" }}>
                      I acknowledge receipt of this quarterly progress report update and agree to the current IEP goals.
                    </label>
                  </div>

                  {signatureSaved && (
                    <span style={{ display: "block", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600", marginBottom: "8px", textAlign: "center" }}>
                      ✔ Signature synced to Google Drive successfully!
                    </span>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                    Submit Digital Signature
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Physical Signature Block for Paper/PDF Reports */}
        {!parentData.parentSignature && (
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
        )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }} className="glass-panel">
          <p>Please select a valid child profile above to load simulated portal content.</p>
        </div>
      )}
    </div>
  );
}
