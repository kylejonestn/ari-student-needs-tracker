/* ==========================================
   Aegis Gifted Tracker - IEP Planner Component
   ========================================== */

import React, { useState } from "react";
import { store, addDays, addSchoolDays, getDaysRemaining, DEFAULT_DEADLINES } from "../utils/studentStore";
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
  Sparkles,
  Play,
  Pause,
  Send,
  UserCheck
} from "lucide-react";

// Helper for calendar days difference
const getCalendarDaysDiff = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBD") return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dateStr;
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

// Helper to determine the current active stage dynamically (0 to 8) for Re-eval
const getReevalStageIndex = (student) => {
  // Stage 0: August Prep
  const isStage0Complete = student.augustSetupComplete || (student.iepAugustLetterSent && student.iepGenEdInvitesSent);
  if (!isStage0Complete) return 0;
  
  // Stage 1: Parent Proposal
  const isStage1Complete = student.iepParentProposalLetterSent && student.iepPermissionToEmailReceived && student.iepParentSurveyCompleted;
  if (!isStage1Complete) return 1;
  
  // Stage 2: Formal Invitation
  const isStage2Complete = student.iepInvitationSentDate && student.iepInvitationResponseReceived && student.iepMeetingDate;
  if (!isStage2Complete) return 2;
  
  // Stage 3: Teacher Checklist & Re-eval Teacher Survey
  const isStage3Complete = student.iepPreVocDispatched && student.iepTeacherChecklistSent && student.reevalTeacherSurveyReturned;
  if (!isStage3Complete) return 3;
  
  // Stage 4: Re-eval Surveys (Parent & Facilitator)
  const isStage4Complete = student.reevalParentSurveyReturned && student.reevalSelfSurveyCompleted;
  if (!isStage4Complete) return 4;
  
  // Stage 5: Direct Observation
  const isStage5Complete = student.reevalDirectObservationCompleted;
  if (!isStage5Complete) return 5;
  
  // Stage 6: Psychologist Handoff
  const isStage6Complete = student.reevalPsychologistHandoffDate;
  if (!isStage6Complete) return 6;
  
  // Stage 7: Drafting & Delivery
  const isStage7Complete = student.iepDraftWrittenDate && student.iepDraftSentDate;
  if (!isStage7Complete) return 7;
  
  // Stage 8: Meeting & Finalize
  const isStage8Complete = student.iepFinalizedDate && student.iepAtAGlancePrinted && student.iepAtAGlanceSignaturesCompleted && student.iepPulseUploadCompleted && student.iepSharePointUploadCompleted && student.iepPhysicalFileCompleted && student.reevalMeetingCompleted;
  if (!isStage8Complete) return 8;
  
  return 9; // Completed everything
};

export default function IepPlanner({ students = [], updateStudent }) {
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedStepIndexByStudent, setSelectedStepIndexByStudent] = useState({});
  
  // Observation Timer States for Re-eval Observation step
  const [obsTimer, setObsTimer] = useState(2100);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [obsNoteText, setObsNoteText] = useState("");
  const [showLogSuccess, setShowLogSuccess] = useState(false);

  // Observation Timer Effect
  React.useEffect(() => {
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

  const isMeetingDayWarning = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day !== 1 && day !== 4; // Monday = 1, Thursday = 4
  };

  const handleEmailTeacherSurvey = (student) => {
    if (!student) return;
    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
    const email = store.getState().workEmail || "lastname@rcschools.net";
    const subject = encodeURIComponent(`[Aegis Action Required] Gifted Re-evaluation Survey for ${student.name}`);
    const body = encodeURIComponent(
      `Hi ${student.classroomTeacher || "Teacher"},\n\n` +
      `As part of the mandatory 3-year triennial re-evaluation process for ${student.name}, ` +
      `could you please complete the characteristics/behavior checklist as soon as possible?\n\n` +
      `We need this compiled at least ${deadlines.reevalPsychHandoff} days before our upcoming meeting scheduled on ${student.reevalMeetingDate || "[Date TBD]"}.\n\n` +
      `Please let me know if you have any questions or need a print copy of the survey.\n\n` +
      `Thank you,\n` +
      `Ariel`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleLogObservationNotes = (student) => {
    if (!student || !obsNoteText.trim()) return;
    
    const logs = student.selNeeds ? [...(student.selNeeds.logs || [])] : [];
    logs.unshift({
      date: new Date().toISOString().split("T")[0],
      note: `[Classroom Re-evaluation Observation - 35min]: ${obsNoteText.trim()}`
    });

    const selNeeds = {
      ...(student.selNeeds || {}),
      type: student.selNeeds?.type || "Asynchronous Development",
      logs
    };

    updateStudent(student.id, {
      selNeeds,
      reevalDirectObservationCompleted: true,
      reevalDirectObservationDate: new Date().toISOString().split("T")[0]
    });

    setObsNoteText("");
    setObsTimer(2100);
    setShowLogSuccess(true);
    setTimeout(() => setShowLogSuccess(false), 2000);
  };

  const handleCompleteReeval = (student) => {
    if (!student) return;
    
    if (!student.reevalDirectObservationCompleted) {
      alert("Please complete the direct classroom student observation notes first.");
      return;
    }
    if (!student.reevalParentSurveyReturned || !student.reevalTeacherSurveyReturned || !student.reevalSelfSurveyCompleted) {
      alert("Please ensure all surveys (Parent, Teacher, and Facilitator) are completed/returned.");
      return;
    }
    if (!student.reevalPsychologistHandoffDate) {
      alert("Please complete the school psychologist handoff step before holding the meeting.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const newReevalDueDate = addDays(today, 3 * 365);
    
    updateStudent(student.id, {
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
      reevalMeetingCompleted: true
    });

    alert(`Re-evaluation completed successfully for ${student.name}! The next triennial evaluation has been calendared for ${newReevalDueDate}.`);
  };

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

  // Stages of the Re-eval timeline stepper
  const reevalStages = [
    { label: "August Prep", short: "Aug Prep" },
    { label: "Parent Proposal", short: "Parent Prop" },
    { label: "Formal Invitation", short: "Formal Invite" },
    { label: "Teacher Checklist", short: "Teacher Check" },
    { label: "Re-eval Surveys", short: "Surveys" },
    { label: "Direct Observation", short: "Observation" },
    { label: "Psychologist Handoff", short: "Psych Handoff" },
    { label: "Drafting & Delivery", short: "Draft & Deliv" },
    { label: "Meeting & Finalize", short: "Finalize" }
  ];

  const getStageDueDate = (student, idx, raw = false) => {
    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
    if (student.isReeval) {
      const meetingDate = student.reevalMeetingDate || student.iepMeetingDate;
      let val = "";
      switch (idx) {
        case 0:
          val = "2026-08-15";
          break;
        case 1:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepParentProposal) : "TBD";
          break;
        case 2:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepFormalInvitation) : "TBD";
          break;
        case 3:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepTeacherChecklist) : "TBD";
          break;
        case 4:
          val = meetingDate ? addDays(meetingDate, -deadlines.reevalPsychHandoff) : "TBD";
          break;
        case 5:
          val = meetingDate ? addDays(meetingDate, -deadlines.reevalObservation) : "TBD";
          break;
        case 6:
          val = meetingDate ? addDays(meetingDate, -deadlines.reevalPsychHandoff) : "TBD";
          break;
        case 7:
          val = meetingDate ? addSchoolDays(meetingDate, -deadlines.iepDraftWritten) : "TBD";
          break;
        case 8:
          val = meetingDate || "TBD";
          break;
        default:
          val = "";
      }
      return raw ? val : formatDate(val);
    } else {
      const meetingDate = student.iepMeetingDate;
      let val = "";
      switch (idx) {
        case 0:
          val = "2026-08-15";
          break;
        case 1:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepParentProposal) : "TBD";
          break;
        case 2:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepFormalInvitation) : "TBD";
          break;
        case 3:
          val = meetingDate ? addDays(meetingDate, -deadlines.iepTeacherChecklist) : "TBD";
          break;
        case 4:
          val = meetingDate ? addSchoolDays(meetingDate, -deadlines.iepDataGathering) : "TBD";
          break;
        case 5:
          val = meetingDate ? addSchoolDays(meetingDate, -deadlines.iepDraftWritten) : "TBD";
          break;
        case 6:
          val = meetingDate || "TBD";
          break;
        default:
          val = "";
      }
      return raw ? val : formatDate(val);
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
    const meetingDate = student.iepMeetingDate || student.reevalMeetingDate;
    if (!meetingDate) return warnings;
    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;

    // Standard notice compliance warning
    if (student.iepInvitationSentDate && !student.meetingNoticeWaived) {
      const noticeDays = getCalendarDaysDiff(student.iepInvitationSentDate, meetingDate);
      if (noticeDays !== null && noticeDays < deadlines.iepFormalInvitation) {
        warnings.push({
          type: "notice",
          label: "Invitation Notice Warning",
          text: `Invitation sent on ${student.iepInvitationSentDate} is only ${noticeDays} calendar days prior to the meeting (target: ${deadlines.iepFormalInvitation} days).`,
          status: "warning"
        });
      }
    }

    // Re-eval specific legal notice check
    if (student.isReeval && student.reevalInvitationSentDate) {
      const noticeDays = getCalendarDaysDiff(student.reevalInvitationSentDate, meetingDate);
      if (noticeDays !== null && noticeDays < 10) {
        warnings.push({
          type: "notice-legal",
          label: "Legal Notice Warning",
          text: `Invitation sent on ${student.reevalInvitationSentDate} is less than the legal 10-day limit prior to the meeting.`,
          status: "rose"
        });
      }
    }

    // Standard data gathering reminder
    if (!student.iepDataMiningCompleted) {
      const dataDue = addSchoolDays(meetingDate, -deadlines.iepDataGathering);
      if (getDaysRemaining(dataDue) <= 0) {
        warnings.push({
          type: "data",
          label: "Data Mining Reminder",
          text: `Academic scores (TVAAS, Mastery Connect, EasyCBM, Savvas) should be pulled (${deadlines.iepDataGathering} school days prior reminder; target: ${dataDue}).`,
          status: "warning"
        });
      }
    }

    // Standard transition survey reminder
    if (!student.iepTransitionSurveyCompleted) {
      const surveyDue = addSchoolDays(meetingDate, -deadlines.iepTransitionSurvey);
      if (getDaysRemaining(surveyDue) <= 0) {
        warnings.push({
          type: "transition",
          label: "Transition Survey Reminder",
          text: `Student Transition Survey is past due (${deadlines.iepTransitionSurvey} school days prior reminder; target: ${surveyDue}).`,
          status: "warning"
        });
      }
    }

    // Standard draft document writing reminder
    if (!student.iepDraftWrittenDate) {
      const draftDue = addSchoolDays(meetingDate, -deadlines.iepDraftWritten);
      if (getDaysRemaining(draftDue) <= 0) {
        warnings.push({
          type: "draft",
          label: "IEP Draft Due",
          text: `IEP Draft on TN Pulse should be completed (${deadlines.iepDraftWritten} school days prior reminder; target: ${draftDue}).`,
          status: "warning"
        });
      }
    }

    // Standard draft sending reminder
    if (!student.iepDraftSentDate) {
      const sendDue = addSchoolDays(meetingDate, -deadlines.iepDraftSent);
      if (getDaysRemaining(sendDue) <= 0) {
        warnings.push({
          type: "sendDraft",
          label: "Draft Delivery Due",
          text: `Draft IEP & Zoom link must be sent to parent (${deadlines.iepDraftSent} school days / 48 hours prior reminder; target: ${sendDue}).`,
          status: "warning"
        });
      }
    }

    // Re-eval specific Observation reminder
    if (student.isReeval && !student.reevalDirectObservationCompleted) {
      const obsDue = addDays(meetingDate, -deadlines.reevalObservation);
      if (getDaysRemaining(obsDue) <= 0) {
        warnings.push({
          type: "observation",
          label: "Observation Due",
          text: `Direct classroom observation notes should be completed (${deadlines.reevalObservation} calendar days prior; target: ${obsDue}).`,
          status: "warning"
        });
      }
    }

    // Re-eval specific Psychologist Handoff reminder
    if (student.isReeval && !student.reevalPsychologistHandoffDate) {
      const handoffDue = addDays(meetingDate, -deadlines.reevalPsychHandoff);
      if (getDaysRemaining(handoffDue) <= 0) {
        warnings.push({
          type: "handoff",
          label: "Psychologist Handoff Due",
          text: `Handoff surveys and observation notes are past due (${deadlines.reevalPsychHandoff} calendar days prior; target: ${handoffDue}).`,
          status: "warning"
        });
      }
    }

    return warnings;
  };

  // Step checklist and form content renderer
  const renderStepContent = (student, stepIndex) => {
    if (student.isReeval) {
      return renderReevalStepContent(student, stepIndex);
    } else {
      return renderIepStepContent(student, stepIndex);
    }
  };

  const renderIepStepContent = (student, stepIndex) => {
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
                {student.isReeval && isMeetingDayWarning(student.iepMeetingDate) && (
                  <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                    ⚠️ Warning: School psychologist only available Mondays & Thursdays.
                  </p>
                )}
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

  const renderReevalStepContent = (student, stepIndex) => {
    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
    switch (stepIndex) {
      case 0: // August Prep
        return renderIepStepContent(student, 0);

      case 1: // Parent Proposal
        return renderIepStepContent(student, 1);

      case 2: // Formal Invitation
        return renderIepStepContent(student, 2);

      case 3: // Teacher Checklist & Teacher Survey
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Render standard teacher checklist content */}
            {renderIepStepContent(student, 3)}
            
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
              <h5 style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-purple)", marginBottom: "8px" }}>
                Re-evaluation Teacher Survey Track
              </h5>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: "600", fontSize: "12px" }}>Teacher Re-evaluation Survey</span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "2px 6px", fontSize: "9px", display: "block", marginTop: "4px" }}
                    onClick={() => handleEmailTeacherSurvey(student)}
                  >
                    Email Request
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "11px" }}>
                    <input 
                      type="checkbox"
                      checked={!!student.reevalTeacherSurveyDispatched}
                      onChange={(e) => updateStudent(student.id, { reevalTeacherSurveyDispatched: e.target.checked })}
                    />
                    <span>Sent</span>
                  </label>
                  <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "11px" }}>
                    <input 
                      type="checkbox"
                      checked={!!student.reevalTeacherSurveyReturned}
                      onChange={(e) => updateStudent(student.id, { reevalTeacherSurveyReturned: e.target.checked })}
                    />
                    <strong>Returned</strong>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Re-eval Surveys (Parent & Facilitator)
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Send and track parent re-evaluation checklist and complete the facilitator IEP inputs.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                <div>
                  <span style={{ fontWeight: "600", fontSize: "12px" }}>Parent Re-evaluation Survey</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "11px" }}>
                    <input 
                      type="checkbox"
                      checked={!!student.reevalParentSurveyDispatched}
                      onChange={(e) => updateStudent(student.id, { reevalParentSurveyDispatched: e.target.checked })}
                    />
                    <span>Sent</span>
                  </label>
                  <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "11px" }}>
                    <input 
                      type="checkbox"
                      checked={!!student.reevalParentSurveyReturned}
                      onChange={(e) => updateStudent(student.id, { reevalParentSurveyReturned: e.target.checked })}
                    />
                    <strong>Returned</strong>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "4px" }}>
                <div>
                  <span style={{ fontWeight: "600", fontSize: "12px" }}>Facilitator IEP Input Survey</span>
                </div>
                <label style={{ display: "inline-flex", gap: "4px", alignItems: "center", fontSize: "11px" }}>
                  <input 
                    type="checkbox"
                    checked={!!student.reevalSelfSurveyCompleted}
                    onChange={(e) => updateStudent(student.id, { reevalSelfSurveyCompleted: e.target.checked })}
                  />
                  <strong>Completed</strong>
                </label>
              </div>
            </div>
          </div>
        );

      case 5: // Direct Observation
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Conduct a 35-minute classroom observation of the student in ELA/Math.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "12px", borderRadius: "6px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "1px", color: isTimerRunning ? "var(--accent-purple)" : "inherit" }}>
                  {formatTime(obsTimer)}
                </span>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? "Pause" : "Start"}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                    onClick={() => { setIsTimerRunning(false); setObsTimer(2100); }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <textarea 
                  className="input-field"
                  placeholder="Type observation notes here..."
                  value={obsNoteText}
                  onChange={(e) => setObsNoteText(e.target.value)}
                  style={{ height: "70px", padding: "6px", fontSize: "11px", resize: "none" }}
                />
                <button 
                  className="btn btn-primary"
                  style={{ padding: "6px", fontSize: "11px" }}
                  onClick={() => handleLogObservationNotes(student)}
                  disabled={!obsNoteText.trim()}
                >
                  Log Observation Notes
                </button>
                {showLogSuccess && (
                  <span style={{ fontSize: "11px", color: "var(--accent-emerald)", fontWeight: "600", textAlign: "center" }}>
                    ✔ Observation saved to student progress logs!
                  </span>
                )}
                {student.reevalDirectObservationCompleted && (
                  <span style={{ fontSize: "11px", color: "var(--accent-emerald)", fontWeight: "600" }}>
                    ✔ Observation completed on {student.reevalDirectObservationDate || "Date Unset"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 6: // Psychologist Handoff
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Submit ELA/Math observations and surveys to the School Psychologist at least {deadlines.reevalPsychHandoff} days before the meeting.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Handoff Completed Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.reevalPsychologistHandoffDate || ""}
                  onChange={(e) => updateStudent(student.id, { reevalPsychologistHandoffDate: e.target.value })}
                />
                {student.reevalMeetingDate && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Handoff deadline: <strong>{addDays(student.reevalMeetingDate, -deadlines.reevalPsychHandoff)}</strong>.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {student.reevalPsychologistHandoffDate && (
                  <div style={{ padding: "10px", borderRadius: "6px", backgroundColor: "var(--accent-emerald-light)", color: "var(--accent-emerald)", fontSize: "11px", fontWeight: "600", width: "100%" }}>
                    ✔ Files compiled and sent to School Psychologist.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 7: // Drafting & Delivery
        return renderIepStepContent(student, 5);

      case 8: // Meeting & Finalize
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Render standard meeting & finalize content */}
            {renderIepStepContent(student, 6)}
            
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
              <h5 style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-purple)", marginBottom: "8px" }}>
                Triennial Re-evaluation Closure
              </h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "center" }}>
                <div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: "100%", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    onClick={() => handleCompleteReeval(student)}
                  >
                    Conclude Re-evaluation
                  </button>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ color: student.reevalDirectObservationCompleted ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    {student.reevalDirectObservationCompleted ? "✔ Observation Notes logged" : "✘ Missing Observation Notes"}
                  </div>
                  <div style={{ color: (student.reevalParentSurveyReturned && student.reevalTeacherSurveyReturned && student.reevalSelfSurveyCompleted) ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    {(student.reevalParentSurveyReturned && student.reevalTeacherSurveyReturned && student.reevalSelfSurveyCompleted) ? "✔ All surveys returned" : "✘ Missing surveys"}
                  </div>
                  <div style={{ color: student.reevalPsychologistHandoffDate ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    {student.reevalPsychologistHandoffDate ? "✔ Psychologist Handoff logged" : "✘ Missing Handoff"}
                  </div>
                </div>
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
          const currentStages = student.isReeval ? reevalStages : iepStages;
          const currentStageIndex = student.isReeval ? getReevalStageIndex(student) : getIepStageIndex(student);
          const warnings = getIepWarnings(student);
          
          // Compute progress percentage
          const progressPercent = (currentStageIndex / (currentStages.length - 1)) * 100;

          // Get selected step index in panel
          const maxStepIndex = currentStages.length - 1;
          const selectedStep = selectedStepIndexByStudent[student.id] ?? (currentStageIndex >= currentStages.length ? maxStepIndex : currentStageIndex);

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
                    {currentStageIndex >= currentStages.length ? (
                      <span className="badge badge-emerald" style={{ fontSize: "11px" }}>
                        {student.isReeval ? "Re-eval Finalized" : "IEP Finalized"}
                      </span>
                    ) : (
                      <span className="badge badge-purple" style={{ fontSize: "11px" }}>
                        Stage {currentStageIndex + 1}: {currentStages[currentStageIndex]?.label}
                      </span>
                    )}
                  </h3>
                  <div className="timeline-student-meta">
                    <span>Grade: <strong>{student.grade}</strong></span>
                    <span>Teacher: <strong>{student.classroomTeacher}</strong></span>
                    <span>IEP Due Date: <strong style={{ color: getDaysRemaining(student.iepDueDate) <= 30 ? "var(--accent-rose)" : "inherit" }}>{student.iepDueDate || "Not Set"}</strong></span>
                    {student.iepMeetingDate && !student.isReeval && (
                      <span style={{ color: "var(--accent-purple)" }}>
                        Meeting: <strong>{student.iepMeetingDate}</strong>
                      </span>
                    )}
                    {student.reevalMeetingDate && student.isReeval && (
                      <span style={{ color: "var(--accent-purple)" }}>
                        Re-eval Meeting: <strong>{student.reevalMeetingDate}</strong>
                      </span>
                    )}
                    <span style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "12px", display: "inline-flex", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "11px", color: "var(--accent-purple)", fontWeight: "600", margin: 0 }}>
                        <input 
                          type="checkbox"
                          checked={!!student.isReeval}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateStudent(student.id, { 
                              isReeval: val,
                              reevalDueDate: student.reevalDueDate || addDays(new Date().toISOString().split("T")[0], 3 * 365)
                            });
                            setSelectedStepIndexByStudent(prev => ({
                              ...prev,
                              [student.id]: 0
                            }));
                          }}
                          style={{ margin: 0 }}
                        />
                        <span>Re-Eval Track</span>
                      </label>
                    </span>
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
                          [student.id]: currentStageIndex >= currentStages.length ? maxStepIndex : currentStageIndex
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
                      backgroundColor: currentStageIndex >= currentStages.length ? "var(--accent-emerald)" : "var(--accent-purple)" 
                    }}
                  />
                  
                  {currentStages.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isActive = idx === currentStageIndex;
                    
                    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
                    // Compute step warning status for dots
                    let isWarning = false;
                    if (student.isReeval) {
                      if (student.reevalMeetingDate) {
                        if (idx === 0) {
                          if (student.reevalInvitationSentDate) {
                            const noticeDays = getCalendarDaysDiff(student.reevalInvitationSentDate, student.reevalMeetingDate);
                            if (noticeDays !== null && noticeDays < 10) isWarning = true;
                          }
                        } else if (idx === 2) {
                          const obsDue = addDays(student.reevalMeetingDate, -deadlines.reevalObservation);
                          if (!student.reevalDirectObservationCompleted && getDaysRemaining(obsDue) <= 0) isWarning = true;
                        } else if (idx === 3) {
                          const handoffDue = addDays(student.reevalMeetingDate, -deadlines.reevalPsychHandoff);
                          if (!student.reevalPsychologistHandoffDate && getDaysRemaining(handoffDue) <= 0) isWarning = true;
                        }
                      }
                    } else {
                      if (student.iepMeetingDate) {
                        if (idx === 2) {
                          // invitation sent notice check
                          if (student.iepInvitationSentDate && !student.meetingNoticeWaived) {
                            const noticeDays = getCalendarDaysDiff(student.iepInvitationSentDate, student.iepMeetingDate);
                            if (noticeDays !== null && noticeDays < deadlines.iepFormalInvitation) isWarning = true;
                          }
                        } else if (idx === 4) {
                          // data gathering warnings
                          const dataDue = addSchoolDays(student.iepMeetingDate, -deadlines.iepDataGathering);
                          const surveyDue = addSchoolDays(student.iepMeetingDate, -deadlines.iepTransitionSurvey);
                          if ((!student.iepDataMiningCompleted && getDaysRemaining(dataDue) <= 0) || 
                              (!student.iepTransitionSurveyCompleted && getDaysRemaining(surveyDue) <= 0)) {
                            isWarning = true;
                          }
                        } else if (idx === 5) {
                          // drafting warnings
                          const draftDue = addSchoolDays(student.iepMeetingDate, -deadlines.iepDraftWritten);
                          const sendDue = addSchoolDays(student.iepMeetingDate, -deadlines.iepDraftSent);
                          if ((!student.iepDraftWrittenDate && getDaysRemaining(draftDue) <= 0) || 
                              (!student.iepDraftSentDate && getDaysRemaining(sendDue) <= 0)) {
                            isWarning = true;
                          }
                        }
                      }
                    }

                    let stepClass = "";
                    if (isWarning && (isActive || !isCompleted)) stepClass = "warning";
                    else if (isActive) stepClass = "active";
                    else if (isCompleted) stepClass = "completed";

                    const rawDate = getStageDueDate(student, idx, true);
                    const isPast = rawDate && rawDate !== "TBD" && getDaysRemaining(rawDate) < 0;
                    const dateClass = isCompleted && isPast ? "completed-past" : "";

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
                          backgroundColor: isCompleted && currentStageIndex >= currentStages.length ? "var(--accent-emerald)" : "",
                          borderColor: isCompleted && currentStageIndex >= currentStages.length ? "var(--accent-emerald)" : ""
                        }}>
                          {isCompleted ? "✔" : idx + 1}
                        </div>
                        <span className="pizza-tracker-label" style={{
                          color: isCompleted && currentStageIndex >= currentStages.length ? "var(--accent-emerald)" : ""
                        }}>{stage.short}</span>
                        <span className={`pizza-tracker-date ${dateClass}`} style={{
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
                      Workflow Step Details: {currentStages[selectedStep]?.label}
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
