/* ==========================================
   Aegis Gifted Tracker - ScreeningGrid Component
   ========================================== */

import React, { useState, useEffect } from "react";
import { store, addDays, getDaysRemaining, addSchoolDays, guessTeacherEmail, DEFAULT_DEADLINES } from "../utils/studentStore";
import { 
  Check, 
  ClipboardList, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Send, 
  CheckCircle,
  FileCheck,
  PhoneCall,
  UserCheck2,
  Trash2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List
} from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBD") return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dateStr;
};

const phases = [
  "Quick Survey",
  "Consent Pending",
  "Evaluation in Progress",
  "Informed Consent",
  "Permission to Test Pending",
  "Psych Results Pending",
  "Meeting Scheduled",
  "Pending Discontinuation"
];

export default function ScreeningGrid({ screenings, addScreening, updateScreening, placeStudent }) {
  // Read initial selection from store if present
  const globalSelectedId = store.getState().selectedScreeningId;
  const [selectedScreenId, setSelectedScreenId] = useState(globalSelectedId || screenings[0]?.id || "");
  const [showAddReferral, setShowAddReferral] = useState(false);
  
  // Referral Form State
  const [refName, setRefName] = useState("");
  const [refGrade, setRefGrade] = useState("6th");
  const [refTeacher, setRefTeacher] = useState("");

  const [viewMode, setViewMode] = useState("timeline");
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedStepIndexByStudent, setSelectedStepIndexByStudent] = useState({});

  const activeScreening = screenings.find(s => s.id === selectedScreenId);

  // Sync selected screening if screenings array changes and selection is empty
  useEffect(() => {
    if (screenings.length > 0 && !selectedScreenId) {
      setSelectedScreenId(screenings[0].id);
    }
  }, [screenings, selectedScreenId]);

  // Sync with global store selection changes (e.g. clicked on dashboard link)
  useEffect(() => {
    const checkGlobalSelection = () => {
      const globalId = store.getState().selectedScreeningId;
      const globalStep = store.getState().selectedScreeningStepIndex;
      if (globalId) {
        setSelectedScreenId(globalId);
        setExpandedStudentId(globalId);
        if (globalStep !== undefined && globalStep !== null) {
          setSelectedStepIndexByStudent(prev => ({
            ...prev,
            [globalId]: globalStep
          }));
        }
        // Reset global store selection to prevent locking focus
        store.updateState({ selectedScreeningId: null, selectedScreeningStepIndex: null });
      }
    };
    
    // Initial check
    checkGlobalSelection();

    // Subscribe to state changes
    const unsubscribe = store.subscribe(() => {
      checkGlobalSelection();
    });
    return unsubscribe;
  }, [selectedScreenId]);

  const handleAddReferral = (e) => {
    e.preventDefault();
    if (!refName || !refTeacher) {
      alert("Please fill in Name and Classroom Teacher.");
      return;
    }

    addScreening({
      name: refName,
      grade: refGrade,
      classroomTeacher: refTeacher,
      school: "Blackman Middle School"
    });

    setRefName("");
    setRefTeacher("");
    setShowAddReferral(false);
    
    // Auto-select newly created referral
    setTimeout(() => {
      const allScreens = store.getState().screenings;
      const latest = allScreens[allScreens.length - 1];
      if (latest) setSelectedScreenId(latest.id);
    }, 100);
  };

  const handleConsentDateForStudent = (student, dateStr) => {
    if (!student) return;
    updateScreening(student.id, { 
      consentReceivedDate: dateStr,
      status: dateStr ? "Evaluation in Progress" : "Consent Pending",
      teacherChecklistSentDate: dateStr ? dateStr : ""
    });
    setSelectedStepIndexByStudent(prev => ({
      ...prev,
      [student.id]: dateStr ? 2 : 1
    }));
  };

  const handleConsentDate = (dateStr) => {
    handleConsentDateForStudent(activeScreening, dateStr);
  };

  const handleBatonPassForStudent = (student, dateStr) => {
    if (!student) return;
    updateScreening(student.id, {
      permissionToTestReceivedDate: dateStr,
      psychologistHandoffDate: dateStr,
      status: dateStr ? "Psych Results Pending" : "Permission to Test Pending"
    });
    setSelectedStepIndexByStudent(prev => ({
      ...prev,
      [student.id]: dateStr ? 5 : 4
    }));
  };

  const handleBatonPass = (dateStr) => {
    handleBatonPassForStudent(activeScreening, dateStr);
  };

  const handleFinalizePlacementForStudent = (student) => {
    if (!student) return;
    placeStudent(student.id, ["Curriculum Compacting", "Advanced Academic Pacing"]);
    
    // Reset selected screen if active student was placed
    if (activeScreening && activeScreening.id === student.id) {
      const remaining = screenings.filter(s => s.id !== student.id);
      if (remaining.length > 0) {
        setSelectedScreenId(remaining[0].id);
      } else {
        setSelectedScreenId("");
      }
    }
    
    alert(`${student.name} has been successfully evaluated and placed into the Active Gifted Student directory! An initial IEP timeline has been scheduled due in 30 days.`);
  };

  const handleFinalizePlacement = () => {
    handleFinalizePlacementForStudent(activeScreening);
  };

  const calculatePerformancePoints = (student) => {
    const inst = student.academicInstrument || "T-VAAS";
    
    if (inst === "TN Supplementary Gifted Checklist") {
      const val = parseFloat(student.tnSupScore) || 0;
      if (val <= 12) {
        if (val >= 9) return 30;
        if (val >= 8) return 20;
        if (val >= 7) return 10;
        return 0;
      } else {
        if (val >= 95) return 10;
        if (val >= 90) return 10;
        return 0;
      }
    }

    const isTvaas = inst === "T-VAAS";
    
    // Check if sub-scores are filled out
    const hasTvaasSubscores = student.tvaasElaScore || student.tvaasMathScore || student.tvaasSciScore || student.tvaasSSTScore;
    const hasWjSubscores = student.wjReadingScore || student.wjLangScore || student.wjMathScore || student.wjKnowledgeScore || student.wjAppsScore;

    if (!hasTvaasSubscores && !hasWjSubscores) {
      // Legacy single-score fallback
      const legacyScore = parseFloat(student.matrix?.performance?.score) || 0;
      return legacyScore >= 99 ? 25 : legacyScore >= 96 ? 20 : legacyScore >= 90 ? 15 : legacyScore >= 85 ? 10 : legacyScore >= 80 ? 5 : 0;
    }

    let areas95 = 0;
    let areas90 = 0;

    if (isTvaas) {
      const ela = parseFloat(student.tvaasElaScore) || 0;
      const math = parseFloat(student.tvaasMathScore) || 0;
      const sci = parseFloat(student.tvaasSciScore) || 0;
      const ss = parseFloat(student.tvaasSSTScore) || 0;

      [ela, math, sci, ss].forEach(score => {
        if (score >= 95) areas95++;
        if (score >= 90) areas90++;
      });
    } else {
      const reading = parseFloat(student.wjReadingScore) || 0;
      const lang = parseFloat(student.wjLangScore) || 0;
      const math = parseFloat(student.wjMathScore) || 0;
      const knowledge = parseFloat(student.wjKnowledgeScore) || 0;
      const apps = parseFloat(student.wjAppsScore) || 0;

      [reading, lang, math, knowledge, apps].forEach(score => {
        if (score >= 95) areas95++;
        if (score >= 90) areas90++;
      });
    }

    if (areas95 >= 3 || areas90 >= 4) {
      return 30;
    } else if (areas95 >= 2 || areas90 >= 3) {
      return 20;
    } else if (areas95 >= 1 || areas90 >= 2) {
      return 10;
    }
    return 0;
  };

  const handleSubScoreChange = (student, updatedFields) => {
    const tempStudent = { ...student, ...updatedFields };
    const points = calculatePerformancePoints(tempStudent);
    
    // Build score summary text
    let summaryText = "";
    const inst = tempStudent.academicInstrument || "T-VAAS";
    if (inst === "T-VAAS") {
      summaryText = `T-VAAS: ELA ${tempStudent.tvaasElaScore || 0}%, Math ${tempStudent.tvaasMathScore || 0}%, Sci ${tempStudent.tvaasSciScore || 0}%, SS ${tempStudent.tvaasSSTScore || 0}%`;
    } else if (inst === "Woodcock-Johnson") {
      summaryText = `WJ: Reading ${tempStudent.wjReadingScore || 0}%, Lang ${tempStudent.wjLangScore || 0}%, Math ${tempStudent.wjMathScore || 0}%, Know ${tempStudent.wjKnowledgeScore || 0}%, Apps ${tempStudent.wjAppsScore || 0}%`;
    } else {
      summaryText = `TN Sup: Score ${tempStudent.tnSupScore || 0}`;
    }

    const newMatrix = { ...student.matrix };
    newMatrix.performance = {
      instrument: inst,
      score: summaryText,
      points
    };

    updateScreening(student.id, {
      ...updatedFields,
      matrix: newMatrix
    });
  };

  const handleAutofillTvaasDates = (student) => {
    const firstDate = student.tvaasElaDate || "";
    handleSubScoreChange(student, {
      tvaasMathDate: firstDate,
      tvaasSciDate: firstDate,
      tvaasSSDate: firstDate
    });
  };

  const handleAutofillWjDates = (student) => {
    const firstDate = student.wjReadingDate || "";
    handleSubScoreChange(student, {
      wjLangDate: firstDate,
      wjMathDate: firstDate,
      wjKnowledgeDate: firstDate,
      wjAppsDate: firstDate
    });
  };

  const calculateCreativityPoints = (rawInst, valStr) => {
    const val = parseFloat(valStr) || 0;
    let inst = rawInst || "TnTOC";
    if (inst === "TN TOL") inst = "TnTOC";
    if (inst === "TN TOL Plus") inst = "TnTOC+";
    if (inst === "TN Create") inst = "TnCreat";
    if (inst === "Torrance") inst = "TTCT";

    if (inst === "TTCT") {
      if (val >= 94) return 30;
      if (val >= 90) return 20;
      if (val >= 84) return 10;
    } else if (inst === "TnTOC") {
      if (val >= 22) return 30;
      if (val >= 19) return 20;
      if (val >= 16) return 10;
    } else if (inst === "TnTOC+") {
      if (val >= 29) return 30;
      if (val >= 25) return 20;
      if (val >= 21) return 10;
    } else if (inst === "TnCreat") {
      if (val >= 50) return 30;
      if (val >= 45) return 20;
      if (val >= 40) return 10;
    }
    return 0;
  };

  const handleCreativityScoreChange = (student, updatedFields) => {
    const tempStudent = { ...student, ...updatedFields };
    const inst = tempStudent.creativityInstrument || "TnTOC";
    const scoreVal = tempStudent.matrix?.creativity?.score !== undefined ? tempStudent.matrix.creativity.score : "";
    const updatedScore = updatedFields.creativityScore !== undefined ? updatedFields.creativityScore : scoreVal;

    const points = calculateCreativityPoints(inst, updatedScore);

    const newMatrix = { ...student.matrix };
    newMatrix.creativity = {
      instrument: inst,
      score: updatedScore,
      points
    };

    updateScreening(student.id, {
      ...updatedFields,
      matrix: newMatrix
    });
  };

  const handleNudgeForStudent = (student) => {
    if (!student) return;
    const email = store.getState().workEmail || "ariel.facilitator@rcschools.net";
    
    const subject = encodeURIComponent(`[Aegis Gifted Checklist] Traits needed for ${student.name}`);
    const body = encodeURIComponent(
      `Dear ${student.classroomTeacher},\n\n` +
      `I hope you are doing well! As the Gifted Facilitator, I am currently conducting an initial screening evaluation for ${student.name} under our Tennessee 60-calendar-day timeline.\n\n` +
      `To complete our state-mandated TN K-12 Assessment Scoring Grid, I need your classroom behavior traits checklist (SIGS/Renzulli rating scale points).\n\n` +
      `Could you please complete the characteristics checklist for ${student.name} as soon as you have a moment (due within 2 school weeks)? Or reply to this email with your observations?\n\n` +
      `Thank you so much for your support and partnership!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    updateScreening(student.id, { nudgeSent: true });
  };

  const handleNudge = () => {
    handleNudgeForStudent(activeScreening);
  };

  const advanceStatusForStudent = (student, newStatus) => {
    if (!student) return;
    updateScreening(student.id, { status: newStatus });
    const nextIdx = phases.indexOf(newStatus);
    if (nextIdx !== -1) {
      setSelectedStepIndexByStudent(prev => ({ ...prev, [student.id]: nextIdx }));
    }
  };

  const advanceStatus = (newStatus) => {
    advanceStatusForStudent(activeScreening, newStatus);
  };

  const handleArchiveCaseForStudent = (student) => {
    if (!student) return;
    if (student.status === "Pending Discontinuation") {
      if (!student.discontinuationPWNMailDate || !student.discontinuationCumeFileDate) {
        alert("Please complete all discontinuation checklist tasks (PWN mailed and cume filed) before archiving.");
        return;
      }
    }
    const name = student.name;
    
    if (activeScreening && activeScreening.id === student.id) {
      setSelectedScreenId("");
    }
    
    store.removeScreening(student.id);
    alert(`Screening case for ${name} has been closed and archived.`);
  };

  const handleArchiveCase = () => {
    handleArchiveCaseForStudent(activeScreening);
  };

  const handleInformedConsentEmailForStudent = (student) => {
    if (!student) return;
    const performancePts = student.matrix?.performance?.points || 0;
    const creativityPts = student.matrix?.creativity?.points || 0;
    const screeningScore = performancePts + creativityPts;
    
    const subject = encodeURIComponent(`[Aegis Gifted Tracker] Informed Consent Disclosures for ${student.name}`);
    const body = encodeURIComponent(
      `Dear Parent,\n\n` +
      `As the Gifted Facilitator at Blackman Middle School, I am writing to share the results of ${student.name}'s initial gifted screening and explain the next steps in our evaluation process.\n\n` +
      `${student.name} has passed our initial academic and characteristics screening by earning ${screeningScore} points on our assessment grid.\n\n` +
      `The next step is to proceed to a full psychological evaluation with our School Psychologist, who will administer an IQ test. To qualify for gifted services in Tennessee, a student must meet the following criteria:\n` +
      `1. Score a minimum of 50 points total on the assessment scoring grid.\n` +
      `2. Obtain an IQ score of 123 or higher.\n` +
      `3. Obtain positive points in all three categories (Cognitive, Achievement, and Creativity).\n\n` +
      `I would love to have a brief phone call to discuss this and answer any questions you may have. Please let me know a few dates and times that work best for you. If you do not feel you need a call and are content to move forward, please let me know that as well.\n\n` +
      `Once we align, I will send home the formal 'Permission to Test' and 'Permission to Email Legal Documents' forms for your signature.\n\n` +
      `Thank you so much for your partnership!\n\n` +
      `Best regards,\n` +
      `Ariel\n` +
      `Gifted Facilitator\n` +
      `Blackman Middle School`
    );
    window.location.href = `mailto:parent@email.com?subject=${subject}&body=${body}`;
  };

  const handleInformedConsentEmail = () => {
    handleInformedConsentEmailForStudent(activeScreening);
  };

  const getStudentScores = (student) => {
    if (!student) return { cognitionPts: 0, performancePts: 0, creativityPts: 0, screeningScore: 0, totalPoints: 0 };
    const cognitionPts = student.matrix?.cognition?.points || 0;
    const performancePts = student.matrix?.performance?.points || 0;
    const creativityPts = student.matrix?.creativity?.points || 0;
    const screeningScore = performancePts + creativityPts;
    const totalPoints = cognitionPts + performancePts + creativityPts;
    return { cognitionPts, performancePts, creativityPts, screeningScore, totalPoints };
  };

  const { cognitionPts, performancePts, creativityPts, screeningScore, totalPoints } = getStudentScores(activeScreening);

  const renderStepContent = (student, stepIndex) => {
    if (!student) return null;
    const { cognitionPts, performancePts, creativityPts, screeningScore, totalPoints } = getStudentScores(student);
    const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;

    const isMeetingDayWarningCheck = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr + "T12:00:00");
      const day = date.getDay();
      return day !== 1 && day !== 4; // Monday = 1, Thursday = 4
    };

    const getMeetingNoticeDaysCheck = (s) => {
      if (!s?.meetingDate || !s?.meetingInvitationSentDate) return null;
      const meet = new Date(s.meetingDate + "T00:00:00");
      const invite = new Date(s.meetingInvitationSentDate + "T00:00:00");
      const diff = meet.getTime() - invite.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };
    const noticeDaysCheck = getMeetingNoticeDaysCheck(student);

    switch (stepIndex) {
      case 0:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
              Ariel must inspect the physical student cumulative folder to look for testing lockouts or historical context:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.surveyPriorTestingCheck || false}
                  onChange={(e) => updateScreening(student.id, { surveyPriorTestingCheck: e.target.checked })}
                />
                <span>Double check student has not been tested for Gifted Services recently (TN re-testing lockout rule).</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.surveyEslCheck || false}
                  onChange={(e) => updateScreening(student.id, { surveyEslCheck: e.target.checked })}
                />
                <span>Check English as a Second Language (ESL) status logs.</span>
              </label>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.surveyDcsCheck || false}
                  onChange={(e) => updateScreening(student.id, { surveyDcsCheck: e.target.checked })}
                />
                <span>Identify DCS involvement, chronic attendance issues, or trauma records that nullify low test scores.</span>
              </label>
            </div>
            <button 
              className="btn btn-primary"
              disabled={!student.surveyPriorTestingCheck}
              onClick={() => {
                updateScreening(student.id, { quickSurveyCompleted: true, status: "Consent Pending" });
                setSelectedStepIndexByStudent(prev => ({ ...prev, [student.id]: 1 }));
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Proceed to Send Parent Consent Paperwork
              <ArrowRight size={14} />
            </button>
          </div>
        );

      case 1:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px" }}>
            <div className="form-row">
              <div className="form-group">
                <label>Date Screening Packet Sent Home</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.parentPaperworkSentDate || ""}
                  onChange={(e) => updateScreening(student.id, { parentPaperworkSentDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Consent to Screen SIGNED & Received Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.consentReceivedDate || ""}
                  onChange={(e) => handleConsentDateForStudent(student, e.target.value)}
                />
              </div>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px" }}>
              Entering the parental consent received date starts the mandatory <strong>Tennessee 60-Calendar-Day Initial Evaluation Deadline</strong>.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
              <span>Consent Date: <strong>{student.consentReceivedDate}</strong></span>
              <span style={{ color: "var(--accent-rose)", fontWeight: "700" }}>
                60-Day Deadline: {addDays(student.consentReceivedDate, deadlines.screeningEvaluation)} ({getDaysRemaining(addDays(student.consentReceivedDate, deadlines.screeningEvaluation))} days remaining)
              </span>
            </div>

            <div style={{ border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Classroom Teacher Input Checklist</h4>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                General education checklist (SIGS/Renzulli behavior rating) is due in <strong>{deadlines.screeningTeacherChecklist} school days</strong> from consent.
                Checklist deadline: <strong>{addSchoolDays(student.consentReceivedDate, deadlines.screeningTeacherChecklist)}</strong>.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <label style={{ display: "inline-flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  <input 
                    type="checkbox"
                    checked={student.teacherChecklistSigned || false}
                    onChange={(e) => updateScreening(student.id, { teacherChecklistSigned: e.target.checked })}
                  />
                  <span>checklist Received & Signed</span>
                </label>
                <button 
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => handleNudgeForStudent(student)}
                  disabled={student.nudgeSent}
                >
                  <Send size={11} />
                  {student.nudgeSent ? "Checklist Nudge Sent" : `Email Nudge to ${student.classroomTeacher}`}
                </button>
              </div>
            </div>

            <div className="scoring-grid-container">
              <div className="score-card" style={{ border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>1. Educational Performance (Academics)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="form-group">
                    <label>Assessment Instrument</label>
                    <select 
                      className="select-field"
                      value={student.academicInstrument || "T-VAAS"}
                      onChange={(e) => updateScreening(student.id, { academicInstrument: e.target.value })}
                    >
                      <option value="T-VAAS">T-VAAS Benchmark</option>
                      <option value="Woodcock-Johnson">Woodcock-Johnson (Direct)</option>
                      <option value="TN Supplementary Gifted Checklist">TN Supplementary Gifted Checklist</option>
                    </select>
                  </div>
                  {/* T-VAAS Sub-Scores */}
                  {(student.academicInstrument || "T-VAAS") === "T-VAAS" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>T-VAAS Sub-Test</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>ELA %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.tvaasElaScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasElaScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>ELA Date</label>
                          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="MM/DD/YY" 
                              value={student.tvaasElaDate || ""} 
                              onChange={(e) => handleSubScoreChange(student, { tvaasElaDate: e.target.value })} 
                              style={{ paddingRight: "60px", width: "100%" }}
                            />
                            <button 
                              className="btn btn-secondary" 
                              style={{ 
                                position: "absolute", 
                                right: "2px", 
                                top: "2px", 
                                bottom: "2px", 
                                padding: "0 6px", 
                                fontSize: "9px", 
                                height: "calc(100% - 4px)", 
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer"
                              }} 
                              onClick={() => handleAutofillTvaasDates(student)}
                              title="Autofill all dates with ELA Date"
                              type="button"
                            >
                              ⬇ Fill
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Math %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.tvaasMathScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasMathScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Math Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.tvaasMathDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasMathDate: e.target.value })} 
                            tabIndex={student.tvaasMathDate ? -1 : 0}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Science %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.tvaasSciScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasSciScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Sci Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.tvaasSciDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasSciDate: e.target.value })} 
                            tabIndex={student.tvaasSciDate ? -1 : 0}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Social Studies %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.tvaasSSTScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasSSTScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>SS Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.tvaasSSDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tvaasSSDate: e.target.value })} 
                            tabIndex={student.tvaasSSDate ? -1 : 0}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {student.academicInstrument === "Woodcock-Johnson" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>WJ Sub-Test</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Reading %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.wjReadingScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjReadingScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Reading Date</label>
                          <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="MM/DD/YY" 
                              value={student.wjReadingDate || ""} 
                              onChange={(e) => handleSubScoreChange(student, { wjReadingDate: e.target.value })} 
                              style={{ paddingRight: "60px", width: "100%" }}
                            />
                            <button 
                              className="btn btn-secondary" 
                              style={{ 
                                position: "absolute", 
                                right: "2px", 
                                top: "2px", 
                                bottom: "2px", 
                                padding: "0 6px", 
                                fontSize: "9px", 
                                height: "calc(100% - 4px)", 
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer"
                              }} 
                              onClick={() => handleAutofillWjDates(student)}
                              title="Autofill all dates with Reading Date"
                              type="button"
                            >
                              ⬇ Fill
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Written Exp %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.wjLangScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjLangScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Lang Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.wjLangDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjLangDate: e.target.value })} 
                            tabIndex={student.wjLangDate ? -1 : 0}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Math %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.wjMathScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjMathScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Math Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.wjMathDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjMathDate: e.target.value })} 
                            tabIndex={student.wjMathDate ? -1 : 0}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Academic Knowledge</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.wjKnowledgeScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjKnowledgeScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Knowledge Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.wjKnowledgeDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjKnowledgeDate: e.target.value })} 
                            tabIndex={student.wjKnowledgeDate ? -1 : 0}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Academic Apps</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 95" 
                            value={student.wjAppsScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjAppsScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Apps Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.wjAppsDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { wjAppsDate: e.target.value })} 
                            tabIndex={student.wjAppsDate ? -1 : 0}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TN Supplementary Gifted Checklist Sub-Scores */}
                  {student.academicInstrument === "TN Supplementary Gifted Checklist" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>TN Supplementary Checklist</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Checklist Score (0-12) or %ile</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder="e.g. 7" 
                            value={student.tnSupScore || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tnSupScore: e.target.value })} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Test Date</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="MM/DD/YY" 
                            value={student.tnSupDate || ""} 
                            onChange={(e) => handleSubScoreChange(student, { tnSupDate: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>TN Matrix Rubric Points:</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: performancePts >= 10 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {performancePts} Pts
                    </span>
                  </div>
                  {performancePts < 10 && student.matrix?.performance?.score !== "" && (
                    <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600" }}>
                      🚨 Needs &ge; 10 points to proceed legally.
                    </p>
                  )}
                </div>
              </div>

              <div className="score-card" style={{ border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px" }}>2. Creativity / Characteristics</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="form-group">
                    <label>Creativity Assessment</label>
                    <select 
                      className="select-field"
                      value={student.creativityInstrument || "TnTOC"}
                      onChange={(e) => handleCreativityScoreChange(student, { creativityInstrument: e.target.value })}
                    >
                      <option value="TTCT">Torrance Test of Creativity (TTCT)</option>
                      <option value="TnTOC">TnTOC Checklist</option>
                      <option value="TnTOC+">TnTOC+ Checklist (with Parent Input)</option>
                      <option value="TnCreat">TnCreat (Raw score)</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Assessment Score</label>
                      <input 
                        type="number"
                        className="input-field"
                        placeholder={
                          student.creativityInstrument === "TTCT" ? "e.g. 95" : 
                          student.creativityInstrument === "TnCreat" ? "e.g. 45" : 
                          "e.g. 18"
                        }
                        value={student.matrix?.creativity?.score || ""}
                        onChange={(e) => handleCreativityScoreChange(student, { creativityScore: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Test Date</label>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="MM/DD/YY"
                        value={student.creativityDate || ""}
                        onChange={(e) => handleCreativityScoreChange(student, { creativityDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>TN Matrix Rubric Points:</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: creativityPts >= 10 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {creativityPts} Pts
                    </span>
                  </div>
                  {(student.creativityInstrument === "TnTOC" || student.creativityInstrument === "TN TOL") && creativityPts < 10 && student.matrix?.creativity?.score !== "" && (
                    <p style={{ fontSize: "10px", color: "var(--accent-amber)", fontWeight: "600", margin: 0 }}>
                      ℹ TnTOC &lt; 10. Switch to <strong>TnTOC+</strong> to include parent survey.
                    </p>
                  )}
                  {(student.creativityInstrument === "TnTOC+" || student.creativityInstrument === "TN TOL Plus") && creativityPts < 10 && student.matrix?.creativity?.score !== "" && (
                    <p style={{ fontSize: "10px", color: "var(--accent-amber)", fontWeight: "600", margin: 0 }}>
                      ℹ TnTOC+ &lt; 10. Administer <strong>TnCreat</strong> or <strong>TTCT (Torrance)</strong>.
                    </p>
                  )}
                  {(student.creativityInstrument === "TnCreat" || student.creativityInstrument === "TN Create") && (
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>
                      Requires <strong>40-44</strong> raw for 10pts, <strong>45-49</strong> for 20pts, <strong>50+</strong> for 30pts.
                    </p>
                  )}
                  {(student.creativityInstrument === "TTCT" || student.creativityInstrument === "Torrance") && (
                    <div style={{ padding: "6px", backgroundColor: "var(--accent-rose-light)", borderRadius: "4px", fontSize: "10px", color: "var(--accent-rose)", fontWeight: "600", margin: 0 }}>
                      ⚠️ TTCT requires <strong>84-89%ile</strong> for 10pts, <strong>90-93%ile</strong> for 20pts, <strong>94+%ile</strong> for 30pts. Sent to county (grading lag applies).
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Screening Combined Points</span>
                <h3 style={{ fontSize: "20px", color: "var(--text-heading)", marginTop: "2px" }}>{screeningScore} / 50 Pts</h3>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Minimum 20 points required to pass screening to psychologist phase.</p>
              </div>
              <div>
                {screeningScore >= 20 && performancePts >= 10 && creativityPts >= 10 ? (
                  <button 
                    className="btn btn-primary"
                    style={{ backgroundColor: "var(--accent-emerald)" }}
                    onClick={() => advanceStatusForStudent(student, "Informed Consent")}
                  >
                    Pass to Informed Consent
                  </button>
                ) : (
                  <button 
                    className="btn btn-secondary"
                    style={{ color: "var(--accent-rose)" }}
                    onClick={() => advanceStatusForStudent(student, "Pending Discontinuation")}
                  >
                    Fail & Discontinue Case
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
              Ariel must speak with parents (via call or email confirmation) to explain the 50-point rubric qualification criteria and the 123 IQ threshold.
            </p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button 
                className="btn btn-secondary"
                onClick={() => handleInformedConsentEmailForStudent(student)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Send size={12} />
                Email Disclosures to Parent
              </button>
            </div>
            <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", marginBottom: "20px" }}>
              <input 
                type="checkbox"
                checked={student.informedConsentCompleted || false}
                onChange={(e) => updateScreening(student.id, { informedConsentCompleted: e.target.checked })}
              />
              <strong>Informed Consent Call Completed & Logged</strong>
            </label>
            <button 
              className="btn btn-primary"
              disabled={!student.informedConsentCompleted}
              onClick={() => advanceStatusForStudent(student, "Permission to Test Pending")}
            >
              Send Permission to Test Letter
            </button>
          </div>
        );

      case 4:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
              Ariel must obtain the formal parent <strong>Permission to Test</strong> and <strong>Permission to Email Legal Documents</strong>.
            </p>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "var(--text-heading)" }}>
                <input 
                  type="checkbox"
                  checked={student.permissionToEmailReceived || false}
                  onChange={(e) => updateScreening(student.id, { permissionToEmailReceived: e.target.checked })}
                />
                <span>Permission to Email Legal Documents Signed & Received</span>
              </label>
            </div>

            <div className="form-row" style={{ alignItems: "center" }}>
              <div className="form-group">
                <label>Permission to Test Signed & Received Date</label>
                <input 
                  type="date"
                  className="input-field"
                  disabled={!student.permissionToEmailReceived}
                  value={student.permissionToTestReceivedDate || ""}
                  onChange={(e) => handleBatonPassForStudent(student, e.target.value)}
                />
                {!student.permissionToEmailReceived && (
                  <p style={{ fontSize: "11px", color: "var(--accent-rose)", marginTop: "4px", fontWeight: "600" }}>
                    ⚠️ You must check off the Permission to Email Legal Documents form before logging test permission.
                  </p>
                )}
              </div>
              {student.permissionToTestReceivedDate && (
                <div style={{ padding: "12px", borderRadius: "6px", backgroundColor: "var(--accent-emerald-light)", color: "var(--accent-emerald)", fontSize: "12px", fontWeight: "600" }}>
                  ✔ Baton Passed! Scanned & sent to School psychologist today.
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
              <span>Baton Pass Date: <strong>{student.permissionToTestReceivedDate}</strong></span>
              <span style={{ color: "var(--accent-rose)", fontWeight: "700" }}>
                psychologist 60-Day Deadline: {addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychEvaluation)} ({getDaysRemaining(addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychEvaluation))} days remaining)
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>psychologist Full Scale IQ Score</label>
                <input 
                  type="number"
                  className="input-field"
                  placeholder="e.g. 125"
                  value={student.psychIqScore || ""}
                  onChange={(e) => updateScreening(student.id, { psychIqScore: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>IQ Matrix Points (0 - 30)</label>
                <select 
                  className="select-field"
                  value={student.psychPoints || 0}
                  onChange={(e) => {
                    const pts = parseInt(e.target.value, 10);
                    const newMatrix = { ...student.matrix };
                    newMatrix.cognition = { instrument: "WISC-V Full Scale IQ", score: student.psychIqScore, points: pts };
                    updateScreening(student.id, { psychPoints: pts, matrix: newMatrix });
                  }}
                >
                  <option value="0">0 Points</option>
                  <option value="10">10 Points (IQ 123-125)</option>
                  <option value="15">15 Points (IQ 126-127)</option>
                  <option value="20">20 Points (IQ 128-129)</option>
                  <option value="25">25 Points (IQ 130-131)</option>
                  <option value="30">30 Points (IQ 132+)</option>
                </select>
              </div>
            </div>

            <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={student.psychResultsReceived || false}
                onChange={(e) => updateScreening(student.id, { psychResultsReceived: e.target.checked })}
              />
              <strong>Psychological Results Received from School Psychologist</strong>
            </label>

            {student.psychResultsReceived && (
              <button 
                className="btn btn-primary"
                onClick={() => advanceStatusForStudent(student, "Meeting Scheduled")}
              >
                Go to Schedule Placement Meeting
              </button>
            )}
          </div>
        );

      case 6:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Meeting Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.meetingDate || ""}
                  onChange={(e) => updateScreening(student.id, { meetingDate: e.target.value })}
                />
                {isMeetingDayWarningCheck(student.meetingDate) && (
                  <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                    ⚠️ Warning: School psychologist only available Mondays & Thursdays.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Invitation Sent Date</label>
                <input 
                  type="date"
                  className="input-field"
                  value={student.meetingInvitationSentDate || ""}
                  onChange={(e) => updateScreening(student.id, { meetingInvitationSentDate: e.target.value })}
                />
                {noticeDaysCheck !== null && noticeDaysCheck < 10 && !student.meetingNoticeWaived && (
                  <p style={{ fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", marginTop: "4px" }}>
                    🚨 Notice is less than 10 calendar days ({noticeDaysCheck} days). Waiver required!
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.meetingNoticeWaived || false}
                  onChange={(e) => updateScreening(student.id, { meetingNoticeWaived: e.target.checked })}
                />
                <strong>Parent Waived 10-day Meeting Notice Right</strong>
              </label>
            </div>

            <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Final Eligibility Scoring Audit</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px", marginBottom: "12px" }}>
                <div>IQ Score: <strong>{student.psychIqScore}</strong> ({cognitionPts} pts)</div>
                <div>Achievement: <strong style={{ fontSize: (typeof student.matrix?.performance?.score === "string" && student.matrix?.performance?.score.includes(":") ? "10px" : "inherit") }}>{student.matrix?.performance?.score}{typeof student.matrix?.performance?.score === "number" || (!isNaN(student.matrix?.performance?.score) && student.matrix?.performance?.score !== "") ? "%ile" : ""}</strong> ({performancePts} pts)</div>
                <div>Creativity: <strong>{student.matrix?.creativity?.score}</strong> ({creativityPts} pts)</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Matrix Points:</span>
                  <h3 style={{ fontSize: "22px", color: totalPoints >= 50 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                    {totalPoints} / 90 Pts
                  </h3>
                </div>
                {totalPoints >= 50 && cognitionPts > 0 && performancePts > 0 && creativityPts > 0 && student.psychIqScore >= 123 ? (
                  <button 
                    className="btn btn-primary"
                    style={{ backgroundColor: "var(--accent-emerald)" }}
                    onClick={() => handleFinalizePlacementForStudent(student)}
                  >
                    ✔ Finalize Placement (Add to Active Directory)
                  </button>
                ) : (
                  <button 
                    className="btn btn-secondary"
                    style={{ color: "var(--accent-rose)" }}
                    onClick={() => advanceStatusForStudent(student, "Pending Discontinuation")}
                  >
                    Child Did Not Qualify - Close & Discontinue
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="workflow-step-body" style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "16px" }}>
              This student failed to qualify for Gifted Services or parental consent was revoked. Ariel must complete administrative clear-downs:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.discontinuationPWNMailDate || false}
                  onChange={(e) => updateScreening(student.id, { discontinuationPWNMailDate: e.target.checked })}
                />
                <strong>Mailed Rejection Letter & Prior Written Notice (PWN) explaining qualifications.</strong>
              </label>
              <label className="checkbox-label" style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={student.discontinuationCumeFileDate || false}
                  onChange={(e) => updateScreening(student.id, { discontinuationCumeFileDate: e.target.checked })}
                />
                <strong>Returned all screening paperwork physically to the student's cumulative folder in the main office.</strong>
              </label>
            </div>
            <button 
              className="btn btn-primary"
              style={{ backgroundColor: "var(--accent-rose)", width: "100%" }}
              disabled={!student.discontinuationPWNMailDate || !student.discontinuationCumeFileDate}
              onClick={() => handleArchiveCaseForStudent(student)}
            >
              Confirm Archive & Remove Student from Caseload
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Tennessee mandate checklist rules for final active placement:
  // 1. Total score >= 50
  // 2. Score in at least the "First range" (points > 0) on Cognition
  // 3. Score in at least the "First range" (points > 0) on Educational Performance
  // 4. Points are scored on Creativity
  const isEligibleForPlacement = totalPoints >= 50 && cognitionPts > 0 && performancePts > 0 && creativityPts > 0 && activeScreening?.psychResultsReceived;

  // Phase index calculator
  
  const currentPhaseIndex = activeScreening ? phases.indexOf(activeScreening.status) : -1;

  // Meeting date day checks (Psychologist available Monday/Thursday only)
  const isMeetingDayWarning = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const day = date.getDay();
    return day !== 1 && day !== 4; // Monday = 1, Thursday = 4
  };

  // Meeting invitation notice checks
  const getMeetingNoticeDays = () => {
    if (!activeScreening?.meetingDate || !activeScreening?.meetingInvitationSentDate) return null;
const meet = new Date(activeScreening.meetingDate + "T00:00:00");
    const invite = new Date(activeScreening.meetingInvitationSentDate + "T00:00:00");
    const diff = meet.getTime() - invite.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const noticeDays = getMeetingNoticeDays();

  return (
    <div>
      {/* Header View Toggle / Action Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Glass segmented control for View Mode */}
          <div className="glass-panel" style={{ display: "flex", padding: "4px", gap: "4px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <button 
              className={`btn ${viewMode === "timeline" ? "btn-primary" : "btn-secondary"}`} 
              onClick={() => setViewMode("timeline")}
              style={{ padding: "6px 12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", border: "none" }}
            >
              <LayoutGrid size={14} />
              Caseload Timelines
            </button>
            <button 
              className={`btn ${viewMode === "focus" ? "btn-primary" : "btn-secondary"}`} 
              onClick={() => setViewMode("focus")}
              style={{ padding: "6px 12px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", border: "none" }}
            >
              <List size={14} />
              Individual Focus View
            </button>
          </div>

          {/* Student Selector - Only show in Focus View */}
          {viewMode === "focus" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "13px", fontWeight: "700" }}>Select Student:</label>
              <select 
                className="select-field" 
                value={selectedScreenId} 
                onChange={(e) => {
                  setSelectedScreenId(e.target.value);
                  store.updateState({ selectedScreeningId: e.target.value });
                }}
                style={{ minWidth: "200px" }}
              >
                {screenings.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                ))}
                {screenings.length === 0 && <option value="">No Active Screenings</option>}
              </select>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddReferral(!showAddReferral)}>
          <Plus size={16} />
          {showAddReferral ? "View Caseload Grid" : "Log Initial Referral"}
        </button>
      </div>

      {/* Add Referral Form */}
      {showAddReferral && (
        <div className="glass-panel" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={20} color="var(--accent-purple)" />
            Add Gifted Screening Referral
          </h3>
          <form onSubmit={handleAddReferral}>
            <div className="form-row">
              <div className="form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Sarah Jenkins"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Grade Level</label>
                <select className="select-field" value={refGrade} onChange={(e) => setRefGrade(e.target.value)}>
                  <option value="6th">6th Grade</option>
                  <option value="7th">7th Grade</option>
                  <option value="8th">8th Grade</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Classroom Core Referral Teacher</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Mr. Thompson"
                style={{ width: "100%" }}
                value={refTeacher}
                onChange={(e) => {
                  setRefTeacher(e.target.value);
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddReferral(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Start Screening Pipeline</button>
            </div>
          </form>
        </div>
      )}

      {/* Rendering Modes */}
      {viewMode === "timeline" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {screenings.map(student => {
            const isExpanded = expandedStudentId === student.id;
            const currentStageIndex = phases.indexOf(student.status);
            const deadlines = store.getState().deadlines || DEFAULT_DEADLINES;
            
            const getStageDueDate = (idx, raw = false) => {
              const refDate = student.referralDate || new Date().toISOString().split("T")[0];
              let val = "";
              switch (idx) {
                case 0:
                  val = addSchoolDays(refDate, deadlines.screeningQuickSurvey);
                  break;
                case 1:
                  val = addDays(refDate, deadlines.screeningConsentPending);
                  break;
                case 2:
                  val = student.consentReceivedDate ? addDays(student.consentReceivedDate, deadlines.screeningEvaluation) : "TBD";
                  break;
                case 3:
                  val = student.consentReceivedDate ? addDays(student.consentReceivedDate, deadlines.screeningEvaluation + deadlines.screeningInformedConsent) : "TBD";
                  break;
                case 4:
                  val = student.consentReceivedDate ? addDays(student.consentReceivedDate, deadlines.screeningEvaluation + deadlines.screeningInformedConsent + deadlines.screeningPermissionToTest) : "TBD";
                  break;
                case 5:
                  val = student.permissionToTestReceivedDate ? addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychEvaluation) : "TBD";
                  break;
                case 6:
                  val = student.meetingDate || "TBD";
                  break;
                default:
                  val = "";
              }
              return raw ? val : formatDate(val);
            };

            // Stages of the screening stepper
            const timelineStages = [
              { label: "Quick Survey", status: "Quick Survey" },
              { label: "Consent Pending", status: "Consent Pending" },
              { label: "Evaluation", status: "Evaluation in Progress" },
              { label: "Informed Consent", status: "Informed Consent" },
              { label: "Psych Consent", status: "Permission to Test Pending" },
              { label: "Psych Evaluation", status: "Psych Results Pending" },
              { label: "Eligibility Meeting", status: "Meeting Scheduled" }
            ];

            // Calculate progress percentage
            let progressPercent = 0;
            if (student.status !== "Pending Discontinuation") {
              const activeIndex = timelineStages.findIndex(s => s.status === student.status);
              if (activeIndex >= 0) {
                progressPercent = (activeIndex / (timelineStages.length - 1)) * 100;
              }
            } else {
              progressPercent = 100; // Red/warning status
            }

            // Get selected step index in panel
            const selectedStep = selectedStepIndexByStudent[student.id] ?? (student.status === "Pending Discontinuation" ? 7 : currentStageIndex);

            return (
              <div 
                key={student.id} 
                className="timeline-card-glass" 
                style={{ 
                  borderLeft: student.status === "Pending Discontinuation" 
                    ? "6px solid var(--accent-rose)" 
                    : "6px solid var(--accent-purple)"
                }}
              >
                {/* Card Header */}
                <div className="timeline-card-header">
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      {student.name}
                      <span className={`badge ${student.status === "Pending Discontinuation" ? "badge-rose" : "badge-purple"}`} style={{ fontSize: "11px" }}>
                        {student.status}
                      </span>
                    </h3>
                    <div className="timeline-student-meta">
                      <span>Grade: <strong>{student.grade}</strong></span>
                      <span>Teacher: <strong>{student.classroomTeacher}</strong></span>
                      <span>School: <strong>{student.school}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {student.status !== "Pending Discontinuation" && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ color: "var(--accent-rose)", padding: "4px 8px", fontSize: "11px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          advanceStatusForStudent(student, "Pending Discontinuation");
                        }}
                      >
                        Discontinue
                      </button>
                    )}
                    <button 
                      className="timeline-card-expand-btn"
                      onClick={() => {
                        setExpandedStudentId(isExpanded ? null : student.id);
                        if (!isExpanded) {
                          setSelectedStepIndexByStudent(prev => ({
                            ...prev,
                            [student.id]: student.status === "Pending Discontinuation" ? 7 : currentStageIndex
                          }));
                        }
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{isExpanded ? "Collapse" : "Open Step"}</span>
                    </button>
                  </div>
                </div>

                {/* Card Body - Horizontal Stepper */}
                {student.status === "Pending Discontinuation" ? (
                  <div style={{ padding: "12px 16px", background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "8px", marginTop: "12px", fontSize: "13px", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} />
                    <span>Evaluation Discontinued. Please click "Open Step" to complete rejection and cumulative file filing.</span>
                  </div>
                ) : (
                  <div className="pizza-tracker-wrapper">
                    <div className="pizza-tracker-container">
                      <div className="pizza-tracker-line-bg" />
                      <div 
                        className="pizza-tracker-line-progress" 
                        style={{ width: `calc(${progressPercent}% - 0px)` }}
                      />
                      
                      {timelineStages.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isActive = idx === currentStageIndex;
                        
                        // Compute step warning status
                        let isWarning = false;
                        if (isActive) {
                          if (student.status === "Evaluation in Progress" && student.consentReceivedDate) {
                            const daysLeft = getDaysRemaining(addDays(student.consentReceivedDate, deadlines.screeningEvaluation));
                            const teacherDaysLeft = student.teacherChecklistSigned ? 99 : getDaysRemaining(addSchoolDays(student.consentReceivedDate, deadlines.screeningTeacherChecklist));
                            if (daysLeft <= 15 || teacherDaysLeft <= 0) isWarning = true;
                          } else if (student.status === "Psych Results Pending" && student.permissionToTestReceivedDate) {
                            const daysLeft = getDaysRemaining(addDays(student.permissionToTestReceivedDate, deadlines.screeningPsychEvaluation));
                            if (daysLeft <= 10) isWarning = true;
                          } else if (student.status === "Meeting Scheduled" && student.meetingDate) {
                            const isMeetingDayWarningCheck = (() => {
                              const date = new Date(student.meetingDate + "T12:00:00");
                              const day = date.getDay();
                              return day !== 1 && day !== 4;
                            })();
                            const noticeDaysCheck = (() => {
                              if (!student.meetingInvitationSentDate) return null;
                              const meet = new Date(student.meetingDate + "T00:00:00");
                              const invite = new Date(student.meetingInvitationSentDate + "T00:00:00");
                              const diff = meet.getTime() - invite.getTime();
                              return Math.ceil(diff / (1000 * 60 * 60 * 24));
                            })();
                            if (isMeetingDayWarningCheck || (noticeDaysCheck !== null && noticeDaysCheck < 10 && !student.meetingNoticeWaived)) {
                              isWarning = true;
                            }
                          }
                        }

                        let stepClass = "";
                        if (isWarning) stepClass = "warning";
                        else if (isActive) stepClass = "active";
                        else if (isCompleted) stepClass = "completed";

                        const rawDate = getStageDueDate(idx, true);
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
                            <div className="pizza-tracker-dot">
                              {isCompleted ? "✔" : idx + 1}
                            </div>
                            <span className="pizza-tracker-label">{stage.label}</span>
                            <span className={`pizza-tracker-date ${dateClass}`} style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              marginTop: "2px",
                              display: "block"
                            }}>{getStageDueDate(idx)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded Checklist details */}
                {isExpanded && (
                  <div className="timeline-card-body-expanded">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent-purple)" }}>
                        {student.status === "Pending Discontinuation" 
                          ? "Discontinuation Tasks" 
                          : `Workflow Step Details: ${timelineStages[selectedStep].label}`}
                      </h4>
                    </div>
                    {renderStepContent(student, selectedStep)}
                  </div>
                )}
              </div>
            );
          })}
          {screenings.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }} className="glass-panel">
              <p>No screening profiles loaded. Add a student using the "Log Initial Referral" form.</p>
            </div>
          )}
        </div>
      ) : (
        /* Focus View Rendering Mode */
        activeScreening ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Phase HUD status indicator */}
            <div className="glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Active Screening Phase</span>
                <h2 style={{ fontSize: "20px", color: "var(--accent-purple)", marginTop: "2px" }}>
                  {activeScreening.status}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {activeScreening.status !== "Pending Discontinuation" && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ color: "var(--accent-rose)", padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={() => advanceStatus("Pending Discontinuation")}
                  >
                    <Trash2 size={12} />
                    Discontinue Case
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Workflow Cards */}
            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 0 ? "active" : currentPhaseIndex > 0 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 0 ? "✔" : "1"}</span>
                <h3>Quick Survey (Cume File Check)</h3>
              </div>
              {currentPhaseIndex === 0 && renderStepContent(activeScreening, 0)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 1 ? "active" : currentPhaseIndex > 1 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 1 ? "✔" : "2"}</span>
                <h3>Parent Paperwork & Initial Consent</h3>
              </div>
              {currentPhaseIndex === 1 && renderStepContent(activeScreening, 1)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 2 ? "active" : currentPhaseIndex > 2 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 2 ? "✔" : "3"}</span>
                <h3>Academic & Creativity Testing Grid</h3>
              </div>
              {currentPhaseIndex === 2 && renderStepContent(activeScreening, 2)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 3 ? "active" : currentPhaseIndex > 3 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 3 ? "✔" : "4"}</span>
                <h3>Informed Consent (Phone Call)</h3>
              </div>
              {currentPhaseIndex === 3 && renderStepContent(activeScreening, 3)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 4 ? "active" : currentPhaseIndex > 4 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 4 ? "✔" : "5"}</span>
                <h3>Permission to Test (Baton Pass)</h3>
              </div>
              {currentPhaseIndex === 4 && renderStepContent(activeScreening, 4)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 5 ? "active" : currentPhaseIndex > 5 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 5 ? "✔" : "6"}</span>
                <h3>Psychologist Evaluation & Scoring</h3>
              </div>
              {currentPhaseIndex === 5 && renderStepContent(activeScreening, 5)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 6 ? "active" : currentPhaseIndex > 6 ? "completed" : "locked"}`}>
              <div className="workflow-step-header">
                <span className="step-num">{currentPhaseIndex > 6 ? "✔" : "7"}</span>
                <h3>Eligibility / Placement Meeting</h3>
              </div>
              {currentPhaseIndex === 6 && renderStepContent(activeScreening, 6)}
            </div>

            <div className={`glass-panel workflow-step-card ${currentPhaseIndex === 7 ? "active" : "locked"}`} style={{ border: activeScreening.status === "Pending Discontinuation" ? "1px solid var(--accent-rose)" : "" }}>
              <div className="workflow-step-header" style={{ color: activeScreening.status === "Pending Discontinuation" ? "var(--accent-rose)" : "" }}>
                <span className="step-num" style={{ backgroundColor: activeScreening.status === "Pending Discontinuation" ? "var(--accent-rose)" : "", color: "white" }}>{activeScreening.status === "Pending Discontinuation" ? "🚨" : "8"}</span>
                <h3>Pending Discontinuation Checklists</h3>
              </div>
              {currentPhaseIndex === 7 && renderStepContent(activeScreening, 7)}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }} className="glass-panel">
            <p>No screening profiles loaded. Add a student using the "Log Initial Referral" form.</p>
          </div>
        )
      )}
    </div>
  );
}
