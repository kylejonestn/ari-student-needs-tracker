/* ==========================================
   Aegis Gifted Tracker - IEP Planner Component
   ========================================== */

import React, { useState } from "react";
import { store, addDays, addSchoolDays, getDaysRemaining } from "../utils/studentStore";
import { 
  Calendar, 
  Check, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Mail, 
  CheckSquare,
  Square,
  ClipboardList,
  ArrowRight,
  Sparkles
} from "lucide-react";

// Helper for calendar days difference
const getCalendarDaysDiff = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Helper to determine the current active stage dynamically (0 to 7)
const getIepStageIndex = (student) => {
  const isStage0Complete = student.augustSetupComplete || (student.iepAugustLetterSent && student.iepGenEdInvitesSent);
  if (!isStage0Complete) return 0;
  
  const isStage1Complete = student.iepParentProposalLetterSent && student.iepPermissionToEmailReceived && student.iepParentSurveyCompleted;
  if (!isStage1Complete) return 1;
  
  const isStage2Complete = student.iepInvitationSentDate && student.iepInvitationResponseReceived && student.iepMeetingDate;
  if (!isStage2Complete) return 2;
  
  const isStage3Complete = student.iepPreVocDispatched && student.iepTeacherChecklistSent;
  if (!isStage3Complete) return 3;
  
  const isStage4Complete = student.iepDataMiningCompleted && student.iepTransitionSurveyCompleted;
  if (!isStage4Complete) return 4;
  
  const isStage5Complete = student.iepDraftWrittenDate && student.iepDraftSentDate;
  if (!isStage5Complete) return 5;
  
  const isStage6Complete = student.iepFinalizedDate && student.iepAtAGlancePrinted && student.iepAtAGlanceSignaturesCompleted && student.iepPulseUploadCompleted && student.iepSharePointUploadCompleted && student.iepPhysicalFileCompleted;
  if (!isStage6Complete) return 6;
  
  return 7; // Completed everything
};

export default function IepPlanner({ students = [], updateStudent }) {
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedStepIndexByStudent, setSelectedStepIndexByStudent] = useState({});

  // Sync with global store selection changes (e.g. clicked on dashboard link)
  React.useEffect(() => {
    const checkGlobalSelection = () => {
      const globalStudentId = store.getState().selectedIepStudentId;
      const globalStepIndex = store.getState().selectedIepStepIndex;
      if (globalStudentId) {
        setExpandedStudentId(globalStudentId);
        if (globalStepIndex !== undefined && globalStepIndex !== null) {
          setSelectedStepIndexByStudent(prev => ({
            ...prev,
            [globalStudentId]: globalStepIndex
          }));
        }
        // Clear deep-link keys to avoid locked focus states
        store.updateState({ selectedIepStudentId: null, selectedIepStepIndex: null });
      }
    };
    
    checkGlobalSelection();
    return store.subscribe(checkGlobalSelection);
  }, []);

  const activeStudents = students.filter(s => s.status === "Active");

  // Stages of the IEP timeline stepper
  const iepStages = [
    { label: "August Prep", short: "Aug Prep" },
    { label: "Parent Proposal", short: "Parent Prop" },
    { label: "Formal Invitation", short: "Formal Invite" },
    { label: "Teacher Checklist", short: "Teacher Check" },
    { label: "Data Gathering", short: "Data Gather" },
    { label: "Drafting & Delivery", short: "Draft & Deliv" },
    { label: "Meeting & Finalize", short: "Finalize" }
  ];

  const getStageDueDate = (student, idx) => {
    const meetingDate = student.iepMeetingDate;
    switch (idx) {
      case 0:
        return "2026-08-15";
      case 1:
        return meetingDate ? addDays(meetingDate, -25) : "TBD";
      case 2:
        return meetingDate ? addDays(meetingDate, -20) : "TBD";
      case 3:
        return meetingDate ? addDays(meetingDate, -15) : "TBD";
      case 4:
        return meetingDate ? addSchoolDays(meetingDate, -7) : "TBD";
      case 5:
        return meetingDate ? addSchoolDays(meetingDate, -4) : "TBD";
      case 6:
        return meetingDate || "TBD";
      default:
        return "";
    }
  };

  // 1. Friday Signatures Checklist aggregation
  const fridayStudents = activeStudents.filter(
    s => s.iepAtAGlancePrinted === true && s.iepAtAGlanceSignaturesCompleted === false
  );

  const handleFridaySignatureToggle = (studentId) => {
    updateStudent(studentId, { iepAtAGlanceSignaturesCompleted: true });
  };

  // Warning calculator for compliance and timeline alarms
  const getIepWarnings = (student) => {
    const warnings = [];
    const meetingDate = student.iepMeetingDate;
    if (!meetingDate) return warnings;

    // 10-day notice compliance warning
    if (student.iepInvitationSentDate && !student.meetingNoticeWaived) {
      const noticeDays = getCalendarDaysDiff(student.iepInvitationSentDate, meetingDate);
      if (noticeDays !== null && noticeDays < 10) {
        warnings.push({
          type: "notice",
          label: "Invitation Notice Warning",
          text: `Invitation sent on ${student.iepInvitationSentDate} is only ${noticeDays} calendar days prior to the meeting (10 days legally required).`,
          status: "warning"
        });
      }
    }

    // 7 school days prior data gathering reminder
    if (!student.iepDataMiningCompleted) {
      const dataDue = addSchoolDays(meetingDate, -7);
      if (getDaysRemaining(dataDue) <= 0) {
        warnings.push({
          type: "data",
          label: "Data Mining Reminder",
          text: `Academic scores (TVAAS, Mastery Connect, EasyCBM, Savvas) should be pulled (7 school days prior reminder; target: ${dataDue}).`,
          status: "warning"
        });
      }
    }

    // 6 school days prior transition survey reminder
    if (!student.iepTransitionSurveyCompleted) {
      const surveyDue = addSchoolDays(meetingDate, -6);
      if (getDaysRemaining(surveyDue) <= 0) {
        warnings.push({
          type: "transition",
          label: "Transition Survey Reminder",
          text: `Student Transition Survey is past due (6 school days prior reminder; target: ${surveyDue}).`,
          status: "warning"
        });
      }
    }

    // 4 school days prior draft document writing reminder
    if (!student.iepDraftWrittenDate) {
      const draftDue = addSchoolDays(meetingDate, -4);
      if (getDaysRemaining(draftDue) <= 0) {
        warnings.push({
          type: "draft",
          label: "IEP Draft Due",
          text: `IEP Draft on TN Pulse should be completed (4 school days prior reminder; target: ${draftDue}).`,
          status: "warning"
        });
      }
    }

    // 2 school days prior draft sending reminder
    if (!student.iepDraftSentDate) {
      const sendDue = addSchoolDays(meetingDate, -2);
      if (getDaysRemaining(sendDue) <= 0) {
        warnings.push({
          type: "sendDraft",
          label: "Draft Delivery Due",
          text: `Draft IEP & Zoom link must be sent to parent (48 school hours prior reminder; target: ${sendDue}).`,
          status: "warning"
        });
      }
    }

    return warnings;
  };

  // Step checklist and form content renderer
  const renderStepContent = (student, stepIndex) => {
    switch (stepIndex) {
      case 0: // August Prep
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              In August, send proposed dates letters to parents and bulk calendar invites to General Education teachers.
            </p>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={!!student.iepAugustLetterSent}
                onChange={(e) => {
                  const val = e.target.checked;
                  updateStudent(student.id, { 
                    iepAugustLetterSent: val,
                    augustSetupComplete: val && !!student.iepGenEdInvitesSent
                  });
                }}
              />
              <strong>August Proposed Dates Letter Sent</strong>
            </label>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={!!student.iepGenEdInvitesSent}
                onChange={(e) => {
                  const val = e.target.checked;
                  updateStudent(student.id, { 
                    iepGenEdInvitesSent: val,
                    augustSetupComplete: !!student.iepAugustLetterSent && val
                  });
                }}
              />
              <strong>General Education Teacher Bulk Invites Sent</strong>
            </label>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "4px" }}>
              <input 
                type="checkbox"
                checked={!!student.augustSetupComplete}
                onChange={(e) => {
                  const val = e.target.checked;
                  updateStudent(student.id, { 
                    augustSetupComplete: val,
                    iepAugustLetterSent: val ? true : student.iepAugustLetterSent,
                    iepGenEdInvitesSent: val ? true : student.iepGenEdInvitesSent
                  });
                }}
              />
              <span style={{ color: "var(--accent-purple)", fontWeight: "600" }}>Mark Whole August Setup Stage Complete</span>
            </label>
          </div>
        );

      case 1: // Parent Proposal
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Send initial parent letter, gather permission to email legal notices, and review parental options.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "8px" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepParentProposalLetterSent}
                    onChange={(e) => updateStudent(student.id, { iepParentProposalLetterSent: e.target.checked })}
                  />
                  <span>Parent Proposal Letter Sent</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "8px" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepPermissionToEmailReceived}
                    onChange={(e) => updateStudent(student.id, { iepPermissionToEmailReceived: e.target.checked })}
                  />
                  <span>Permission to Email legal docs received</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "8px" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepParentDatesAligned}
                    onChange={(e) => updateStudent(student.id, { iepParentDatesAligned: e.target.checked })}
                  />
                  <span>Proposed Dates Align (Parent Confirmed)</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepParentSurveyCompleted}
                    onChange={(e) => updateStudent(student.id, { iepParentSurveyCompleted: e.target.checked })}
                  />
                  <span>Parent Survey Completed</span>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Parent bringing attorney / advocate?</label>
                  <select 
                    className="select-field"
                    value={student.iepAttorneyPresent || ""}
                    onChange={(e) => updateStudent(student.id, { iepAttorneyPresent: e.target.value })}
                    style={{ padding: "6px", fontSize: "12px" }}
                  >
                    <option value="">Undecided / No</option>
                    <option value="Yes">Yes (Notify Admin)</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Teacher Preference or Parent Notes</label>
                  <textarea 
                    className="input-field"
                    placeholder="e.g. Requests Ms. Davis. Prefers Zoom meeting."
                    value={student.iepParentPreferenceNotes || ""}
                    onChange={(e) => updateStudent(student.id, { iepParentPreferenceNotes: e.target.value })}
                    style={{ height: "48px", padding: "6px", fontSize: "12px", resize: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Formal Invitation
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              TN Special Education regulations require a formal invitation to be sent at least 10 calendar days prior to the meeting.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>Formal Invitation Sent Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.iepInvitationSentDate || ""}
                  onChange={(e) => updateStudent(student.id, { iepInvitationSentDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Scheduled IEP Meeting Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.iepMeetingDate || ""}
                  onChange={(e) => updateStudent(student.id, { iepMeetingDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={!!student.iepInvitationResponseReceived}
                  onChange={(e) => updateStudent(student.id, { iepInvitationResponseReceived: e.target.checked })}
                />
                <strong>Parent RSVP Response Received (Attending)</strong>
              </label>

              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={!!student.meetingNoticeWaived}
                  onChange={(e) => updateStudent(student.id, { meetingNoticeWaived: e.target.checked })}
                />
                <span style={{ fontSize: "12px", color: "var(--accent-rose)", fontWeight: "600" }}>
                  Parent Waived 10-day Notice Requirement
                </span>
              </label>
            </div>
          </div>
        );

      case 3: // Teacher Checklist
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Dispatch and track teacher rating checklists and pre-vocational surveys to general education classrooms.
            </p>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={!!student.iepPreVocDispatched}
                onChange={(e) => updateStudent(student.id, { iepPreVocDispatched: e.target.checked })}
              />
              <strong>Dispatch pre-vocational checklists (Pre-Voc checklist)</strong>
            </label>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={!!student.iepTeacherChecklistSent}
                onChange={(e) => updateStudent(student.id, { iepTeacherChecklistSent: e.target.checked })}
              />
              <strong>Dispatch general education teacher feedback checklist</strong>
            </label>
          </div>
        );

      case 4: // Data Gathering
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Gather scores from multiple platforms (TVAAS, Mastery Connect, EasyCBM, Savvas) 7 school days prior, and run Transition surveys 6 school days prior.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-purple)", marginBottom: "4px" }}>
                  Score Gathering Metrics Checklist:
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepTvaasPulled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateStudent(student.id, { 
                        iepTvaasPulled: val,
                        iepDataMiningCompleted: val && !!student.iepMasteryConnectPulled && !!student.iepEasyCbmPulled && !!student.iepSavvasPulled
                      });
                    }}
                  />
                  <span>TCAP / TVAAS Scores Pulled</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepMasteryConnectPulled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateStudent(student.id, { 
                        iepMasteryConnectPulled: val,
                        iepDataMiningCompleted: !!student.iepTvaasPulled && val && !!student.iepEasyCbmPulled && !!student.iepSavvasPulled
                      });
                    }}
                  />
                  <span>Mastery Connect Benchmarks Pulled</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepEasyCbmPulled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateStudent(student.id, { 
                        iepEasyCbmPulled: val,
                        iepDataMiningCompleted: !!student.iepTvaasPulled && !!student.iepMasteryConnectPulled && val && !!student.iepSavvasPulled
                      });
                    }}
                  />
                  <span>EasyCBM Reading Fluency Pulled</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepSavvasPulled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateStudent(student.id, { 
                        iepSavvasPulled: val,
                        iepDataMiningCompleted: !!student.iepTvaasPulled && !!student.iepMasteryConnectPulled && !!student.iepEasyCbmPulled && val
                      });
                    }}
                  />
                  <span>Savvas Math Scores Pulled</span>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-purple)" }}>
                  Combined Milestones:
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepDataMiningCompleted}
                    onChange={(e) => {
                      const val = e.target.checked;
                      updateStudent(student.id, { 
                        iepDataMiningCompleted: val,
                        iepTvaasPulled: val,
                        iepMasteryConnectPulled: val,
                        iepEasyCbmPulled: val,
                        iepSavvasPulled: val
                      });
                    }}
                  />
                  <strong>All Academic Data Mining Complete</strong>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepTransitionSurveyCompleted}
                    onChange={(e) => updateStudent(student.id, { iepTransitionSurveyCompleted: e.target.checked })}
                  />
                  <strong>Student Transition Survey Done</strong>
                </label>
              </div>
            </div>
          </div>
        );

      case 5: // Drafting & Delivery
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Complete the comprehensive IEP document on TN Pulse 4 school days before, and deliver the draft plus logistics link 2 school days (48 hours) prior.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>IEP Draft Written Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.iepDraftWrittenDate || ""}
                  onChange={(e) => updateStudent(student.id, { iepDraftWrittenDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>IEP Draft Sent to Parent Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.iepDraftSentDate || ""}
                  onChange={(e) => updateStudent(student.id, { iepDraftSentDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 6: // Meeting & Finalize
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Hold meeting, finalize Pulse, print At-A-Glance for signature tracking, upload online resources, and archive physical paperwork.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>IEP Finalized Date (locked on Pulse)</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={student.iepFinalizedDate || ""}
                    onChange={(e) => updateStudent(student.id, { iepFinalizedDate: e.target.value })}
                  />
                </div>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "6px" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepAtAGlancePrinted}
                    onChange={(e) => updateStudent(student.id, { iepAtAGlancePrinted: e.target.checked })}
                  />
                  <span>IEP At-A-Glance Summary Printed</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepAtAGlanceSignaturesCompleted}
                    onChange={(e) => updateStudent(student.id, { iepAtAGlanceSignaturesCompleted: e.target.checked })}
                  />
                  <strong>At-A-Glance Teacher Signatures Complete</strong>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepPulseUploadCompleted}
                    onChange={(e) => updateStudent(student.id, { iepPulseUploadCompleted: e.target.checked })}
                  />
                  <span>Signed IEP Uploaded to TN Pulse</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepSharePointUploadCompleted}
                    onChange={(e) => updateStudent(student.id, { iepSharePointUploadCompleted: e.target.checked })}
                  />
                  <span>Signed IEP Uploaded to SharePoint</span>
                </label>
                <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.iepPhysicalFileCompleted}
                    onChange={(e) => updateStudent(student.id, { iepPhysicalFileCompleted: e.target.checked })}
                  />
                  <strong>Physical Document Archived in Cume Folder</strong>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* 1. Friday Signatures Quick-Checklist Panel */}
      <div className="friday-signatures-panel">
        <div className="friday-signatures-header">
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <Sparkles size={18} />
            Friday At-A-Glance Signatures Tracker
          </h3>
          <span className="badge badge-purple" style={{ fontSize: "11px" }}>
            {fridayStudents.length} Pending
          </span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Aggregated list of active students whose IEP At-A-Glance summaries have been printed, but are still missing signed confirmations from classroom teacher(s).
        </p>

        {fridayStudents.length > 0 ? (
          <div className="friday-signatures-grid">
            {fridayStudents.map(student => (
              <div key={student.id} className="friday-student-item">
                <div>
                  <strong style={{ fontSize: "13px" }}>{student.name}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Teacher: {student.classroomTeacher} ({student.grade})
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "var(--accent-purple)", border: "1px solid rgba(168, 85, 247, 0.2)" }}
                  onClick={() => handleFridaySignatureToggle(student.id)}
                >
                  Mark Signed
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--accent-emerald)", fontSize: "13px", fontWeight: "600", background: "rgba(16, 185, 129, 0.05)", border: "1px dashed rgba(16, 185, 129, 0.2)", borderRadius: "8px" }}>
            🎉 All teacher signatures for printed IEPs are completed!
          </div>
        )}
      </div>

      {/* 2. IEP Caseload Table/Timeline View */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {activeStudents.map(student => {
          const isExpanded = expandedStudentId === student.id;
          const currentStageIndex = getIepStageIndex(student);
          const warnings = getIepWarnings(student);
          
          // Compute progress percentage
          const progressPercent = (currentStageIndex / (iepStages.length - 1)) * 100;

          // Get selected step index in panel
          const selectedStep = selectedStepIndexByStudent[student.id] ?? (currentStageIndex >= 7 ? 6 : currentStageIndex);

          return (
            <div 
              key={student.id} 
              className="timeline-card-glass" 
              style={{ 
                borderLeft: currentStageIndex >= 7
                  ? "6px solid var(--accent-emerald)" 
                  : warnings.length > 0 
                    ? "6px solid var(--accent-rose)" 
                    : "6px solid var(--accent-purple)"
              }}
            >
              {/* Card Header */}
              <div className="timeline-card-header">
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    {student.name}
                    {currentStageIndex >= 7 ? (
                      <span className="badge badge-emerald" style={{ fontSize: "11px" }}>
                        IEP Finalized
                      </span>
                    ) : (
                      <span className="badge badge-purple" style={{ fontSize: "11px" }}>
                        Stage {currentStageIndex + 1}: {iepStages[currentStageIndex]?.label}
                      </span>
                    )}
                  </h3>
                  <div className="timeline-student-meta">
                    <span>Grade: <strong>{student.grade}</strong></span>
                    <span>Teacher: <strong>{student.classroomTeacher}</strong></span>
                    <span>Annual Review Due: <strong style={{ color: getDaysRemaining(student.iepReviewDate) <= 30 ? "var(--accent-rose)" : "inherit" }}>{student.iepReviewDate || "Not Set"}</strong></span>
                    {student.iepMeetingDate && (
                      <span style={{ color: "var(--accent-purple)" }}>
                        Meeting: <strong>{student.iepMeetingDate}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button 
                    className="timeline-card-expand-btn"
                    onClick={() => {
                      setExpandedStudentId(isExpanded ? null : student.id);
                      if (!isExpanded) {
                        setSelectedStepIndexByStudent(prev => ({
                          ...prev,
                          [student.id]: currentStageIndex >= 7 ? 6 : currentStageIndex
                        }));
                      }
                    }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{isExpanded ? "Collapse" : "Open Step"}</span>
                  </button>
                </div>
              </div>

              {/* Compliance & Timeline Warnings Banners */}
              {warnings.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                  {warnings.map((warn, wIdx) => (
                    <div 
                      key={wIdx} 
                      style={{ 
                        padding: "8px 12px", 
                        background: "rgba(244, 63, 94, 0.05)", 
                        border: "1px solid rgba(244, 63, 94, 0.2)", 
                        borderRadius: "6px", 
                        fontSize: "12px", 
                        color: "var(--accent-rose)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px" 
                      }}
                    >
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      <span><strong>{warn.label}:</strong> {warn.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Card Body - Horizontal Stepper */}
              <div className="pizza-tracker-wrapper">
                <div className="pizza-tracker-container">
                  <div className="pizza-tracker-line-bg" />
                  <div 
                    className="pizza-tracker-line-progress" 
                    style={{ 
                      width: `calc(${progressPercent}% - 0px)`,
                      backgroundColor: currentStageIndex >= 7 ? "var(--accent-emerald)" : "var(--accent-purple)" 
                    }}
                  />
                  
                  {iepStages.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    
                    // Compute step warning status for dots
                    let isWarning = false;
                    if (student.iepMeetingDate) {
                      if (idx === 2) {
                        // invitation sent notice check
                        if (student.iepInvitationSentDate && !student.meetingNoticeWaived) {
                          const noticeDays = getCalendarDaysDiff(student.iepInvitationSentDate, student.iepMeetingDate);
                          if (noticeDays !== null && noticeDays < 10) isWarning = true;
                        }
                      } else if (idx === 4) {
                        // data gathering warnings
                        const dataDue = addSchoolDays(student.iepMeetingDate, -7);
                        const surveyDue = addSchoolDays(student.iepMeetingDate, -6);
                        if ((!student.iepDataMiningCompleted && getDaysRemaining(dataDue) <= 0) || 
                            (!student.iepTransitionSurveyCompleted && getDaysRemaining(surveyDue) <= 0)) {
                          isWarning = true;
                        }
                      } else if (idx === 5) {
                        // drafting warnings
                        const draftDue = addSchoolDays(student.iepMeetingDate, -4);
                        const sendDue = addSchoolDays(student.iepMeetingDate, -2);
                        if ((!student.iepDraftWrittenDate && getDaysRemaining(draftDue) <= 0) || 
                            (!student.iepDraftSentDate && getDaysRemaining(sendDue) <= 0)) {
                          isWarning = true;
                        }
                      }
                    }

                    let stepClass = "";
                    if (isWarning && (isActive || !isCompleted)) stepClass = "warning";
                    else if (isActive) stepClass = "active";
                    else if (isCompleted) stepClass = "completed";

                    return (
                      <div 
                        key={idx} 
                        className={`pizza-tracker-step ${stepClass} ${selectedStep === idx ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedStepIndexByStudent(prev => ({ ...prev, [student.id]: idx }));
                          setExpandedStudentId(student.id);
                        }}
                      >
                        <div className="pizza-tracker-dot" style={{
                          backgroundColor: isCompleted && currentStageIndex >= 7 ? "var(--accent-emerald)" : "",
                          borderColor: isCompleted && currentStageIndex >= 7 ? "var(--accent-emerald)" : ""
                        }}>
                          {isCompleted ? "✔" : idx + 1}
                        </div>
                        <span className="pizza-tracker-label" style={{
                          color: isCompleted && currentStageIndex >= 7 ? "var(--accent-emerald)" : ""
                        }}>{stage.short}</span>
                        <span className="pizza-tracker-date" style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          display: "block"
                        }}>{getStageDueDate(student, idx)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanded Step Details Checklist */}
              {isExpanded && (
                <div className="timeline-card-body-expanded">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent-purple)", margin: 0 }}>
                      Workflow Step Details: {iepStages[selectedStep].label}
                    </h4>
                  </div>

                  <div className="glass-panel" style={{ padding: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                    {renderStepContent(student, selectedStep)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {activeStudents.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }} className="glass-panel">
            <p>No active gifted students loaded. Add students in the Student Directory first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
