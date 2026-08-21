/* ==========================================
   Aegis Gifted Tracker - studentStore State Management
   ========================================== */

import { INITIAL_STUDENTS, INITIAL_SCREENINGS } from "./mockData.js";
import { driveService } from "./driveService.js";

// Default Google OAuth Client ID for project 382674408500
export const DEFAULT_CLIENT_ID = "382674408500-il976m1gmjnpafrd7ilqnhtln0copmnp.apps.googleusercontent.com";

// Rutherford County Schools (RCS) 2026-2027 breaks & holidays (students not in session)
export const DEFAULT_HOLIDAYS = [
  // Single days
  { date: "2026-09-07", description: "Labor Day" },
  { date: "2026-09-18", description: "Teacher Admin Day" },
  { date: "2026-11-03", description: "Election Day / Admin" },
  { date: "2027-01-04", description: "In-service / Safety Day" },
  { date: "2027-01-18", description: "MLK Holiday" },
  { date: "2027-02-15", description: "Presidents Day" },
  { date: "2027-03-11", description: "Teacher Admin Day" },
  { date: "2027-03-26", description: "Good Friday" },
  { date: "2027-05-07", description: "Teacher Admin Day" },
  { date: "2027-05-27", description: "Teacher Workday" },
  
  // Summer transition / August in-service days (Aug 3 to Aug 6, 2026)
  { date: "2026-08-03", description: "Summer Transition / Aug In-service" },
  { date: "2026-08-04", description: "Summer Transition / Aug In-service" },
  { date: "2026-08-05", description: "Summer Transition / Aug In-service" },
  { date: "2026-08-06", description: "Summer Transition / Aug In-service" },
  
  // Fall Break: Oct 5 - Oct 9, 2026
  { date: "2026-10-05", description: "Fall Break" },
  { date: "2026-10-06", description: "Fall Break" },
  { date: "2026-10-07", description: "Fall Break" },
  { date: "2026-10-08", description: "Fall Break" },
  { date: "2026-10-09", description: "Fall Break" },
  
  // Thanksgiving Break: Nov 23 - Nov 27, 2026
  { date: "2026-11-23", description: "Thanksgiving Break" },
  { date: "2026-11-24", description: "Thanksgiving Break" },
  { date: "2026-11-25", description: "Thanksgiving Break" },
  { date: "2026-11-26", description: "Thanksgiving Break" },
  { date: "2026-11-27", description: "Thanksgiving Break" },
  
  // Winter Break: Dec 21, 2026 - Jan 1, 2027
  { date: "2026-12-21", description: "Winter Break" },
  { date: "2026-12-22", description: "Winter Break" },
  { date: "2026-12-23", description: "Winter Break" },
  { date: "2026-12-24", description: "Winter Break" },
  { date: "2026-12-25", description: "Winter Break" },
  { date: "2026-12-28", description: "Winter Break" },
  { date: "2026-12-29", description: "Winter Break" },
  { date: "2026-12-30", description: "Winter Break" },
  { date: "2026-12-31", description: "Winter Break" },
  { date: "2027-01-01", description: "Winter Break" },
  
  // Spring Break: Mar 29 - Apr 2, 2027
  { date: "2027-03-29", description: "Spring Break" },
  { date: "2027-03-30", description: "Spring Break" },
  { date: "2027-03-31", description: "Spring Break" },
  { date: "2027-04-01", description: "Spring Break" },
  { date: "2027-04-02", description: "Spring Break" }
];

// Rutherford County Schools (RCS) default report card dates (end of quarters)
export const DEFAULT_REPORT_CARD_DATES = [
  { quarter: "Q1", date: "2026-10-16" },
  { quarter: "Q2", date: "2027-01-08" },
  { quarter: "Q3", date: "2027-03-12" },
  { quarter: "Q4", date: "2027-05-28" }
];

// Default day buffer configuration for all Aegis timeline calculations
export const DEFAULT_DEADLINES = {
  // Screening Timeline Deadlines (Days)
  screeningQuickSurvey: 5,       // School Days
  screeningConsentPending: 10,   // Calendar Days
  screeningEvaluation: 60,       // Calendar Days
  screeningTeacherChecklist: 10,  // School Days
  screeningAcademicCheckin: 15,  // Calendar Days
  screeningCreativityCheckin: 20, // Calendar Days
  screeningInformedConsent: 5,   // Calendar Days
  screeningPermissionToTest: 10, // Calendar Days
  screeningPsychEvaluation: 60,  // Calendar Days
  screeningPsychCheckin: 20,     // Calendar Days
  screeningMeetingNotice: 10,     // Calendar Days notice
  screeningArielMeetingNotice: 20, // Calendar Days notice

  // Re-evaluation Timeline Deadlines (Days)
  reevalInvitation: 20,          // Calendar Days
  reevalObservation: 13,         // Calendar Days
  reevalPsychHandoff: 10,        // Calendar Days

  // IEP Timeline Deadlines (Days)
  iepParentProposal: 25,         // Calendar Days
  iepFormalInvitation: 20,       // Calendar Days
  iepTeacherChecklist: 15,       // Calendar Days
  iepDataGathering: 7,           // School Days
  iepTransitionSurvey: 6,        // School Days
  iepDraftWritten: 4,            // School Days
  iepDraftSent: 2,               // School Days
};

// Checks if a date is a valid school day (no weekends, no holidays, no designated breaks)
export const isSchoolDay = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  const yyyymmdd = date.toISOString().split("T")[0];
  
  // Dynamic holiday check
  let holidays = DEFAULT_HOLIDAYS;
  if (typeof store !== 'undefined' && store && store.state && store.state.holidays) {
    holidays = store.state.holidays;
  }
  
  return !holidays.some(h => h.date === yyyymmdd);
};

// Add school days skipping weekends and RCS holidays (supports negative numbers)
export const addSchoolDays = (dateStr, days) => {
  if (!dateStr) return "";
  let date = new Date(dateStr + "T12:00:00");
  let daysCount = 0;
  const absDays = Math.abs(days);
  const step = days >= 0 ? 1 : -1;
  while (daysCount < absDays) {
    date.setDate(date.getDate() + step);
    const yyyymmdd = date.toISOString().split("T")[0];
    if (isSchoolDay(yyyymmdd)) {
      daysCount++;
    }
  }
  return date.toISOString().split("T")[0];
};

// Helper to calculate date difference in calendar days
export const getDaysRemaining = (targetDateStr) => {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Adjust a date to the nearest school day if it falls on a weekend or holiday/break
// direction = -1 to search earlier in time (e.g. for deadlines prior to an event)
// direction = 1 to search later in time (e.g. for deadlines following an event)
export const adjustToSchoolDay = (dateStr, direction = -1) => {
  if (!dateStr || dateStr === "TBD") return dateStr;
  let date = new Date(dateStr + "T12:00:00");
  let count = 0;
  while (!isSchoolDay(date.toISOString().split("T")[0]) && count < 30) {
    date.setDate(date.getDate() + direction);
    count++;
  }
  return date.toISOString().split("T")[0];
};

// Add days to a date string and return YYYY-MM-DD (adjusted to school days)
export const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() + days);
  const calculatedDate = date.toISOString().split("T")[0];
  const direction = days < 0 ? -1 : 1;
  return adjustToSchoolDay(calculatedDate, direction);
};

// Default email mappings for core BMS teachers
export const DEFAULT_TEACHER_EMAILS = {
  "Ms. Davis": "davis@rcschools.net",
  "Mrs. Harrison": "harrison@rcschools.net",
  "Mr. Thompson": "thompson@rcschools.net",
  "Mr. Adams": "adams@rcschools.net"
};

// Intelligently guess a teacher's email address using Rutherford County Schools conventions
export const guessTeacherEmail = (name) => {
  if (!name) return "";
  if (name.includes("@")) return name.trim().toLowerCase();
  
  const trimmed = name.trim();
  if (DEFAULT_TEACHER_EMAILS[trimmed]) return DEFAULT_TEACHER_EMAILS[trimmed];

  // Strip prefix titles like Mr., Mrs., Ms., Dr., Miss, Coach
  let clean = trimmed.replace(/^(mr|mrs|ms|dr|miss|coach)\.?\s+/i, "").trim();
  const parts = clean.split(/\s+/);
  const lastName = parts[parts.length - 1];
  return lastName ? `${lastName.toLowerCase()}@rcschools.net` : "";
};

/**
 * Calculates Tennessee regulatory and facilitator buffers timelines
 */
export const calculateTimelines = (student, isScreening = false) => {
  const timelines = [];
  const deadlines = (store && store.state && store.state.deadlines) || DEFAULT_DEADLINES;
  
  if (isScreening) {
    // ------------------------------------------
    // SCREENING CENTER WORKFLOW TIMELINES
    // ------------------------------------------
    
    // Status 1: Quick Survey (Cume File Check)
    if (student.status === "Quick Survey") {
      const dueDate = addSchoolDays(student.referralDate || new Date().toISOString().split("T")[0], deadlines.screeningQuickSurvey);
      timelines.push({
        type: "Quick Survey",
        label: "Cume File Quick Survey",
        desc: "Check for prior testing locks, ESL status, DCS issues, and school attendance logs.",
        dueDate,
        daysRemaining: getDaysRemaining(dueDate),
        status: getDaysRemaining(dueDate) <= 2 ? "warning" : "on-track",
        mandatory: false,
        actionNeeded: "Review Cume File"
      });
    }

    // Status 2: Consent Pending
    if (student.status === "Consent Pending") {
      const dueDate = addDays(student.referralDate || new Date().toISOString().split("T")[0], deadlines.screeningConsentPending);
      timelines.push({
        type: "Consent Pending",
        label: "Awaiting Parental Consent",
        desc: "Parental permission to screen and initial screening surveys sent home.",
        dueDate,
        daysRemaining: getDaysRemaining(dueDate),
        status: getDaysRemaining(dueDate) <= 2 ? "warning" : "on-track",
        mandatory: false
      });
    }

    // Status 3: Evaluation in Progress
    if (student.status === "Evaluation in Progress" && student.consentReceivedDate) {
      // Ariel's 60-Day Calendar evaluation timeline
      const target60Day = addDays(student.consentReceivedDate, deadlines.screeningEvaluation);
      const daysLeft60 = getDaysRemaining(target60Day);
      timelines.push({
        type: "60-Day Evaluation",
        label: "Initial Evaluation Timeline",
        desc: "Complete all cognitive, performance, and creative testing under TN regulatory calendar.",
        dueDate: target60Day,
        daysRemaining: daysLeft60,
        status: daysLeft60 <= 0 ? "overdue" : daysLeft60 <= 15 ? "warning" : "on-track",
        mandatory: true
      });

      // Teacher behavior checklist due 2 school weeks (10 school days) from consent
      if (!student.teacherChecklistSigned) {
        const teacherDueDate = addSchoolDays(student.consentReceivedDate, deadlines.screeningTeacherChecklist);
        const teacherDaysLeft = getDaysRemaining(teacherDueDate);
        timelines.push({
          type: "Teacher Input Checklist",
          label: "Teacher Signature Needed",
          desc: `SIGS/Renzulli behavior checklist due from ${student.classroomTeacher} (10 school days).`,
          dueDate: teacherDueDate,
          daysRemaining: teacherDaysLeft,
          status: teacherDaysLeft <= 0 ? "overdue" : teacherDaysLeft <= 3 ? "warning" : "on-track",
          mandatory: false,
          actionNeeded: "Nudge Teacher"
        });
      }

      // Academic check-in (T-VAAS or Woodcock-Johnson) due 15 calendar days from consent
      if (!student.matrix?.performance?.score) {
        const academicDueDate = addDays(student.consentReceivedDate, deadlines.screeningAcademicCheckin);
        const academicDays = getDaysRemaining(academicDueDate);
        timelines.push({
          type: "Academic Check-in",
          label: "Academic Testing Due",
          desc: "Complete T-VAAS or Woodcock-Johnson testing. Requires min 10 rubric points to proceed.",
          dueDate: academicDueDate,
          daysRemaining: academicDays,
          status: academicDays <= 0 ? "overdue" : academicDays <= 3 ? "warning" : "on-track",
          mandatory: false
        });
      }

      // Creativity check-in (TOL / TOL Plus / TN Create / Torrance) due 20 calendar days from consent
      if (!student.matrix?.creativity?.score) {
        const creativityDueDate = addDays(student.consentReceivedDate, deadlines.screeningCreativityCheckin);
        const creativityDays = getDaysRemaining(creativityDueDate);
        timelines.push({
          type: "Creativity Check-in",
          label: "Creativity Rating / Test Due",
          desc: "Score checklist hierarchy or administer Torrance Test (factoring 1.5-week county grading lag).",
          dueDate: creativityDueDate,
          daysRemaining: creativityDays,
          status: creativityDays <= 0 ? "overdue" : creativityDays <= 4 ? "warning" : "on-track",
          mandatory: false
        });
      }
    }

    // Status 4: Informed Consent (Phone Call)
    if (student.status === "Informed Consent" && !student.informedConsentCompleted) {
      const dueDate = addDays(new Date().toISOString().split("T")[0], deadlines.screeningInformedConsent);
      timelines.push({
        type: "Informed Consent",
        label: "Informed Consent Call/Email",
        desc: "Contact parent to explain the 50-point rubric / 123 IQ threshold and schedule psych evaluation.",
        dueDate,
        daysRemaining: getDaysRemaining(dueDate),
        status: "warning",
        mandatory: false
      });
    }

    // Status 5: Permission to Test Pending
    if (student.status === "Permission to Test Pending" && !student.permissionToTestReceivedDate) {
      const dueDate = addDays(new Date().toISOString().split("T")[0], deadlines.screeningPermissionToTest);
      timelines.push({
        type: "Permission to Test",
        label: "Awaiting Psychologist Consent",
        desc: "Waiting for signed permission to test and permission to email legal documents to return.",
        dueDate,
        daysRemaining: getDaysRemaining(dueDate),
        status: getDaysRemaining(dueDate) <= 2 ? "warning" : "on-track",
        mandatory: false
      });
    }

    // Status 6: Psych Results Pending (School Psychologist)
    if (student.status === "Psych Results Pending" && student.permissionToTestReceivedDate) {
      const psych60Day = addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychEvaluation);
      const daysLeftPsych = getDaysRemaining(psych60Day);
      timelines.push({
        type: "Psychologist 60-Day Evaluation",
        label: "psychologist Testing Window",
        desc: "School Psychologist's 60-day calendar to administer IQ test and compile psychological results.",
        dueDate: psych60Day,
        daysRemaining: daysLeftPsych,
        status: daysLeftPsych <= 0 ? "overdue" : daysLeftPsych <= 10 ? "warning" : "on-track",
        mandatory: true
      });

      // 20-day check-in reminder
      const checkinDate = addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychCheckin);
      const checkinDays = getDaysRemaining(checkinDate);
      if (checkinDays >= -10 && !student.psychResultsReceived) {
        timelines.push({
          type: "Psychologist Check-in",
          label: "Check-in with School Psychologist",
          desc: "Check if testing is scheduled. Psychologist typically tests within 15-20 days.",
          dueDate: checkinDate,
          daysRemaining: checkinDays,
          status: checkinDays <= 0 ? "warning" : "on-track",
          mandatory: false
        });
      }
    }

    // Status 7: Meeting Scheduled
    if (student.status === "Meeting Scheduled" && student.meetingDate) {
      const mDays = getDaysRemaining(student.meetingDate);
      timelines.push({
        type: "Placement Meeting",
        label: "Eligibility / Placement Meeting",
        desc: `Hold eligibility team meeting with parent, principal, psych, and teacher on Mon/Thu.`,
        dueDate: student.meetingDate,
        daysRemaining: mDays,
        status: mDays < 0 ? "overdue" : mDays <= 3 ? "warning" : "on-track",
        mandatory: true
      });

      // Meeting Invitation buffer check
      if (!student.meetingInvitationSentDate) {
        const legalInviteDate = addDays(student.meetingDate, -deadlines.screeningMeetingNotice);
        const arielInviteDate = addDays(student.meetingDate, -deadlines.screeningArielMeetingNotice);
        const legalDays = getDaysRemaining(legalInviteDate);
        
        timelines.push({
          type: "Meeting Invitation",
          label: "Send Meeting Invitation",
          desc: `Send team invitation. Legal: 10 days notice (${legalInviteDate}). Ariel: 20 days notice (${arielInviteDate}).`,
          dueDate: student.meetingNoticeWaived ? "" : legalInviteDate,
          daysRemaining: student.meetingNoticeWaived ? null : legalDays,
          status: student.meetingNoticeWaived ? "completed" : (legalDays <= 0 ? "overdue" : legalDays <= 3 ? "warning" : "on-track"),
          mandatory: !student.meetingNoticeWaived
        });
      }
    }

    // Status 8: Pending Discontinuation
    if (student.status === "Pending Discontinuation") {
      timelines.push({
        type: "Pending Discontinuation",
        label: "Discontinuation Tasks",
        desc: `Complete PWN mailing and physical cume filing to close out caseload file.`,
        dueDate: "",
        daysRemaining: null,
        status: "warning",
        mandatory: false
      });
    }

  } else {
    // ------------------------------------------
    // ACTIVE STUDENT WORKFLOW TIMELINES
    // ------------------------------------------
    
    // August Setup Tasks (Show in August or if not complete)
    const currentMonth = new Date().getMonth(); // 7 = August
    if ((currentMonth === 7 || !student.augustSetupComplete) && !student.iepMeetingDate) {
      timelines.push({
        type: "August Setup",
        label: "August Proposed Dates Letter",
        desc: "Send letters containing proposed dates, permission to email, and attendee survey.",
        dueDate: "2026-08-15",
        daysRemaining: getDaysRemaining("2026-08-15"),
        status: getDaysRemaining("2026-08-15") <= 0 ? "overdue" : getDaysRemaining("2026-08-15") <= 5 ? "warning" : "on-track",
        mandatory: false
      });
      timelines.push({
        type: "August Calendar",
        label: "August Teacher Invites",
        desc: "Send bulk year-long calendar invites to General Education teachers.",
        dueDate: "2026-08-20",
        daysRemaining: getDaysRemaining("2026-08-20"),
        status: getDaysRemaining("2026-08-20") <= 0 ? "overdue" : getDaysRemaining("2026-08-20") <= 5 ? "warning" : "on-track",
        mandatory: false
      });
    }

    // IEP Due Date (365 days)
    if (student.iepDueDate) {
      const daysLeft = getDaysRemaining(student.iepDueDate);
      timelines.push({
        type: "IEP Due Date",
        label: "IEP Due Date",
        desc: "Mandatory annual update of IEP goals, accommodations, and special education services.",
        dueDate: student.iepDueDate,
        daysRemaining: daysLeft,
        status: daysLeft <= 0 ? "overdue" : daysLeft <= 30 ? "warning" : "on-track",
        mandatory: true
      });

      // Individual IEP writing timeline milestones (triggered if an IEP meeting date is set)
      if (student.iepMeetingDate && !student.iepFinalizedDate) {
        const mDate = student.iepMeetingDate;

        // 1. Send Invitation (10 days legal notice, 20 days Ariel)
        if (!student.iepInvitationSentDate) {
          const inviteDue = addDays(mDate, -deadlines.iepFormalInvitation);
          const inviteDays = getDaysRemaining(inviteDue);
          timelines.push({
            type: "IEP Invitation",
            label: "Send IEP Team Invitation",
            desc: "Send formal parent meeting invitation. Legal deadline is 10 days before meeting.",
            dueDate: inviteDue,
            daysRemaining: inviteDays,
            status: inviteDays <= 0 ? "overdue" : inviteDays <= 3 ? "warning" : "on-track",
            mandatory: true
          });
        }

        // IEP Invitation Response Follow-Up Check (sent >= 7 days ago, response not received)
        if (student.iepInvitationSentDate && !student.iepInvitationResponseReceived) {
          const sentDate = new Date(student.iepInvitationSentDate + "T12:00:00");
          const today = new Date();
          const diffTime = today.getTime() - sentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 7) {
            const followUpDueDate = addDays(student.iepInvitationSentDate, 7);
            timelines.push({
              type: "IEP Invitation Follow-Up",
              label: "Follow Up on IEP Invitation",
              desc: `Invitation sent on ${student.iepInvitationSentDate} (${diffDays} days ago). Follow up with parent for response.`,
              dueDate: followUpDueDate,
              daysRemaining: 7 - diffDays,
              status: "overdue",
              mandatory: false,
              actionNeeded: "Follow Up Invite"
            });
          }
        }

        // 2. Data Mining Checklist (7 days before)
        if (!student.iepDataMiningCompleted) {
          const mineDue = addSchoolDays(mDate, -deadlines.iepDataGathering);
          const mineDays = getDaysRemaining(mineDue);
          timelines.push({
            type: "IEP Data Mining",
            label: "Academic Data Mining",
            desc: "Mine T-VAAS TCAP, Mastery Connect, AIMSweb fluency, and Savvas math scores.",
            dueDate: mineDue,
            daysRemaining: mineDays,
            status: mineDays <= 0 ? "overdue" : mineDays <= 2 ? "warning" : "on-track",
            mandatory: false,
            actionNeeded: "Mine Data"
          });
        }

        // 3. Transition Survey (6 days before)
        if (!student.iepTransitionSurveyCompleted) {
          const transDue = addSchoolDays(mDate, -deadlines.iepTransitionSurvey);
          timelines.push({
            type: "IEP Transition Survey",
            label: "Student Transition Survey",
            desc: "Complete student transition goals survey (grade-level specific).",
            dueDate: transDue,
            daysRemaining: getDaysRemaining(transDue),
            status: getDaysRemaining(transDue) <= 0 ? "overdue" : "on-track",
            mandatory: false
          });
        }

        // 4. Write IEP (4 days before)
        if (!student.iepDraftWrittenDate) {
          const draftDue = addSchoolDays(mDate, -deadlines.iepDraftWritten);
          timelines.push({
            type: "IEP Writing",
            label: "Write IEP Document Draft",
            desc: "Complete comprehensive IEP draft on TN Pulse (approx. 2 hours task time).",
            dueDate: draftDue,
            daysRemaining: getDaysRemaining(draftDue),
            status: getDaysRemaining(draftDue) <= 0 ? "overdue" : getDaysRemaining(draftDue) <= 2 ? "warning" : "on-track",
            mandatory: false
          });
        }

        // 5. Send IEP Draft to Parent (48 business/school hours before)
        if (!student.iepDraftSentDate) {
          const sendDue = addSchoolDays(mDate, -deadlines.iepDraftSent); // 2 school days before
          const sendDays = getDaysRemaining(sendDue);
          timelines.push({
            type: "IEP Send Draft",
            label: "Send IEP Draft to Parents",
            desc: "Deliver completed draft IEP & Zoom link to parent (48 school hours rule).",
            dueDate: sendDue,
            daysRemaining: sendDays,
            status: sendDays <= 0 ? "overdue" : sendDays <= 1 ? "warning" : "on-track",
            mandatory: false
          });
        }
      }

      // IEP Post-Meeting Tasks
      if (student.iepMeetingDate && getDaysRemaining(student.iepMeetingDate) <= 0 && !student.iepPhysicalFileCompleted) {
        // Finalize IEP (5 days legal / 1 day Ariel)
        if (!student.iepFinalizedDate) {
          const finDue = addDays(student.iepMeetingDate, 1);
          timelines.push({
            type: "IEP Finalization",
            label: "Finalize Pulse IEP",
            desc: "Submit and lock finalized IEP document. Legal deadline: 5 days post-meeting.",
            dueDate: finDue,
            daysRemaining: getDaysRemaining(finDue),
            status: getDaysRemaining(finDue) <= 0 ? "overdue" : "warning",
            mandatory: true
          });
        }

        // Print IEP at a Glance (next day)
        if (student.iepFinalizedDate && !student.iepAtAGlancePrinted) {
          const printDue = addDays(student.iepFinalizedDate, 1);
          timelines.push({
            type: "IEP Print Glance",
            label: "Print IEP at a Glance",
            desc: "Generate and print 1-page teacher summary report.",
            dueDate: printDue,
            daysRemaining: getDaysRemaining(printDue),
            status: getDaysRemaining(printDue) <= 0 ? "overdue" : "warning",
            mandatory: false,
            actionNeeded: "Print Glance"
          });
        }

        // IEP at a Glance Signatures (Friday deadline)
        if (student.iepFinalizedDate && !student.iepAtAGlanceSignaturesCompleted) {
          timelines.push({
            type: "IEP Friday Signatures",
            label: "At a Glance Friday Signatures",
            desc: "Collect signature checklist from non-attending classroom teachers.",
            dueDate: "",
            daysRemaining: null,
            status: "warning",
            mandatory: false
          });
        }
      }
    }

    // Triennial Re-evaluation (3 years)
    if (student.isReeval) {
      const daysLeft = getDaysRemaining(student.reevalDueDate);
      timelines.push({
        type: "Triennial Re-evaluation",
        label: "Triennial Re-eval Review",
        desc: "Mandatory three-year eligibility assessment review.",
        dueDate: student.reevalDueDate,
        daysRemaining: daysLeft,
        status: daysLeft <= 0 ? "overdue" : daysLeft <= 90 ? "warning" : "on-track",
        mandatory: true
      });

      // Triennial Re-eval workflow milestones (triggered if a reeval meeting date is set)
      if (!student.reevalMeetingDate) {
        const schedDue = addDays(student.reevalDueDate, -14);
        const schedDays = getDaysRemaining(schedDue);
        timelines.push({
          type: "Re-eval Schedule",
          label: "Schedule Re-eval Meeting",
          desc: "Schedule the triennial re-evaluation meeting date (typically 2 weeks before due date).",
          dueDate: schedDue,
          daysRemaining: schedDays,
          status: schedDays <= 0 ? "overdue" : schedDays <= 5 ? "warning" : "on-track",
          mandatory: false
        });
      } else {
        const rmDate = student.reevalMeetingDate;

        // 1. Send invitation (20 days out)
        if (!student.reevalInvitationSentDate) {
          const inviteDue = addDays(rmDate, -deadlines.reevalInvitation);
          timelines.push({
            type: "Re-eval Invitation",
            label: "Send Re-eval Invitation",
            desc: "Send formal re-eval meeting invitation to parents (20 days buffer).",
            dueDate: inviteDue,
            daysRemaining: getDaysRemaining(inviteDue),
            status: getDaysRemaining(inviteDue) <= 0 ? "overdue" : "on-track",
            mandatory: true
          });
        }

        // 2. Direct Observation (sometime in week 13 days before)
        if (!student.reevalDirectObservationCompleted) {
          const obsDue = addDays(rmDate, -deadlines.reevalObservation);
          const obsDays = getDaysRemaining(obsDue);
          timelines.push({
            type: "Re-eval Observation",
            label: "Conduct Classroom Observation",
            desc: "Perform 35-40 minute direct student classroom observation notes.",
            dueDate: obsDue,
            daysRemaining: obsDays,
            status: obsDays <= 0 ? "overdue" : obsDays <= 3 ? "warning" : "on-track",
            mandatory: true
          });
        }

        // 3. Re-eval Surveys (10 days before)
        if (!student.reevalParentSurveyReturned || !student.reevalTeacherSurveyReturned || !student.reevalSelfSurveyCompleted) {
          const surveyDue = addDays(rmDate, -deadlines.reevalPsychHandoff);
          const surveyDays = getDaysRemaining(surveyDue);
          timelines.push({
            type: "Re-eval Surveys Check",
            label: "Complete Re-eval Surveys",
            desc: "Collect Parent and Teacher re-eval surveys and complete Facilitator survey.",
            dueDate: surveyDue,
            daysRemaining: surveyDays,
            status: surveyDays <= 0 ? "overdue" : surveyDays <= 2 ? "warning" : "on-track",
            mandatory: false
          });
        }

        // 4. psychologist Handoff (10 days before)
        if (!student.reevalPsychologistHandoffDate) {
          const handoffDue = addDays(rmDate, -deadlines.reevalPsychHandoff);
          const handoffDays = getDaysRemaining(handoffDue);
          timelines.push({
            type: "Re-eval Psych Handoff",
            label: "Submit surveys to psych",
            desc: "Compile parent, teacher, self surveys + observation notes and submit to the School Psychologist.",
            dueDate: handoffDue,
            daysRemaining: handoffDays,
            status: handoffDays <= 0 ? "overdue" : handoffDays <= 2 ? "warning" : "on-track",
            mandatory: true
          });
        }
      }
    }

    // Check quarterly progress reports for report cards
    const reportCardDates = (store && store.state && store.state.reportCardDates) || DEFAULT_REPORT_CARD_DATES;
    reportCardDates.forEach(q => {
      const isCompleted = student.progressReports?.some(r => r.quarter === q.quarter);
      if (!isCompleted) {
        const daysLeft = getDaysRemaining(q.date);
        if (daysLeft <= 10) {
          timelines.push({
            type: "IEP Progress Report",
            label: `${q.quarter} IEP Progress Report`,
            desc: `Write and attach IEP progress report for ${student.name} to the report card (due ${q.date}).`,
            dueDate: q.date,
            daysRemaining: daysLeft,
            status: daysLeft <= 0 ? "overdue" : daysLeft <= 3 ? "warning" : "on-track",
            mandatory: true,
            actionNeeded: "Write Progress Report"
          });
        }
      }
    });
  }
  
  return timelines;
};

// Global Store State Holder (Simple Pub/Sub)
export class StudentStore {
  constructor() {
    this.listeners = [];
    this.debounceTimer = null;
    if (typeof window !== "undefined") {
      window.store = this;
    }
    
    // Load config from localStorage
    const getStorageItem = (key) => {
      try {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    };

    const savedClientId = getStorageItem("aegis_client_id") || "";
    const savedTheme = getStorageItem("aegis_theme") || "light";
    const savedWorkEmail = getStorageItem("aegis_work_email") || "ariel.facilitator@rcschools.net";
    const savedEmailAlerts = getStorageItem("aegis_email_alerts") === "false" ? false : true;
    const savedCalendarSync = getStorageItem("aegis_calendar_sync") === "false" ? false : true;
    
    let savedReportCardDates = DEFAULT_REPORT_CARD_DATES;
    try {
      const parsed = JSON.parse(getStorageItem("aegis_report_card_dates"));
      if (parsed && Array.isArray(parsed) && parsed.length > 0) savedReportCardDates = parsed;
    } catch(e) {}

    let savedDeadlines = DEFAULT_DEADLINES;
    try {
      const parsed = JSON.parse(getStorageItem("aegis_deadlines"));
      if (parsed && typeof parsed === "object") savedDeadlines = { ...DEFAULT_DEADLINES, ...parsed };
    } catch(e) {}

    let savedHolidays = DEFAULT_HOLIDAYS;
    try {
      const parsed = JSON.parse(getStorageItem("aegis_holidays"));
      if (parsed && Array.isArray(parsed) && parsed.length > 0) savedHolidays = parsed;
    } catch(e) {}

    let savedTeacherEmails = {
      "Ms. Davis": "davis@rcschools.net",
      "Mrs. Harrison": "harrison@rcschools.net",
      "Mr. Thompson": "thompson@rcschools.net",
      "Mr. Adams": "adams@rcschools.net"
    };
    try {
      const parsed = JSON.parse(getStorageItem("aegis_teacher_emails"));
      if (parsed) savedTeacherEmails = parsed;
    } catch(e) {}
    
    // Load local cache if offline
    let cachedStudents = null;
    let cachedScreenings = null;
    try {
      cachedStudents = JSON.parse(getStorageItem("aegis_students"));
      if (cachedStudents) {
        cachedStudents = cachedStudents.map(student => {
          if (student.iepReviewDate !== undefined && student.iepDueDate === undefined) {
            student.iepDueDate = student.iepReviewDate;
            delete student.iepReviewDate;
          }
          // Normalize accommodations to objects, preserving empties and duplicates
          if (Array.isArray(student.accommodations)) {
            student.accommodations = student.accommodations.map(a => typeof a === 'string' ? { label: a, notes: [] } : a);
          } else {
            student.accommodations = [];
          }
          if (!student.updatedAt) {
            student.updatedAt = new Date().toISOString();
          }
          return student;
        });
      }

      cachedScreenings = JSON.parse(getStorageItem("aegis_screenings"));
      if (cachedScreenings) {
        cachedScreenings = cachedScreenings.map(s => {
          if (!s.updatedAt) {
            s.updatedAt = new Date().toISOString();
          }
          return s;
        });
      }
    } catch (e) {
      console.error("Local cache load failed", e);
    }

    const savedAccessToken = getStorageItem("aegis_access_token") || null;
    const savedTokenExpiry = getStorageItem("aegis_token_expiry") ? parseInt(getStorageItem("aegis_token_expiry"), 10) : null;
    const isTokenValid = savedAccessToken && savedTokenExpiry && Date.now() < savedTokenExpiry;

    this.state = {
      theme: savedTheme,
      clientId: savedClientId,
      syncStatus: isTokenValid ? "connecting" : "disconnected", // 'disconnected', 'connecting', 'synced', 'saving', 'error'
      syncError: null,
      accessToken: isTokenValid ? savedAccessToken : null,
      tokenExpiry: isTokenValid ? savedTokenExpiry : null,
      allDataFileId: getStorageItem("aegis_all_data_fid") || null,
      parentPortalFileId: getStorageItem("aegis_parent_fid") || null,
      aegisFolderId: getStorageItem("aegis_folder_id") || null,
      
      // Email parameters
      workEmail: savedWorkEmail,
      emailAlertsEnabled: savedEmailAlerts,
      calendarSyncEnabled: savedCalendarSync,
      teacherEmails: savedTeacherEmails,
      reportCardDates: savedReportCardDates,
      deadlines: savedDeadlines,
      holidays: savedHolidays,

      // Data Arrays
      students: cachedStudents || INITIAL_STUDENTS,
      screenings: cachedScreenings || INITIAL_SCREENINGS,
      
      // UI State
      activeTab: "dashboard",
      isParentMode: false,
      flashingGreen: false,

      // Deep linking states
      selectedScreeningId: null,
      selectedScreeningStepIndex: null,
      selectedIepStudentId: null,
      selectedIepStepIndex: null,
      selectedReevalStudentId: null,
      selectedProgressStudentId: null,
      selectedProgressQuarter: null,
      toastMessage: "",
      toastStudentId: null,
      toastQuarter: null
    };

    // Apply theme
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    // Auto-connect if previous session is still valid
    if (isTokenValid) {
      setTimeout(() => {
        this.syncFromGoogleDrive();
      }, 50);
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update State & LocalStorage Cache immediately
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    
    // Sync critical local storage keys immediately
    if (typeof localStorage !== "undefined") {
      try {
        if (newState.theme) localStorage.setItem("aegis_theme", newState.theme);
        if (newState.clientId !== undefined) localStorage.setItem("aegis_client_id", newState.clientId);
        if (newState.allDataFileId) localStorage.setItem("aegis_all_data_fid", newState.allDataFileId);
        if (newState.parentPortalFileId) localStorage.setItem("aegis_parent_fid", newState.parentPortalFileId);
        if (newState.aegisFolderId !== undefined) localStorage.setItem("aegis_folder_id", newState.aegisFolderId || "");
        if (newState.workEmail !== undefined) localStorage.setItem("aegis_work_email", newState.workEmail);
        if (newState.emailAlertsEnabled !== undefined) localStorage.setItem("aegis_email_alerts", newState.emailAlertsEnabled ? "true" : "false");
        if (newState.calendarSyncEnabled !== undefined) localStorage.setItem("aegis_calendar_sync", newState.calendarSyncEnabled ? "true" : "false");
        if (newState.teacherEmails !== undefined) localStorage.setItem("aegis_teacher_emails", JSON.stringify(newState.teacherEmails));
        if (newState.reportCardDates !== undefined) localStorage.setItem("aegis_report_card_dates", JSON.stringify(newState.reportCardDates));
        if (newState.deadlines !== undefined) localStorage.setItem("aegis_deadlines", JSON.stringify(newState.deadlines));
        if (newState.holidays !== undefined) localStorage.setItem("aegis_holidays", JSON.stringify(newState.holidays));
        if (newState.accessToken !== undefined) {
          if (newState.accessToken) {
            localStorage.setItem("aegis_access_token", newState.accessToken);
          } else {
            localStorage.removeItem("aegis_access_token");
          }
        }
        if (newState.tokenExpiry !== undefined) {
          if (newState.tokenExpiry) {
            localStorage.setItem("aegis_token_expiry", newState.tokenExpiry.toString());
          } else {
            localStorage.removeItem("aegis_token_expiry");
          }
        }
        
        // Save database cache in localStorage for instant offline access
        localStorage.setItem("aegis_students", JSON.stringify(this.state.students));
        localStorage.setItem("aegis_screenings", JSON.stringify(this.state.screenings));
      } catch (e) {
        console.error("localStorage update failed", e);
      }
    }
    
    this.emit();
  }

  setTheme(theme) {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    this.updateState({ theme });
  }

  // Google OAuth Log In
  connectGoogleDrive() {
    let clientId = this.state.clientId;
    if (!clientId || clientId === "null" || clientId === "undefined" || clientId.trim() === "") {
      clientId = DEFAULT_CLIENT_ID;
    }
    if (!clientId) {
      this.updateState({ syncStatus: "error", syncError: "Please enter a valid Google Client ID in Settings first." });
      return;
    }

    this.updateState({ syncStatus: "connecting", syncError: null });

    driveService.requestAccessToken(
      clientId,
      async (token, expiry) => {
        this.updateState({
          accessToken: token,
          tokenExpiry: expiry
        });
        
        await this.syncFromGoogleDrive();
      },
      (errorMsg) => {
        this.updateState({ syncStatus: "error", syncError: errorMsg });
      }
    );
  }

  // Disconnect Drive
  disconnectGoogleDrive() {
    localStorage.removeItem("aegis_all_data_fid");
    localStorage.removeItem("aegis_parent_fid");
    localStorage.removeItem("aegis_folder_id");
    localStorage.removeItem("aegis_access_token");
    localStorage.removeItem("aegis_token_expiry");
    this.updateState({
      accessToken: null,
      tokenExpiry: null,
      allDataFileId: null,
      parentPortalFileId: null,
      aegisFolderId: null,
      syncStatus: "disconnected",
      syncError: null
    });
  }

  // Check Token Validity
  isTokenValid() {
    return this.state.accessToken && this.state.tokenExpiry && Date.now() < this.state.tokenExpiry;
  }

  // Merge local and cloud data based on updatedAt timestamps
  mergeWithCloud(localData, cloudData) {
    const merged = {};
    const conflicts = [];
    const stats = { localAdded: 0, cloudAdded: 0, identical: 0, conflicted: 0 };

    // Helper to merge entity collections (students, screenings)
    const mergeEntities = (key) => {
      const localArr = (localData[key] || []).map(item => ({
        ...item,
        updatedAt: item.updatedAt || new Date(0).toISOString()
      }));
      const cloudArr = (cloudData[key] || []).map(item => ({
        ...item,
        updatedAt: item.updatedAt || new Date(0).toISOString()
      }));

      const cloudMap = new Map();
      cloudArr.forEach(item => cloudMap.set(item.id, item));
      const result = [];

      localArr.forEach(localItem => {
        const cloudItem = cloudMap.get(localItem.id);
        if (!cloudItem) {
          // Local only -> preserve in merged dataset
          result.push(localItem);
          stats.localAdded++;
        } else {
          const localTime = new Date(localItem.updatedAt || 0).getTime();
          const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();

          const localCopy = { ...localItem, updatedAt: null };
          const cloudCopy = { ...cloudItem, updatedAt: null };
          const isContentIdentical = JSON.stringify(localCopy) === JSON.stringify(cloudCopy);

          if (isContentIdentical) {
            // Identical content: keep the one with newer updatedAt
            result.push(localTime >= cloudTime ? localItem : cloudItem);
            stats.identical++;
          } else {
            // Content differs between local and cloud -> conflict
            conflicts.push({
              id: localItem.id,
              type: key,
              name: localItem.name || cloudItem.name || localItem.id,
              local: localItem,
              cloud: cloudItem,
              keep: localTime >= cloudTime ? "local" : "cloud"
            });
            stats.conflicted++;
            result.push(localTime >= cloudTime ? localItem : cloudItem);
          }
          cloudMap.delete(localItem.id);
        }
      });

      // Add cloud-only entities
      cloudMap.forEach(cloudItem => {
        result.push(cloudItem);
        stats.cloudAdded++;
      });

      merged[key] = result;
    };

    mergeEntities("students");
    mergeEntities("screenings");

    // Settings and configuration merge
    merged.workEmail = cloudData.workEmail || localData.workEmail || "ariel.facilitator@rcschools.net";
    merged.emailAlertsEnabled = cloudData.emailAlertsEnabled !== undefined ? cloudData.emailAlertsEnabled : localData.emailAlertsEnabled;
    merged.calendarSyncEnabled = cloudData.calendarSyncEnabled !== undefined ? cloudData.calendarSyncEnabled : localData.calendarSyncEnabled;
    merged.teacherEmails = { ...(localData.teacherEmails || {}), ...(cloudData.teacherEmails || {}) };
    merged.reportCardDates = cloudData.reportCardDates || localData.reportCardDates || DEFAULT_REPORT_CARD_DATES;
    merged.deadlines = { ...DEFAULT_DEADLINES, ...(localData.deadlines || {}), ...(cloudData.deadlines || {}) };
    merged.holidays = (cloudData.holidays && cloudData.holidays.length > 0) ? cloudData.holidays : (localData.holidays || DEFAULT_HOLIDAYS);

    return { merged, conflicts, stats };
  }

  // Apply resolution from conflict modal
  applyResolution(conflicts, resolveAllNewest = false) {
    // Save snapshot for Undo
    this.lastSyncBackup = {
      students: JSON.parse(JSON.stringify(this.state.students)),
      screenings: JSON.parse(JSON.stringify(this.state.screenings)),
      timestamp: Date.now()
    };

    let currentStudents = [...this.state.students];
    let currentScreenings = [...this.state.screenings];

    (conflicts || []).forEach(c => {
      let chosen;
      if (resolveAllNewest) {
        const localTime = new Date(c.local.updatedAt || 0).getTime();
        const cloudTime = new Date(c.cloud.updatedAt || 0).getTime();
        chosen = localTime >= cloudTime ? c.local : c.cloud;
      } else {
        chosen = c.keep === "cloud" ? c.cloud : c.local;
      }

      if (c.type === "students") {
        const idx = currentStudents.findIndex(s => s.id === c.id);
        if (idx >= 0) {
          currentStudents[idx] = chosen;
        } else {
          currentStudents.push(chosen);
        }
      } else if (c.type === "screenings") {
        const idx = currentScreenings.findIndex(s => s.id === c.id);
        if (idx >= 0) {
          currentScreenings[idx] = chosen;
        } else {
          currentScreenings.push(chosen);
        }
      }
    });

    this.updateState({
      students: currentStudents,
      screenings: currentScreenings,
      syncStatus: "synced",
      conflicts: [],
      mergedData: null,
      flashingGreen: true,
      toastMessage: `Resolved ${(conflicts || []).length} sync conflict(s) & updated Google Drive.`,
      toastType: "sync",
      hasUndoBackup: true
    });

    setTimeout(() => this.updateState({ flashingGreen: false }), 800);

    // Push merged resolved data back to Google Drive immediately
    this.triggerCloudSave();
  }

  // Smart cloud sync method that merges instead of overwriting
  async syncToCloud() {
    if (!this.isTokenValid()) {
      this.connectGoogleDrive();
      return;
    }
    try {
      this.updateState({ syncStatus: "connecting", syncError: null });
      
      let folderId = this.state.aegisFolderId || localStorage.getItem("aegis_folder_id");
      if (!folderId) {
        folderId = await driveService.findFolder(this.state.accessToken, "Aegis");
        if (!folderId) {
          folderId = await driveService.createFolder(this.state.accessToken, "Aegis");
        }
        this.updateState({ aegisFolderId: folderId });
      }

      let fileId = this.state.allDataFileId || await driveService.findFile(this.state.accessToken, "all-data.json", folderId);
      if (!fileId) {
        // No cloud file exists yet -> save current state as cloud master
        this.triggerCloudSave();
        this.updateState({
          syncStatus: "synced",
          flashingGreen: true,
          toastMessage: "Google Drive connected: Caseload uploaded.",
          toastType: "sync",
          hasUndoBackup: false
        });
        setTimeout(() => this.updateState({ flashingGreen: false }), 800);
        return { merged: this.state, conflicts: [], stats: { localAdded: 0, cloudAdded: 0 } };
      }

      const cloudData = await driveService.readFile(this.state.accessToken, fileId);
      const { merged, conflicts, stats } = this.mergeWithCloud(this.state, cloudData);

      if (conflicts && conflicts.length > 0) {
        this.updateState({
          syncStatus: "conflict",
          conflicts,
          mergedData: merged
        });
        return { merged, conflicts, stats };
      }

      // Save pre-sync backup for instant Undo
      this.lastSyncBackup = {
        students: JSON.parse(JSON.stringify(this.state.students)),
        screenings: JSON.parse(JSON.stringify(this.state.screenings)),
        timestamp: Date.now()
      };

      // Determine friendly notification message
      let syncMessage = "Cloud Sync complete: Database is up to date.";
      if (stats.localAdded > 0 && stats.cloudAdded > 0) {
        syncMessage = `Synced: Added ${stats.localAdded} local record(s) and pulled ${stats.cloudAdded} cloud update(s).`;
      } else if (stats.localAdded > 0) {
        syncMessage = `Synced: Uploaded ${stats.localAdded} new local profile(s) to Google Drive.`;
      } else if (stats.cloudAdded > 0) {
        syncMessage = `Synced: Pulled ${stats.cloudAdded} new profile(s) from Google Drive.`;
      }

      // No conflicts -> apply merged data and immediately update cloud
      this.updateState({
        allDataFileId: fileId,
        aegisFolderId: folderId,
        students: merged.students || this.state.students,
        screenings: merged.screenings || this.state.screenings,
        workEmail: merged.workEmail || this.state.workEmail,
        emailAlertsEnabled: merged.emailAlertsEnabled !== undefined ? merged.emailAlertsEnabled : this.state.emailAlertsEnabled,
        calendarSyncEnabled: merged.calendarSyncEnabled !== undefined ? merged.calendarSyncEnabled : this.state.calendarSyncEnabled,
        teacherEmails: merged.teacherEmails || this.state.teacherEmails,
        reportCardDates: merged.reportCardDates || this.state.reportCardDates,
        deadlines: merged.deadlines || this.state.deadlines,
        holidays: merged.holidays || this.state.holidays,
        syncStatus: "synced",
        conflicts: [],
        mergedData: null,
        flashingGreen: true,
        toastMessage: syncMessage,
        toastType: "sync",
        hasUndoBackup: stats.localAdded > 0 || stats.cloudAdded > 0 || stats.conflicted > 0
      });

      setTimeout(() => this.updateState({ flashingGreen: false }), 800);

      this.triggerCloudSave();
      return { merged, conflicts: [], stats };
    } catch (err) {
      console.error(err);
      this.updateState({ syncStatus: "error", syncError: `Cloud Sync Failed: ${err.message}` });
    }
  }

  // Backwards compatibility alias: ALL sync operations route through smart 2-way merge
  async syncFromGoogleDrive() {
    return this.syncToCloud();
  }

  // Undo last sync action and restore pre-sync snapshot
  undoLastSync() {
    if (!this.lastSyncBackup) {
      this.updateState({ toastMessage: "No previous sync available to undo.", toastType: "info", hasUndoBackup: false });
      return;
    }

    const { students, screenings } = this.lastSyncBackup;
    this.lastSyncBackup = null;

    this.updateState({
      students: students || this.state.students,
      screenings: screenings || this.state.screenings,
      syncStatus: "synced",
      toastMessage: "Sync undone: Local records restored to pre-sync state.",
      toastType: "info",
      hasUndoBackup: false,
      flashingGreen: true
    });

    setTimeout(() => this.updateState({ flashingGreen: false }), 800);
    this.triggerCloudSave();
  }

  // Debounced Auto-Save back to Google Drive
  triggerCloudSave() {
    // If not logged in, just keep saving locally
    if (!this.isTokenValid()) {
      return;
    }

    this.updateState({ syncStatus: "saving" });

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(async () => {
      try {
        const payload = {
          students: this.state.students,
          screenings: this.state.screenings,
          workEmail: this.state.workEmail,
          emailAlertsEnabled: this.state.emailAlertsEnabled,
          calendarSyncEnabled: this.state.calendarSyncEnabled,
          teacherEmails: this.state.teacherEmails,
          reportCardDates: this.state.reportCardDates,
          deadlines: this.state.deadlines,
          holidays: this.state.holidays
        };

        let folderId = this.state.aegisFolderId;
        if (!folderId) {
          folderId = await driveService.findFolder(this.state.accessToken, "Aegis");
          if (!folderId) folderId = await driveService.createFolder(this.state.accessToken, "Aegis");
          this.updateState({ aegisFolderId: folderId });
        }

        // 1. Update or create all-data.json (Confidential Data)
        let allDataFid = this.state.allDataFileId;
        if (!allDataFid) {
          allDataFid = await driveService.findFile(this.state.accessToken, "all-data.json", folderId);
        }

        if (allDataFid) {
          await driveService.updateFile(this.state.accessToken, allDataFid, payload);
          if (!this.state.allDataFileId) this.updateState({ allDataFileId: allDataFid });
        } else {
          allDataFid = await driveService.createFile(this.state.accessToken, "all-data.json", payload, folderId);
          this.updateState({ allDataFileId: allDataFid });
        }
        
        // 2. Build and update parent-portal.json (Segregated Data)
        let parentFid = this.state.parentPortalFileId;
        if (!parentFid) {
          parentFid = await driveService.findFile(this.state.accessToken, "parent-portal.json", folderId);
        }
        
        const parentPayload = driveService.segregateParentData(payload);
        
        if (parentFid) {
          await driveService.updateFile(this.state.accessToken, parentFid, parentPayload);
          if (!this.state.parentPortalFileId) this.updateState({ parentPortalFileId: parentFid });
        } else {
          const newParentFid = await driveService.createFile(this.state.accessToken, "parent-portal.json", parentPayload, folderId);
          this.updateState({ parentPortalFileId: newParentFid });
        }

        this.updateState({ syncStatus: "synced", flashingGreen: true });
        
        setTimeout(() => this.updateState({ flashingGreen: false }), 800);
      } catch (err) {
        console.error(err);
        this.updateState({ syncStatus: "error", syncError: `Auto-Save Failed: ${err.message}` });
      }
    }, 1200); // 1.2 second debounce
  }

  // ==========================================
  // Core Business Logic Actions
  // ==========================================

  // Add Active Student
  addStudent(student) {
    const updated = [
      ...this.state.students,
      {
        id: `active-${Date.now()}`,
        status: "Active",
        accommodations: [],
        progressReports: [],
        iepMeetingDate: "",
        iepInvitationSentDate: "",
        iepInvitationResponseReceived: false,
        iepTeacherChecklistSent: false,
        iepDataMiningCompleted: false,
        updatedAt: new Date().toISOString(),
        iepTransitionSurveyCompleted: false,
        iepDraftWrittenDate: "",
        iepDraftSentDate: "",
        iepFinalizedDate: "",
        iepAtAGlancePrinted: false,
        iepAtAGlanceSignaturesCompleted: false,
        iepPulseUploadCompleted: false,
        iepSharePointUploadCompleted: false,
        iepPhysicalFileCompleted: false,
        augustSetupComplete: false,
        classroomTeacherEmail: student.classroomTeacherEmail || "",
        ...student
      }
    ];
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Bulk Add Active Students (from CSV import)
  addStudents(newStudents) {
      const initialized = newStudents.map((student, idx) => ({
        id: `active-${Date.now()}-${idx}`,
        status: "Active",
        accommodations: (student.accommodations || []).map(a => typeof a === 'string' ? { label: a, notes: [] } : a),
        progressReports: [],
        iepMeetingDate: student.iepMeetingDate || "",
        iepInvitationSentDate: "",
        iepInvitationResponseReceived: false,
        iepTeacherChecklistSent: false,
        iepDataMiningCompleted: false,
        iepTransitionSurveyCompleted: false,
        iepDraftWrittenDate: "",
        iepDraftSentDate: "",
        iepFinalizedDate: "",
        iepAtAGlancePrinted: false,
        iepAtAGlanceSignaturesCompleted: false,
        iepPulseUploadCompleted: false,
        iepSharePointUploadCompleted: false,
        iepPhysicalFileCompleted: false,
        augustSetupComplete: false,
        classroomTeacherEmail: student.classroomTeacherEmail || "",
        updatedAt: new Date().toISOString(),
        ...student
      }));

    const updated = [...this.state.students, ...initialized];
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Edit Student details
  updateStudent(studentId, updatedFields) {
    const fieldsToUpdate = { ...updatedFields };
    
    // Mirror meeting dates
    if (fieldsToUpdate.iepMeetingDate !== undefined) {
      fieldsToUpdate.reevalMeetingDate = fieldsToUpdate.iepMeetingDate;
    } else if (fieldsToUpdate.reevalMeetingDate !== undefined) {
      fieldsToUpdate.iepMeetingDate = fieldsToUpdate.reevalMeetingDate;
    }

    // Mirror invitation sent dates
    if (fieldsToUpdate.iepInvitationSentDate !== undefined) {
      fieldsToUpdate.reevalInvitationSentDate = fieldsToUpdate.iepInvitationSentDate;
    } else if (fieldsToUpdate.reevalInvitationSentDate !== undefined) {
      fieldsToUpdate.iepInvitationSentDate = fieldsToUpdate.reevalInvitationSentDate;
    }

    const updated = this.state.students.map(s => {
      if (s.id === studentId) {
        return { ...s, ...fieldsToUpdate, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Remove student from Active List
  removeStudent(studentId) {
    const updated = this.state.students.filter(s => s.id !== studentId);
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Bulk update student details
  bulkUpdateStudents(studentIds, updatedFields) {
    const now = new Date().toISOString();
    const updated = this.state.students.map(s => {
      if (studentIds.includes(s.id)) {
        return { ...s, ...updatedFields, updatedAt: now };
      }
      return s;
    });
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Bulk remove students from active list
  bulkDeleteStudents(studentIds) {
    const updated = this.state.students.filter(s => !studentIds.includes(s.id));
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Bulk promote students to next grade (6th -> 7th -> 8th -> Inactive)
  bulkPromoteStudents(studentIds) {
    const now = new Date().toISOString();
    const updated = this.state.students.map(s => {
      if (studentIds.includes(s.id)) {
        let nextGrade = s.grade;
        let nextStatus = s.status;
        if (s.grade === "6th") {
          nextGrade = "7th";
        } else if (s.grade === "7th") {
          nextGrade = "8th";
        } else if (s.grade === "8th") {
          nextStatus = "Inactive"; // Graduated middle school
        }
        return { ...s, grade: nextGrade, status: nextStatus, updatedAt: now };
      }
      return s;
    });
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Add Student to Screening Center
  addScreening(candidate) {
    const updated = [
      ...this.state.screenings,
      {
        id: `screen-${Date.now()}`,
        status: "Quick Survey",
        referralDate: new Date().toISOString().split("T")[0],
        surveyPriorTestingCheck: false,
        surveyEslCheck: false,
        surveyDcsCheck: false,
        quickSurveyCompleted: false,
        parentPaperworkSentDate: "",
        consentReceivedDate: "",
        academicCheckCompleted: false,
        academicInstrument: "T-VAAS",
        academicScore: "",
        creativityCheckCompleted: false,
        creativityInstrument: "TN TOL",
        creativityScore: "",
        teacherChecklistSigned: false,
        teacherChecklistSentDate: "",
        informedConsentCompleted: false,
        permissionToEmailReceived: false,
        permissionToTestSentDate: "",
        permissionToTestReceivedDate: "",
        psychologistHandoffDate: "",
        psychResultsReceived: false,
        psychIqScore: "",
        psychPoints: 0,
        meetingDate: "",
        meetingInvitationSentDate: "",
        meetingNoticeWaived: false,
        discontinuationPWNMailDate: false,
        discontinuationCumeFileDate: false,
        nudgeSent: false,
        classroomTeacherEmail: candidate.classroomTeacherEmail || "",
        updatedAt: new Date().toISOString(),
        matrix: {
          cognition: { instrument: "", score: "", points: 0 },
          performance: { instrument: "", score: "", points: 0 },
          creativity: { instrument: "", score: "", points: 0 }
        },
        ...candidate
      }
    ];
    this.updateState({ screenings: updated });
    this.triggerCloudSave();
  }

  // Edit Screening Profile
  updateScreening(screeningId, updatedFields) {
    const updated = this.state.screenings.map(s => {
      if (s.id === screeningId) {
        return { ...s, ...updatedFields, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    this.updateState({ screenings: updated });
    this.triggerCloudSave();
  }

  // Remove screening entirely (archived)
  removeScreening(screeningId) {
    const updated = this.state.screenings.filter(s => s.id !== screeningId);
    this.updateState({ screenings: updated });
    this.triggerCloudSave();
  }

  // Screen to Placement Transition (Liam qualifies!)
  placeStudent(screeningId, initialAccommodations = []) {
    const screening = this.state.screenings.find(s => s.id === screeningId);
    if (!screening) return;

    // 1. Remove from screening list
    const updatedScreenings = this.state.screenings.filter(s => s.id !== screeningId);

    // 2. Add to active students list
    const newStudent = {
      id: `active-${Date.now()}`,
      name: screening.name,
      grade: screening.grade,
      school: screening.school,
      classroomTeacher: screening.classroomTeacher,
      classroomTeacherEmail: screening.classroomTeacherEmail || "",
      status: "Active",
      iepDueDate: addDays(new Date().toISOString().split("T")[0], 30), // Initial IEP due within 30 days of placement!
      reevalDueDate: addDays(new Date().toISOString().split("T")[0], 3 * 365), // 3 years later
      accommodations: (initialAccommodations || []).map(a => typeof a === 'string' ? { label: a, notes: [] } : a),
      selNeeds: {
        type: "Asynchronous Development",
        details: "Undergoing initial placement assessment. Identify core overexcitabilities.",
        strategies: ["Dynamic interest-based pacing"],
        logs: [{ date: new Date().toISOString().split("T")[0], note: "Placement finalized from evaluation grid." }]
      },
      progressReports: [],
      iepMeetingDate: "",
      iepInvitationSentDate: "",
      iepInvitationResponseReceived: false,
      iepTeacherChecklistSent: false,
      iepDataMiningCompleted: false,
      iepTransitionSurveyCompleted: false,
      iepDraftWrittenDate: "",
      iepDraftSentDate: "",
      iepFinalizedDate: "",
      iepAtAGlancePrinted: false,
      iepAtAGlanceSignaturesCompleted: false,
      iepPulseUploadCompleted: false,
      iepSharePointUploadCompleted: false,
      iepPhysicalFileCompleted: false,
      augustSetupComplete: false,
      updatedAt: new Date().toISOString()
    };

    this.updateState({
      screenings: updatedScreenings,
      students: [...this.state.students, newStudent]
    });
    this.triggerCloudSave();
  }

  // Log an SEL note/observation
  addSelLog(studentId, noteStr) {
    const updated = this.state.students.map(s => {
      if (s.id === studentId) {
        const logs = s.selNeeds ? [...(s.selNeeds.logs || [])] : [];
        logs.unshift({
          date: new Date().toISOString().split("T")[0],
          note: noteStr
        });
        return {
          ...s,
          selNeeds: {
            ...s.selNeeds,
            logs
          },
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Create or Update Quarterly Progress Report
  saveProgressReport(studentId, report) {
    const updated = this.state.students.map(s => {
      if (s.id === studentId) {
        const reports = [...(s.progressReports || [])];
        const existingIdx = reports.findIndex(r => r.quarter === report.quarter);
        
        if (existingIdx >= 0) {
          reports[existingIdx] = report;
        } else {
          reports.unshift(report);
        }
        
        return {
          ...s,
          progressReports: reports,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Send HTML weekly email summary via the Google Gmail API
  async sendWeeklyEmail() {
    if (!this.isTokenValid()) {
      alert("Please connect your Google Account first using settings.");
      return;
    }

    this.updateState({ syncStatus: "saving" });

    try {
      // 1. Calculate matching timelines in the current week (identical to Dashboard layout)
      const activeTimelines = this.state.students.flatMap(s => calculateTimelines(s, false).map(t => ({ ...t, studentName: s.name, type: "Active" })));
      const screeningTimelines = this.state.screenings.flatMap(s => calculateTimelines(s, true).map(t => ({ ...t, studentName: s.name, type: "Screening" })));
      const rawTimelines = [...activeTimelines, ...screeningTimelines];
      
      const dueThisWeek = rawTimelines.filter(t => {
        if (t.daysRemaining < 0) return true;
        if (!t.dueDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDay = today.getDay();
        
        const startOfWeek = new Date(today);
        const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        startOfWeek.setDate(startOfWeek.getDate() + distToMonday);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const dueDateObj = new Date(t.dueDate);
        dueDateObj.setHours(0, 0, 0, 0);
        
        return dueDateObj >= startOfWeek && dueDateObj <= endOfWeek;
      });

      // 2. Build email body HTML summary
      let htmlBody = `
        <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 22px;">Aegis Weekly Due Summary</h1>
            <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Blackman Middle School Gifted Facilitation Mandates</p>
          </div>
          
          <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">Hi Ariel, here is your consolidated summary of special education timelines and signatures due for the current calendar week:</p>
      `;

      if (dueThisWeek.length === 0) {
        htmlBody += `
          <div style="text-align: center; padding: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #15803d; font-weight: 600; font-size: 14px;">
            🎉 All Clear! No timelines due or overdue for this calendar week.
          </div>
        `;
      } else {
        dueThisWeek.forEach(t => {
          const color = t.status === "overdue" ? "#f43f5e" : t.status === "warning" ? "#d97706" : "#10b981";
          const bg = t.status === "overdue" ? "#fff1f2" : t.status === "warning" ? "#fef3c7" : "#ecfdf5";
          const border = t.status === "overdue" ? "#fecdd3" : t.status === "warning" ? "#fde68a" : "#a7f3d0";
          
          htmlBody += `
            <div style="padding: 16px; border-radius: 8px; border: 1px solid ${border}; border-left: 5px solid ${color}; background-color: ${bg}; margin-bottom: 12px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
                <span style="color: #0f172a; font-size: 14px;">${t.studentName}</span>
                <span style="color: ${color}; font-size: 12px; text-transform: uppercase;">
                  ${t.daysRemaining === null ? "PENDING" : t.daysRemaining < 0 ? `${Math.abs(t.daysRemaining)} Days Overdue` : t.daysRemaining === 0 ? "Due Today" : `${t.daysRemaining} Days Left`}
                </span>
              </div>
              <div style="font-weight: 700; margin-bottom: 4px; color: #334155;">[${t.type}] ${t.label}</div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px; line-height: 1.4;">${t.desc}</div>
              <div style="font-size: 11px; color: #475569;">Due Date: <strong>${t.dueDate || "N/A"}</strong></div>
            </div>
          `;
        });
      }

      htmlBody += `
          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            This email was sent from your personal Gmail account to your work inbox using the Google Gmail API integration in Aegis.
          </div>
        </div>
      `;

      // 3. Construct RFC 822 MIME message
      const to = this.state.workEmail || "ariel.facilitator@rcschools.net";
      const subject = `[Aegis Weekly Checklist] ${dueThisWeek.length} timelines due or overdue`;
      
      const emailContent = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        htmlBody
      ].join('\r\n');

      // Base64url encode securely
      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 4. Send email via Google Gmail API
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.state.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google API Error: ${response.status} - ${errText}`);
      }

      this.updateState({ syncStatus: "synced", flashingGreen: true });
      setTimeout(() => this.updateState({ flashingGreen: false }), 800);
      alert(`Weekly timeline summary email successfully sent to ${to}!`);
    } catch (err) {
      console.error(err);
      this.updateState({ syncStatus: "error", syncError: `Email send failed: ${err.message}` });
      alert(`Gmail API failed to send: ${err.message}. Make sure you authorized the 'gmail.send' permission when connecting your Google Drive.`);
    }
  }
}

export const store = new StudentStore();
export default store;
