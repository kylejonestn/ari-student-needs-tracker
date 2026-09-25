/* ==========================================
   Aegis Gifted Tracker - Dashboard Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { 
  store,
  calculateTimelines, 
  getDaysRemaining,
  guessTeacherEmail,
  addDays,
  getTodayISO,
  DEFAULT_DEADLINES
} from "../utils/studentStore";
import { 
  Users, 
  CheckSquare, 
  SquareCheckBig,
  AlertTriangle, 
  Bell, 
  Send,
  Calendar,
  CheckCircle,
  FileCheck,
  Printer,
  Sparkles,
  ClipboardList,
  Cloud,
  CloudOff,
  RefreshCw,
  Info,
  Check,
  RotateCcw,
  X
} from "lucide-react";

export default function Dashboard({ 
  students, 
  screenings, 
  updateScreening,
  interactiveChecklistMode: propChecklistMode,
  seenChecklistTeaser: propSeenTeaser
}) {
  const interactiveChecklistMode = propChecklistMode !== undefined ? propChecklistMode : !!store.getState().interactiveChecklistMode;
  const seenChecklistTeaser = propSeenTeaser !== undefined ? propSeenTeaser : !!store.getState().seenChecklistTeaser;

  const [recentlyCompleted, setRecentlyCompleted] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  const [activityLog, setActivityLog] = useState([
    { id: 1, time: "10:30 AM", msg: "Automated email summary of weekly deadlines generated for Ariel." },
    { id: 2, time: "Yesterday", msg: "Calendar synced 3 new IEP meeting schedules to RCS Outlook." }
  ]);

  const [showAugustSetup, setShowAugustSetup] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("thisWeek"); // "thisWeek" | "nextWeek"
  const [timelineFilter, setTimelineFilter] = useState("all"); // "all", "activeWeek", "overdue"

  // Clean up any unexpired undo timers on unmount
  useEffect(() => {
    return () => {
      Object.values(recentlyCompleted).forEach(entry => {
        if (entry?.timerId) clearTimeout(entry.timerId);
      });
    };
  }, []);

  const handleTimelineClick = (t) => {
    if (t.category === "Screening") {
      let stepIndex = 0;
      switch (t.type) {
        case "Quick Survey":
          stepIndex = 0;
          break;
        case "Consent Pending":
          stepIndex = 1;
          break;
        case "60-Day Evaluation":
        case "Teacher Input Checklist":
        case "Academic Check-in":
        case "Creativity Check-in":
          stepIndex = 2;
          break;
        case "Informed Consent":
          stepIndex = 3;
          break;
        case "Permission to Test":
          stepIndex = 4;
          break;
        case "Psychologist 60-Day Evaluation":
        case "Psychologist Check-in":
          stepIndex = 5;
          break;
        case "Placement Meeting":
        case "Meeting Invitation":
          stepIndex = 6;
          break;
        case "Pending Discontinuation":
          stepIndex = 7;
          break;
        default:
          stepIndex = 0;
      }
      store.updateState({
        activeTab: "screening",
        selectedScreeningId: t.studentId,
        selectedScreeningStepIndex: stepIndex
      });
    } else if (t.category === "Active") {
      if (t.type === "IEP Progress Report") {
        const quarterMatch = t.label ? t.label.match(/Q[1-4]/) : null;
        const quarter = quarterMatch ? quarterMatch[0] : "Q4";
        store.updateState({
          activeTab: "progress",
          selectedProgressStudentId: t.studentId,
          selectedProgressQuarter: quarter
        });
      } else {
        const student = students.find(s => s.id === t.studentId);
        const isReeval = !!student?.isReeval;
        let stepIndex = 0;

        if (isReeval) {
          switch (t.type) {
            case "August Setup":
            case "August Calendar":
              stepIndex = 0;
              break;
            case "IEP Due Date":
            case "Triennial Re-evaluation":
            case "Re-eval Schedule":
              stepIndex = 1;
              break;
            case "IEP Invitation":
            case "IEP Invitation Follow-Up":
            case "Re-eval Invitation":
              stepIndex = 2;
              break;
            case "Re-eval Surveys Check":
              stepIndex = 4;
              break;
            case "Re-eval Observation":
              stepIndex = 5;
              break;
            case "Re-eval Psych Handoff":
              stepIndex = 6;
              break;
            case "IEP Data Mining":
            case "IEP Transition Survey":
              stepIndex = 7;
              break;
            case "IEP Writing":
            case "IEP Send Draft":
              stepIndex = 8;
              break;
            case "IEP Finalization":
              stepIndex = 9;
              break;
            case "IEP Print Glance":
            case "IEP Friday Signatures":
            case "IEP At-A-Glance":
              stepIndex = 10;
              break;
            case "IEP Pulse & PWN":
            case "IEP Uploads":
            case "IEP Send Final Copy":
              stepIndex = 11;
              break;
            case "IEP SPED File":
            case "Update Physical SPED File":
              stepIndex = 12;
              break;
            default:
              stepIndex = 0;
          }
        } else {
          switch (t.type) {
            case "August Setup":
            case "August Calendar":
              stepIndex = 0;
              break;
            case "IEP Due Date":
              stepIndex = 1;
              break;
            case "IEP Invitation":
            case "IEP Invitation Follow-Up":
              stepIndex = 2;
              break;
            case "IEP Data Mining":
            case "IEP Transition Survey":
              stepIndex = 4;
              break;
            case "IEP Writing":
            case "IEP Send Draft":
              stepIndex = 5;
              break;
            case "IEP Finalization":
              stepIndex = 6;
              break;
            case "IEP Print Glance":
            case "IEP Friday Signatures":
            case "IEP At-A-Glance":
              stepIndex = 7;
              break;
            case "IEP Pulse & PWN":
            case "IEP Uploads":
            case "IEP Send Final Copy":
              stepIndex = 8;
              break;
            case "IEP SPED File":
            case "Update Physical SPED File":
              stepIndex = 9;
              break;
            default:
              stepIndex = 0;
          }
        }

        store.updateState({
          activeTab: "iep",
          selectedIepStudentId: t.studentId,
          selectedIepStepIndex: stepIndex
        });
      }
    }
  };

  // Aggregate stats
  const activeCount = students.filter(s => !s.deleted && s.status === "Active").length;
  const screeningCount = screenings.filter(s => !s.deleted && s.status !== "Pending Discontinuation" && s.status !== "Completed" && s.status !== "Placed" && s.status !== "Archived").length;
  
  // Consolidate all timelines
  const activeTimelines = students.filter(s => !s.deleted && s.status === "Active").flatMap(s => calculateTimelines(s, false).map(t => ({ ...t, studentId: s.id, studentName: s.name, category: "Active" })));
  const screeningTimelines = screenings.filter(s => !s.deleted && s.status !== "Placed" && s.status !== "Archived").flatMap(s => calculateTimelines(s, true).map(t => ({ ...t, studentId: s.id, studentName: s.name, category: "Screening" })));
  
  const rawTimelines = [...activeTimelines, ...screeningTimelines];
  
  // Current calendar / school week range (Monday through Sunday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
  
  // Start of current week (Monday 00:00:00)
  const startOfThisWeek = new Date(today);
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  startOfThisWeek.setDate(startOfThisWeek.getDate() + distToMonday);
  
  // End of current week (Sunday 23:59:59)
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23, 59, 59, 999);

  // Start of next week (Next Monday 00:00:00)
  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  // End of next week (Next Sunday 23:59:59)
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
  endOfNextWeek.setHours(23, 59, 59, 999);

  // Active viewing window based on selectedWeek
  const activeStartOfWeek = selectedWeek === "nextWeek" ? startOfNextWeek : startOfThisWeek;
  const activeEndOfWeek = selectedWeek === "nextWeek" ? endOfNextWeek : endOfThisWeek;

  // Formatted date range string (e.g. Sep 14 – Sep 20)
  const formatDateRange = (start, end) => {
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startStr} – ${endStr}`;
  };

  const activeDateRangeStr = formatDateRange(activeStartOfWeek, activeEndOfWeek);

  // Items due within the currently selected week (excluding overdue items)
  const dueActiveWeekItems = rawTimelines.filter(t => {
    if (t.daysRemaining !== null && t.daysRemaining < 0) return false;
    
    if (t.dueDate) {
      const dueDateObj = new Date(t.dueDate + "T12:00:00");
      return dueDateObj >= activeStartOfWeek && dueDateObj <= activeEndOfWeek;
    }
    
    // Active non-dated tasks requiring completion during current week
    if (selectedWeek === "thisWeek" && (t.type === "IEP Friday Signatures" || t.type === "Pending Discontinuation")) {
      return true;
    }
    return false;
  });

  const dueActiveWeekCount = dueActiveWeekItems.length;

  // Overdue items
  const overdueItems = rawTimelines.filter(t => t.daysRemaining !== null && t.daysRemaining < 0);
  const overdueCount = overdueItems.length;

  // Combined default view (all overdue items + items due in the active selected week)
  const defaultWeeklyTimelines = [...overdueItems, ...dueActiveWeekItems];

  const displayedTimelines = (
    timelineFilter === "activeWeek" || timelineFilter === "thisWeek"
      ? dueActiveWeekItems
      : timelineFilter === "overdue"
      ? overdueItems
      : defaultWeeklyTimelines
  ).sort((a, b) => (a.daysRemaining === null ? 999 : a.daysRemaining) - (b.daysRemaining === null ? 999 : b.daysRemaining));

  // Determine if a timeline item is a checkable task vs an overarching countdown
  const isTaskCheckable = (t) => {
    if (!t) return false;
    if (
      t.type === "IEP Due Date" || 
      t.type === "Triennial Re-evaluation" || 
      t.type === "60-Day Evaluation" || 
      t.type === "Psychologist 60-Day Evaluation" ||
      t.type === "IEP Progress Report"
    ) {
      return false;
    }
    return true;
  };

  // Maps a timeline task to studentStore update fields and their exact undo counterpart
  const getTaskCompletionDiff = (t, studentOrScreening) => {
    if (t.category === "Active") {
      switch (t.type) {
        case "August Setup":
          return {
            updates: { augustSetupComplete: true },
            undoValues: { augustSetupComplete: false }
          };
        case "August Calendar":
          return {
            updates: { augustTeacherInvitesSent: true, augustParentLetterSent: true },
            undoValues: { augustTeacherInvitesSent: false, augustParentLetterSent: false }
          };
        case "IEP Invitation":
          return {
            updates: { iepInvitationSentDate: getTodayISO() },
            undoValues: { iepInvitationSentDate: "" }
          };
        case "IEP Invitation Follow-Up":
          return {
            updates: { iepInvitationResponseReceived: true },
            undoValues: { iepInvitationResponseReceived: false }
          };
        case "IEP Data Mining":
          return {
            updates: { iepDataMiningCompleted: true },
            undoValues: { iepDataMiningCompleted: false }
          };
        case "IEP Transition Survey":
          return {
            updates: { iepTransitionSurveyCompleted: true },
            undoValues: { iepTransitionSurveyCompleted: false }
          };
        case "IEP Writing":
          return {
            updates: { iepDraftWrittenDate: getTodayISO() },
            undoValues: { iepDraftWrittenDate: "" }
          };
        case "IEP Send Draft":
          return {
            updates: { iepDraftSentDate: getTodayISO() },
            undoValues: { iepDraftSentDate: "" }
          };
        case "IEP Finalization":
          return {
            updates: { iepFinalizedDate: getTodayISO() },
            undoValues: { iepFinalizedDate: "" }
          };
        case "IEP Print Glance":
          return {
            updates: { iepAtAGlancePrinted: true },
            undoValues: { iepAtAGlancePrinted: false }
          };
        case "IEP Friday Signatures":
          return {
            updates: { iepAtAGlanceSignaturesCompleted: true },
            undoValues: { iepAtAGlanceSignaturesCompleted: false }
          };
        case "IEP Pulse & PWN":
          return {
            updates: { 
              iepPulseUploadCompleted: true, 
              iepPwnWritten: true, 
              iepFinalCopySentParent: true, 
              iepSharePointUploadCompleted: true 
            },
            undoValues: { 
              iepPulseUploadCompleted: false, 
              iepPwnWritten: false, 
              iepFinalCopySentParent: false, 
              iepSharePointUploadCompleted: false 
            }
          };
        case "IEP SPED File":
          return {
            updates: { iepPhysicalFileCompleted: true },
            undoValues: { iepPhysicalFileCompleted: false }
          };
        case "Re-eval Schedule":
          return {
            updates: { reevalMeetingDate: getTodayISO() },
            undoValues: { reevalMeetingDate: "" }
          };
        case "Re-eval Invitation":
          return {
            updates: { reevalInvitationSentDate: getTodayISO() },
            undoValues: { reevalInvitationSentDate: "" }
          };
        case "Re-eval Observation":
          return {
            updates: { reevalDirectObservationCompleted: true },
            undoValues: { reevalDirectObservationCompleted: false }
          };
        case "Re-eval Surveys Check":
          return {
            updates: { 
              reevalParentSurveyReturned: true, 
              reevalTeacherSurveyReturned: true, 
              reevalSelfSurveyCompleted: true 
            },
            undoValues: { 
              reevalParentSurveyReturned: false, 
              reevalTeacherSurveyReturned: false, 
              reevalSelfSurveyCompleted: false 
            }
          };
        case "Re-eval Psych Handoff":
          return {
            updates: { reevalPsychologistHandoffDate: getTodayISO() },
            undoValues: { reevalPsychologistHandoffDate: "" }
          };
        default:
          return null;
      }
    } else if (t.category === "Screening") {
      switch (t.type) {
        case "Quick Survey":
          return {
            updates: { status: "Consent Pending" },
            undoValues: { status: "Quick Survey" }
          };
        case "Consent Pending":
          return {
            updates: { status: "Evaluation in Progress", consentReceivedDate: getTodayISO() },
            undoValues: { status: "Consent Pending", consentReceivedDate: "" }
          };
        case "Teacher Input Checklist":
          return {
            updates: { teacherChecklistSigned: true },
            undoValues: { teacherChecklistSigned: false }
          };
        case "Academic Check-in":
          return {
            updates: { matrix: { ...(studentOrScreening?.matrix || {}), performance: { score: 10, option: "standard" } } },
            undoValues: { matrix: { ...(studentOrScreening?.matrix || {}), performance: { score: null, option: "" } } }
          };
        case "Creativity Check-in":
          return {
            updates: { matrix: { ...(studentOrScreening?.matrix || {}), creativity: { score: 10, option: "standard" } } },
            undoValues: { matrix: { ...(studentOrScreening?.matrix || {}), creativity: { score: null, option: "" } } }
          };
        case "Informed Consent":
          return {
            updates: { informedConsentCompleted: true, status: "Permission to Test Pending" },
            undoValues: { informedConsentCompleted: false, status: "Informed Consent" }
          };
        case "Permission to Test":
          return {
            updates: { permissionToTestReceivedDate: getTodayISO(), status: "Psych Results Pending" },
            undoValues: { permissionToTestReceivedDate: "", status: "Permission to Test Pending" }
          };
        case "Psychologist Check-in":
          return {
            updates: { psychResultsReceived: true },
            undoValues: { psychResultsReceived: false }
          };
        case "Meeting Invitation":
          return {
            updates: { meetingInvitationSentDate: getTodayISO() },
            undoValues: { meetingInvitationSentDate: "" }
          };
        case "Placement Meeting":
          return {
            updates: { status: "Placed" },
            undoValues: { status: "Meeting Scheduled" }
          };
        case "Pending Discontinuation":
          return {
            updates: { status: "Archived" },
            undoValues: { status: "Pending Discontinuation" }
          };
        default:
          return null;
      }
    }
    return null;
  };

  // Compile tasks that are already completed for active students and screenings
  const getHistoricalCompletedTasks = () => {
    const list = [];
    students.filter(s => !s.deleted && s.status === "Active").forEach(s => {
      if (s.iepFinalizedDate) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Finalization",
          label: s.isReeval ? "Finalize Re-eval & Pulse IEP" : "Finalize Pulse IEP",
          desc: `Completed and locked on ${s.iepFinalizedDate}.`,
          dueDate: s.iepFinalizedDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepAtAGlancePrinted) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Print Glance",
          label: "Print IEP at a Glance",
          desc: "Teacher 1-page summary printed.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepAtAGlanceSignaturesCompleted) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Friday Signatures",
          label: "At-A-Glance Teacher Signatures",
          desc: "Classroom teacher signatures collected.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepPulseUploadCompleted && s.iepPwnWritten && s.iepFinalCopySentParent) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Pulse & PWN",
          label: "Uploads, PWN & Parent Copy",
          desc: "Pulse upload, PWN, and parent copy complete.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepPhysicalFileCompleted) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP SPED File",
          label: "Update Physical SPED File",
          desc: "Physical paperwork and SPED folder archived.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepInvitationSentDate) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Invitation",
          label: "Send IEP Team Invitation",
          desc: `Invitation sent on ${s.iepInvitationSentDate}.`,
          dueDate: s.iepInvitationSentDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepDataMiningCompleted) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Data Mining",
          label: "Academic Data Mining",
          desc: "TCAP, Mastery Connect, and AIMSweb scores mined.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepTransitionSurveyCompleted) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Transition Survey",
          label: "Student Transition Survey",
          desc: "Student transition goals survey completed.",
          dueDate: s.iepMeetingDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepDraftWrittenDate) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Writing",
          label: s.isReeval ? "Write Re-eval / IEP Document Draft" : "Write IEP Document Draft",
          desc: `IEP draft completed on ${s.iepDraftWrittenDate}.`,
          dueDate: s.iepDraftWrittenDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.iepDraftSentDate) {
        list.push({
          studentId: s.id,
          studentName: s.name,
          category: "Active",
          type: "IEP Send Draft",
          label: s.isReeval ? "Send Re-eval / IEP Draft to Parents" : "Send IEP Draft to Parents",
          desc: `Draft sent to parents on ${s.iepDraftSentDate}.`,
          dueDate: s.iepDraftSentDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (s.isReeval) {
        if (s.reevalDirectObservationCompleted) {
          list.push({
            studentId: s.id,
            studentName: s.name,
            category: "Active",
            type: "Re-eval Observation",
            label: "Conduct Classroom Observation",
            desc: "Classroom observation notes completed.",
            dueDate: s.reevalMeetingDate || "",
            daysRemaining: 0,
            status: "completed",
            isCompleted: true
          });
        }
        if (s.reevalParentSurveyReturned && s.reevalTeacherSurveyReturned && s.reevalSelfSurveyCompleted) {
          list.push({
            studentId: s.id,
            studentName: s.name,
            category: "Active",
            type: "Re-eval Surveys Check",
            label: "Complete Re-eval Surveys",
            desc: "Parent, teacher, and self surveys returned.",
            dueDate: s.reevalMeetingDate || "",
            daysRemaining: 0,
            status: "completed",
            isCompleted: true
          });
        }
        if (s.reevalPsychologistHandoffDate) {
          list.push({
            studentId: s.id,
            studentName: s.name,
            category: "Active",
            type: "Re-eval Psych Handoff",
            label: "Submit surveys to psych",
            desc: `Surveys submitted on ${s.reevalPsychologistHandoffDate}.`,
            dueDate: s.reevalPsychologistHandoffDate,
            daysRemaining: 0,
            status: "completed",
            isCompleted: true
          });
        }
      }
    });

    screenings.filter(s => !s.deleted && s.status !== "Archived" && s.status !== "Placed").forEach(sc => {
      if (sc.teacherChecklistSigned) {
        list.push({
          studentId: sc.id,
          studentName: sc.name,
          category: "Screening",
          type: "Teacher Input Checklist",
          label: "Teacher Signature Needed",
          desc: "Teacher behavior checklist received and signed.",
          dueDate: sc.consentReceivedDate || "",
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (sc.permissionToTestReceivedDate) {
        list.push({
          studentId: sc.id,
          studentName: sc.name,
          category: "Screening",
          type: "Permission to Test",
          label: "Awaiting Psychologist Consent",
          desc: `Signed permission received on ${sc.permissionToTestReceivedDate}.`,
          dueDate: sc.permissionToTestReceivedDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
      if (sc.meetingInvitationSentDate) {
        list.push({
          studentId: sc.id,
          studentName: sc.name,
          category: "Screening",
          type: "Meeting Invitation",
          label: "Send Meeting Invitation",
          desc: `Team invitation sent on ${sc.meetingInvitationSentDate}.`,
          dueDate: sc.meetingInvitationSentDate,
          daysRemaining: 0,
          status: "completed",
          isCompleted: true
        });
      }
    });

    return list;
  };

  // Toggle or uncheck a task directly from the timeline
  const handleToggleTask = (t) => {
    const taskKey = `${t.studentId}-${t.type}`;

    // If it was recently completed, toggling it means undoing
    if (recentlyCompleted[taskKey]) {
      handleUndoTask(taskKey);
      return;
    }

    const studentOrScreening = t.category === "Active" 
      ? students.find(s => s.id === t.studentId)
      : screenings.find(s => s.id === t.studentId);

    const diff = getTaskCompletionDiff(t, studentOrScreening);
    if (!diff) return;

    // If it was already completed (e.g. from historical completed list), uncheck it
    if (t.isCompleted) {
      if (t.category === "Active") {
        store.updateStudent(t.studentId, diff.undoValues);
      } else {
        store.updateScreening(t.studentId, diff.undoValues);
      }
      pushActivity(`Reopened "${t.label}" for ${t.studentName}.`);
      return;
    }

    // Mark task completed
    if (t.category === "Active") {
      store.updateStudent(t.studentId, diff.updates);
    } else {
      store.updateScreening(t.studentId, diff.updates);
    }
    pushActivity(`Completed "${t.label}" for ${t.studentName}.`);

    // Start 4-second undo grace window
    const timerId = setTimeout(() => {
      setRecentlyCompleted(prev => {
        const next = { ...prev };
        delete next[taskKey];
        return next;
      });
    }, 4000);

    setRecentlyCompleted(prev => ({
      ...prev,
      [taskKey]: {
        timeline: t,
        undoValues: diff.undoValues,
        timerId,
        expiresAt: Date.now() + 4000
      }
    }));
  };

  // Instant Undo handler during 4-second grace period
  const handleUndoTask = (taskKey) => {
    const entry = recentlyCompleted[taskKey];
    if (!entry) return;

    if (entry.timerId) {
      clearTimeout(entry.timerId);
    }

    const t = entry.timeline;
    if (t.category === "Active") {
      store.updateStudent(t.studentId, entry.undoValues);
    } else {
      store.updateScreening(t.studentId, entry.undoValues);
    }

    setRecentlyCompleted(prev => {
      const next = { ...prev };
      delete next[taskKey];
      return next;
    });

    pushActivity(`Undid completion of "${t.label}" for ${t.studentName}.`);
  };

  // Active recently completed items (currently in 4-second undo grace period)
  const activeRecentlyCompleted = Object.values(recentlyCompleted).map(entry => ({
    ...entry.timeline,
    status: "completed",
    isCompleted: true,
    isRecentlyCompleted: true,
    undoExpiresAt: entry.expiresAt
  }));

  // Historical completed items if showCompleted is checked
  const historicalCompleted = showCompleted ? getHistoricalCompletedTasks() : [];

  // Final displayed timelines combining active items, recently completed items, and completed items
  const finalDisplayedTimelines = [
    ...displayedTimelines,
    ...activeRecentlyCompleted.filter(rc => !displayedTimelines.some(d => `${d.studentId}-${d.type}` === `${rc.studentId}-${rc.type}`)),
    ...historicalCompleted.filter(hc => 
      !displayedTimelines.some(d => `${d.studentId}-${d.type}` === `${hc.studentId}-${hc.type}`) &&
      !activeRecentlyCompleted.some(rc => `${rc.studentId}-${rc.type}` === `${hc.studentId}-${hc.type}`)
    )
  ].sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return 1;
    if (!a.isCompleted && b.isCompleted) return -1;
    return (a.daysRemaining === null ? 999 : a.daysRemaining) - (b.daysRemaining === null ? 999 : b.daysRemaining);
  });

  // Students with active post-meeting / finalize tasks pending
  const postMeetingStudents = students.filter(
    s => !s.deleted && s.status === "Active" && (s.iepMeetingDate || s.iepFinalizedDate) && !s.iepPhysicalFileCompleted
  );

  const pushActivity = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ id: Date.now(), time, msg }, ...prev]);
  };

  const handleNudge = (screening) => {
    const email = store.getState().workEmail || "ariel.facilitator@rcschools.net";
    
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
    pushActivity(`Opened Mailto: Email nudge draft generated to self (${email}) for forwarding to ${screening.classroomTeacher}.`);
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
      iepMeetingDate: proposedDate,
      augustSetupComplete: true
    });
    pushActivity(`Completed August bulk setup for ${student.name}. Proposed IEP meeting date: ${proposedDate}.`);
    alert(`August setup concluded for ${student.name}! Scheduled IEP Meeting Date set.`);
  };

  // Mark all post-meeting tasks complete for a student
  const handleFinalizePostMeetingTasks = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    store.updateStudent(studentId, {
      iepFinalizedDate: student.iepFinalizedDate || student.iepMeetingDate || getTodayISO(),
      iepAtAGlancePrinted: true,
      iepAtAGlanceSignaturesCompleted: true,
      iepPulseUploadCompleted: true,
      iepPwnWritten: true,
      iepFinalCopySentParent: true,
      iepSharePointUploadCompleted: true,
      iepPhysicalFileCompleted: true
    });

    pushActivity(`Concluded all post-meeting filing & SPED File updates for ${student.name}.`);
    alert(`All post-meeting tasks (Glance, Signatures, Pulse, PWN, Parent Copy, SPED File) marked complete for ${student.name}!`);
  };

  const storeState = store.getState();
  const isConnected = store.isTokenValid();
  const showDisconnectedBanner = !isConnected;
  const offlineEditsCount = storeState.offlineEditsCount || 0;
  const showOfflineEditsAlert = !isConnected && offlineEditsCount > 2 && !storeState.dismissedOfflineAlert;

  return (
    <div>
      {/* 1. Google Drive Disconnected Prompt Banner */}
      {showDisconnectedBanner && (
        <div 
          className="glass-panel hide-print"
          style={{
            marginBottom: "16px",
            padding: "12px 18px",
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "32px", 
              height: "32px", 
              borderRadius: "8px", 
              backgroundColor: "rgba(99, 102, 241, 0.15)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              flexShrink: 0
            }}>
              <CloudOff size={18} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-heading)" }}>
                Google Drive Disconnected
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Sign in with Google to load and sync your active student caseload & deadlines.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => store.connectGoogleDrive()}
            style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Cloud size={14} />
            Sign in with Google (SSO)
          </button>
        </div>
      )}

      {/* 2. Offline Edits Threshold Warning Banner (> 2 records changed offline) */}
      {showOfflineEditsAlert && (
        <div 
          className="glass-panel hide-print"
          style={{
            marginBottom: "16px",
            padding: "12px 18px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "32px", 
              height: "32px", 
              borderRadius: "8px", 
              backgroundColor: "rgba(245, 158, 11, 0.18)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              flexShrink: 0
            }}>
              <AlertTriangle size={18} color="var(--accent-amber)" />
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-heading)" }}>
                Un-synced Offline Changes ({offlineEditsCount})
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                You have {offlineEditsCount} offline changes saved to this browser. Reconnect to Google Drive to sync these changes to your other computers.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => store.dismissOfflineAlert()}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Save locally, I'll sync later
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => store.connectGoogleDrive()}
              style={{ fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={14} />
              Connect & Sync Now
            </button>
          </div>
        </div>
      )}

      {/* New Feature Teaser: Interactive Dashboard Checklists */}
      {!seenChecklistTeaser && (
        <div 
          className="glass-panel hide-print" 
          style={{ 
            marginBottom: "20px", 
            padding: "16px 20px", 
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)",
            border: "1px solid var(--accent-purple)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "280px" }}>
            <div style={{ 
              width: "38px", 
              height: "38px", 
              borderRadius: "10px", 
              background: "var(--accent-purple)", 
              color: "#ffffff", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-heading)" }}>
                  New Feature: Quick-Action Dashboard Checklists!
                </span>
                <span style={{ 
                  fontSize: "10px", 
                  padding: "2px 8px", 
                  borderRadius: "12px", 
                  backgroundColor: "rgba(99, 102, 241, 0.18)", 
                  color: "var(--accent-purple)", 
                  fontWeight: "700" 
                }}>
                  OFF BY DEFAULT
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                You can now check off IEP milestones, post-meeting compliance steps, and screening tasks directly from your dashboard timeline with automatic Google Drive syncing and a 4-second accidental-click undo guard.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <button 
              type="button" 
              className="btn btn-primary"
              style={{ padding: "8px 16px", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                store.dismissChecklistTeaser(true);
                pushActivity("Enabled Interactive Dashboard Checklists mode.");
              }}
            >
              <CheckSquare size={14} />
              Try It Out (Turn On)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              style={{ padding: "8px 14px", fontSize: "12px" }}
              onClick={() => store.dismissChecklistTeaser(false)}
            >
              Keep Default (Off)
            </button>
          </div>
        </div>
      )}

      {/* Week Selector / Planning Window Header */}
      <div 
        className="glass-panel hide-print" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px", 
          padding: "12px 18px",
          flexWrap: "wrap", 
          gap: "12px",
          border: selectedWeek === "nextWeek" ? "1px solid var(--accent-purple)" : "1px solid var(--border-color)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Planning Window:
          </span>
          <span 
            className={`timeline-badge ${selectedWeek === "nextWeek" ? "purple" : "warning"}`} 
            style={{ fontWeight: "700", fontSize: "12px", padding: "4px 10px" }}
          >
            📅 {selectedWeek === "nextWeek" ? "Next Week" : "This Week"} ({activeDateRangeStr})
          </span>
        </div>

        <div style={{ display: "inline-flex", background: "var(--bg-primary)", padding: "3px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <button
            type="button"
            onClick={() => {
              setSelectedWeek("thisWeek");
              setTimelineFilter("all");
            }}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: selectedWeek === "thisWeek" ? "var(--accent-purple)" : "transparent",
              color: selectedWeek === "thisWeek" ? "#ffffff" : "var(--text-muted)"
            }}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedWeek("nextWeek");
              setTimelineFilter("all");
            }}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: selectedWeek === "nextWeek" ? "var(--accent-purple)" : "transparent",
              color: selectedWeek === "nextWeek" ? "#ffffff" : "var(--text-muted)"
            }}
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="stats-grid">
        <div 
          className="glass-panel stat-card"
          onClick={() => store.updateState({ activeTab: "students" })}
          style={{ 
            cursor: "pointer",
            transition: "all var(--transition-normal)"
          }}
        >
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Active Gifted Students</span>
          </div>
        </div>

        <div 
          className="glass-panel stat-card"
          onClick={() => store.updateState({ activeTab: "screening" })}
          style={{ 
            cursor: "pointer",
            transition: "all var(--transition-normal)"
          }}
          title="Open Screening Center"
        >
          <div className="stat-icon emerald">
            <CheckSquare size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{screeningCount}</span>
            <span className="stat-label">Pending Screenings</span>
          </div>
        </div>

        <div 
          className="glass-panel stat-card"
          onClick={() => setTimelineFilter(prev => (prev === "activeWeek" || prev === "thisWeek") ? "all" : "activeWeek")}
          style={{ 
            cursor: "pointer",
            transition: "all var(--transition-normal)",
            border: (timelineFilter === "activeWeek" || timelineFilter === "thisWeek") ? "2px solid var(--accent-amber)" : "2px solid transparent",
            boxShadow: (timelineFilter === "activeWeek" || timelineFilter === "thisWeek") ? "0 0 12px rgba(245, 158, 11, 0.4)" : "none"
          }}
        >
          <div className="stat-icon amber">
            <SquareCheckBig size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{dueActiveWeekCount}</span>
            <span className="stat-label">{selectedWeek === "nextWeek" ? "Due next week" : "Due this week"}</span>
          </div>
        </div>

        <div 
          className="glass-panel stat-card"
          onClick={() => setTimelineFilter(prev => prev === "overdue" ? "all" : "overdue")}
          style={{ 
            cursor: "pointer",
            transition: "all var(--transition-normal)",
            border: timelineFilter === "overdue" ? "2px solid var(--accent-rose)" : "2px solid transparent",
            boxShadow: timelineFilter === "overdue" ? "0 0 12px rgba(244, 63, 94, 0.4)" : "none"
          }}
        >
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
            {students.filter(s => !s.deleted && s.status === "Active" && !s.augustSetupComplete).map(student => (
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
                      value={student.iepMeetingDate || ""}
                      onChange={(e) => store.updateStudent(student.id, { iepMeetingDate: e.target.value })}
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
                    onClick={() => handleAugustComplete(student.id, student.iepMeetingDate)}
                    disabled={!student.iepMeetingDate || !student.augustParentLetterSent || !student.augustTeacherInvitesSent}
                  >
                    Complete Setup
                  </button>
                </div>
              </div>
            ))}
            {students.filter(s => !s.deleted && s.status === "Active" && !s.augustSetupComplete).length === 0 && (
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
          <div className="timeline-header">
            <div>
              <h2>
                {(timelineFilter === "activeWeek" || timelineFilter === "thisWeek")
                  ? `Due ${selectedWeek === "nextWeek" ? "Next" : "This"} Week (${finalDisplayedTimelines.length})`
                  : timelineFilter === "overdue"
                  ? `Overdue Timelines (${finalDisplayedTimelines.length})`
                  : `${selectedWeek === "nextWeek" ? "Next Week's" : "Weekly"} Timeline & Due Summaries (${finalDisplayedTimelines.length})`}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                {(timelineFilter === "activeWeek" || timelineFilter === "thisWeek")
                  ? `Showing all action items due in ${selectedWeek === "nextWeek" ? "next" : "the current"} school week (${activeDateRangeStr})`
                  : timelineFilter === "overdue"
                  ? "Showing all overdue deadlines requiring immediate attention"
                  : `Tennessee Special Education mandate countdowns (${selectedWeek === "nextWeek" ? "Next Week" : "Current Week"} & Overdue)`}
              </p>
            </div>
            {timelineFilter && timelineFilter !== "all" ? (
              <button 
                className="btn btn-secondary hide-print" 
                style={{ padding: "4px 8px", fontSize: "11px", height: "fit-content", alignSelf: "flex-start" }}
                onClick={() => setTimelineFilter("all")}
              >
                Clear Filter (Show All {selectedWeek === "nextWeek" ? "Next Week" : "Weekly"})
              </button>
            ) : (
              <span className="timeline-badge warning hide-print" style={{ fontWeight: "700", marginTop: "4px" }}>
                {selectedWeek === "nextWeek" ? "Next Week Schedule" : "RCS Schedule"}
              </span>
            )}
          </div>

          <div className="timeline-actions hide-print" style={{ flexWrap: "wrap", alignItems: "center" }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px", borderColor: showAugustSetup ? "var(--accent-purple)" : "transparent" }}
              onClick={() => setShowAugustSetup(!showAugustSetup)}
            >
              <ClipboardList size={12} />
              August Caseload Setup
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => store.sendWeeklyEmail(selectedWeek === "nextWeek" ? 1 : 0)}
            >
              <Send size={12} />
              Email {selectedWeek === "nextWeek" ? "Next Week's" : "Weekly"} Summary
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => window.print()}
            >
              <Printer size={12} />
              Print {selectedWeek === "nextWeek" ? "Next Week's" : "Weekly"} Checklist
            </button>

            <button 
              type="button"
              className={`btn ${interactiveChecklistMode ? "btn-primary" : "btn-secondary"}`} 
              style={{ 
                padding: "6px 12px", 
                fontSize: "11px", 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px",
                borderColor: interactiveChecklistMode ? "var(--accent-purple)" : "var(--border-color)"
              }}
              onClick={() => {
                store.toggleInteractiveChecklistMode();
                pushActivity(`${!interactiveChecklistMode ? "Enabled" : "Disabled"} Interactive Checklist Mode.`);
              }}
              title={interactiveChecklistMode ? "Checklist mode active - click to return to view-only" : "Turn on interactive checklist mode to check off tasks directly"}
            >
              <CheckSquare size={12} />
              Checklist Mode: {interactiveChecklistMode ? "ON" : "OFF"}
            </button>

            {interactiveChecklistMode && (
              <label style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                fontSize: "11px", 
                cursor: "pointer", 
                color: "var(--text-muted)", 
                marginLeft: "auto", 
                userSelect: "none" 
              }}>
                <input 
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  style={{ accentColor: "var(--accent-purple)", cursor: "pointer", width: "14px", height: "14px" }}
                />
                <span>Show Completed Tasks</span>
              </label>
            )}
          </div>

          <div className="timeline-list">
            {finalDisplayedTimelines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                <CheckCircle size={40} style={{ color: "var(--accent-emerald)", marginBottom: "12px" }} />
                <p style={{ fontWeight: "600" }}>All clear! No upcoming timelines or overdue reports.</p>
              </div>
            ) : (
              finalDisplayedTimelines.map((timeline, idx) => {
                const taskKey = `${timeline.studentId}-${timeline.type}`;
                const isCompleted = !!timeline.isCompleted;
                const isCheckable = isTaskCheckable(timeline);
                const isRecentlyCompleted = !!timeline.isRecentlyCompleted;

                return (
                  <div key={`${taskKey}-${idx}`} className={`timeline-card ${timeline.status}`}>
                    {interactiveChecklistMode && isCheckable && (
                      <div
                        className="timeline-card-checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(timeline);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          border: isCompleted 
                            ? "2px solid var(--accent-emerald)" 
                            : "2px solid var(--border-color)",
                          backgroundColor: isCompleted 
                            ? "var(--accent-emerald)" 
                            : "var(--bg-primary)",
                          cursor: "pointer",
                          marginTop: "2px",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                          boxShadow: isCompleted ? "0 2px 6px rgba(16, 185, 129, 0.35)" : "none"
                        }}
                        title={isCompleted ? "Completed (Click to uncheck)" : `Mark "${timeline.label}" complete`}
                      >
                        {isCompleted && <Check size={16} color="#ffffff" strokeWidth={3} />}
                      </div>
                    )}

                    <div className="timeline-content">
                      <div className="timeline-student-info">
                        <span 
                          className="timeline-student-name"
                          onClick={() => handleTimelineClick(timeline)}
                          title="Go to student workflow"
                          style={{ 
                            cursor: "pointer", 
                            textDecoration: "underline", 
                            color: "var(--accent-purple)",
                            fontWeight: "600"
                          }}
                        >
                          {timeline.studentName}
                        </span>
                        {isCompleted ? (
                          <span className="timeline-date-alert on-track" style={{ color: "var(--accent-emerald)", fontWeight: "700" }}>
                            COMPLETED
                          </span>
                        ) : (
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
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                        <span className={`timeline-badge ${timeline.status}`}>{timeline.category}</span>
                        <span style={{ 
                          fontSize: "14px", 
                          fontWeight: "700", 
                          color: isCompleted ? "var(--text-muted)" : "var(--text-heading)",
                          textDecoration: isCompleted ? "line-through" : "none"
                        }}>
                          {timeline.label}
                        </span>
                      </div>
                      
                      <p className="timeline-step" style={{ color: isCompleted ? "var(--text-muted)" : "inherit" }}>
                        {timeline.desc}
                      </p>

                      <div className="timeline-meta">
                        <span><Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Due: {timeline.dueDate || "N/A"}</span>
                        {timeline.mandatory && !isCompleted && <span style={{ color: "var(--accent-rose)", fontWeight: "600" }}>* Mandatory State Deadline</span>}
                      </div>

                      {isRecentlyCompleted && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                          <span style={{ 
                            fontSize: "11px", 
                            fontWeight: "700", 
                            color: "var(--accent-emerald)", 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px" 
                          }}>
                            <CheckCircle size={13} /> Completed! Syncing to Drive...
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ 
                              padding: "2px 8px", 
                              fontSize: "11px", 
                              fontWeight: "700", 
                              borderColor: "var(--accent-emerald)",
                              color: "var(--accent-emerald)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: "rgba(16, 185, 129, 0.08)"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndoTask(taskKey);
                            }}
                            title="Undo task completion"
                          >
                            <RotateCcw size={11} /> Undo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contextual Action Buttons */}
                    <div style={{ alignSelf: "center", display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {!isCompleted && timeline.type === "IEP Finalization" && (
                        <button 
                          className="nudge-btn"
                          style={{ backgroundColor: "var(--accent-emerald)" }}
                          onClick={() => {
                            store.updateStudent(timeline.studentId, { iepFinalizedDate: getTodayISO() });
                            pushActivity(`Finalized IEP on TN Pulse for ${timeline.studentName}.`);
                          }}
                          title="Mark IEP finalized today"
                        >
                          <CheckCircle size={10} style={{ display: "inline", marginRight: "4px" }} />
                          Finalize Today
                        </button>
                      )}
                      {!isCompleted && timeline.type === "IEP Print Glance" && (
                        <button 
                          className="nudge-btn"
                          style={{ backgroundColor: "var(--accent-purple)" }}
                          onClick={() => {
                            store.updateStudent(timeline.studentId, { iepAtAGlancePrinted: true });
                            pushActivity(`Marked IEP At-A-Glance printed for ${timeline.studentName}.`);
                          }}
                          title="Mark At-A-Glance printed"
                        >
                          <Printer size={10} style={{ display: "inline", marginRight: "4px" }} />
                          Mark Printed
                        </button>
                      )}
                      {!isCompleted && timeline.type === "IEP Friday Signatures" && (
                        <button 
                          className="nudge-btn"
                          style={{ backgroundColor: "var(--accent-purple)" }}
                          onClick={() => {
                            store.updateStudent(timeline.studentId, { iepAtAGlanceSignaturesCompleted: true });
                            pushActivity(`Collected At-A-Glance teacher signatures for ${timeline.studentName}.`);
                          }}
                          title="Mark teacher signatures collected"
                        >
                          <CheckCircle size={10} style={{ display: "inline", marginRight: "4px" }} />
                          Signatures Done
                        </button>
                      )}
                      {!isCompleted && timeline.type === "IEP SPED File" && (
                        <button 
                          className="nudge-btn"
                          style={{ backgroundColor: "var(--accent-emerald)" }}
                          onClick={() => {
                            store.updateStudent(timeline.studentId, { iepPhysicalFileCompleted: true });
                            pushActivity(`Archived physical SPED folder for ${timeline.studentName}.`);
                          }}
                          title="Mark physical SPED folder updated"
                        >
                          <FileCheck size={10} style={{ display: "inline", marginRight: "4px" }} />
                          File Updated
                        </button>
                      )}
                      {!isCompleted && timeline.actionNeeded === "Nudge Teacher" && (
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
                      {!isCompleted && timeline.actionNeeded === "Follow Up Invite" && (
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
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: In-App System notifications & quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Post-Meeting Follow-Up & Filing Tracker */}
          <div className="glass-panel" style={{ border: "1px solid var(--accent-purple)" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={18} color="var(--accent-purple)" />
              Post-Meeting Follow-Up & Filing
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Post-IEP meeting compliance deadlines: At-A-Glance (+1d), PWN & Pulse Upload (+2d), Physical SPED File (+4d).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {postMeetingStudents.map(student => {
                const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
                const finalizeBase = student.iepFinalizedDate || student.iepMeetingDate;
                const glanceDue = finalizeBase ? addDays(finalizeBase, deadlines.iepAtAGlanceSignatures || 1) : "";
                const uploadDue = finalizeBase ? addDays(finalizeBase, deadlines.iepPulseAndPwn || 2) : "";
                const spedDue = finalizeBase ? addDays(finalizeBase, deadlines.iepPhysicalSpedFile || 4) : "";

                const glanceDays = glanceDue ? getDaysRemaining(glanceDue) : null;
                const uploadDays = uploadDue ? getDaysRemaining(uploadDue) : null;
                const spedDays = spedDue ? getDaysRemaining(spedDue) : null;

                const isFinalized = !!student.iepFinalizedDate;

                return (
                  <div key={student.id} style={{ 
                    padding: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "var(--bg-primary)",
                    fontSize: "13px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "700", marginBottom: "8px" }}>
                      <span 
                        style={{ cursor: "pointer", textDecoration: "underline", color: "var(--accent-purple)" }}
                        onClick={() => handleTimelineClick({ studentId: student.id, type: "IEP At-A-Glance", category: "Active" })}
                        title="Open in IEP Planner"
                      >
                        {student.name} ({student.grade})
                      </span>
                      {isFinalized ? (
                        <span style={{ 
                          fontSize: "10px", 
                          padding: "2px 8px", 
                          borderRadius: "12px", 
                          backgroundColor: "rgba(16, 185, 129, 0.15)", 
                          color: "var(--accent-emerald)", 
                          fontWeight: "700" 
                        }}>
                          Finalized: {student.iepFinalizedDate}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: "10px", padding: "2px 8px" }}
                          onClick={() => store.updateStudent(student.id, { iepFinalizedDate: getTodayISO() })}
                          title="Lock finalized document today"
                        >
                          Finalize Today
                        </button>
                      )}
                    </div>

                    {/* Step 1: At-A-Glance & Signatures (+1 Day) */}
                    <div style={{ 
                      padding: "8px", 
                      borderRadius: "6px", 
                      backgroundColor: "rgba(99, 102, 241, 0.05)", 
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                      marginBottom: "8px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                        <span style={{ color: "var(--accent-purple)" }}>1. At-A-Glance & Signatures</span>
                        <span style={{ color: glanceDays !== null && glanceDays < 0 ? "var(--accent-rose)" : "var(--text-muted)" }}>
                          {glanceDays !== null && glanceDays < 0 ? `${Math.abs(glanceDays)}d OVERDUE` : `Due: ${glanceDue || "TBD"}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepAtAGlancePrinted}
                            onChange={(e) => store.updateStudent(student.id, { iepAtAGlancePrinted: e.target.checked })}
                          />
                          <span>IEP At-A-Glance Printed</span>
                        </label>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepAtAGlanceSignaturesCompleted}
                            onChange={(e) => store.updateStudent(student.id, { iepAtAGlanceSignaturesCompleted: e.target.checked })}
                          />
                          <span>Signatures ({student.classroomTeacher || "Teacher"})</span>
                        </label>
                      </div>
                    </div>

                    {/* Step 2: Pulse, PWN & Parent Copy (+2 Days) */}
                    <div style={{ 
                      padding: "8px", 
                      borderRadius: "6px", 
                      backgroundColor: "rgba(245, 158, 11, 0.05)", 
                      border: "1px solid rgba(245, 158, 11, 0.15)",
                      marginBottom: "8px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                        <span style={{ color: "var(--accent-amber)" }}>2. Pulse, PWN & Parent Copy</span>
                        <span style={{ color: uploadDays !== null && uploadDays < 0 ? "var(--accent-rose)" : "var(--text-muted)" }}>
                          {uploadDays !== null && uploadDays < 0 ? `${Math.abs(uploadDays)}d OVERDUE` : `Due: ${uploadDue || "TBD"}`}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepPulseUploadCompleted}
                            onChange={(e) => store.updateStudent(student.id, { iepPulseUploadCompleted: e.target.checked })}
                          />
                          <span>Upload Signed IEP to Pulse</span>
                        </label>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepPwnWritten}
                            onChange={(e) => store.updateStudent(student.id, { iepPwnWritten: e.target.checked })}
                          />
                          <span>Write Prior Written Notice (PWN)</span>
                        </label>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepFinalCopySentParent}
                            onChange={(e) => store.updateStudent(student.id, { iepFinalCopySentParent: e.target.checked })}
                          />
                          <span>Send Final Copy to Parent</span>
                        </label>
                        <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={!!student.iepSharePointUploadCompleted}
                            onChange={(e) => store.updateStudent(student.id, { iepSharePointUploadCompleted: e.target.checked })}
                          />
                          <span>Upload to SharePoint</span>
                        </label>
                      </div>
                    </div>

                    {/* Step 3: Update Physical SPED File (+4 Days) */}
                    <div style={{ 
                      padding: "8px", 
                      borderRadius: "6px", 
                      backgroundColor: "rgba(16, 185, 129, 0.05)", 
                      border: "1px solid rgba(16, 185, 129, 0.15)",
                      marginBottom: "10px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                        <span style={{ color: "var(--accent-emerald)" }}>3. Update Physical SPED File</span>
                        <span style={{ color: spedDays !== null && spedDays < 0 ? "var(--accent-rose)" : "var(--text-muted)" }}>
                          {spedDays !== null && spedDays < 0 ? `${Math.abs(spedDays)}d OVERDUE` : `Due: ${spedDue || "TBD"}`}
                        </span>
                      </div>
                      <label style={{ display: "flex", gap: "6px", alignItems: "center", cursor: "pointer", fontSize: "12px" }}>
                        <input 
                          type="checkbox" 
                          checked={!!student.iepPhysicalFileCompleted}
                          onChange={(e) => store.updateStudent(student.id, { iepPhysicalFileCompleted: e.target.checked })}
                        />
                        <span>Physical SPED Folder Updated</span>
                      </label>
                    </div>

                    <button 
                      className="btn btn-primary"
                      style={{ width: "100%", padding: "6px", fontSize: "11px" }}
                      onClick={() => handleFinalizePostMeetingTasks(student.id)}
                    >
                      Complete All Post-Meeting Tasks
                    </button>
                  </div>
                );
              })}
              {postMeetingStudents.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
                  ✔ No post-meeting follow-up or filing tasks pending.
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
