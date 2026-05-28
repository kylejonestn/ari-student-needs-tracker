/* ==========================================
   Aegis Gifted Tracker - studentStore State Management
   ========================================== */

import { INITIAL_STUDENTS, INITIAL_SCREENINGS } from "./mockData";
import { driveService } from "./driveService";

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

// Add days to a date string and return YYYY-MM-DD
export const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

/**
 * Calculates Tennessee specific timelines
 */
export const calculateTimelines = (student, isScreening = false) => {
  const timelines = [];
  
  if (isScreening) {
    // 1. Initial Evaluation 60-Calendar-Day Timeline
    if (student.consentReceivedDate) {
      const targetDate = addDays(student.consentReceivedDate, 60);
      const daysLeft = getDaysRemaining(targetDate);
      
      let status = "on-track";
      if (daysLeft <= 0) status = "overdue";
      else if (daysLeft <= 15) status = "warning";
      
      timelines.push({
        type: "60-Day Evaluation",
        label: "Initial Evaluation Timeline",
        desc: "Comprehensive evaluation & eligibility determination",
        startDate: student.consentReceivedDate,
        dueDate: targetDate,
        daysRemaining: daysLeft,
        status,
        mandatory: true
      });
    }

    // 2. 48-Hour Report Draft Rule
    // In screenings, if eligibility meeting is scheduled (e.g. in student notes/metadata or we simulate one)
    // For Liam, let's assume we need to send the draft report.
    if (student.consentReceivedDate && !student.teacherChecklistSigned) {
      timelines.push({
        type: "Teacher Input Checklist",
        label: "Teacher Signature Needed",
        desc: `SIGS/Renzulli characteristics checklist from ${student.classroomTeacher}`,
        dueDate: addDays(student.consentReceivedDate, 40),
        daysRemaining: getDaysRemaining(addDays(student.consentReceivedDate, 40)),
        status: getDaysRemaining(addDays(student.consentReceivedDate, 40)) <= 5 ? "warning" : "on-track",
        mandatory: false,
        actionNeeded: "Nudge Teacher"
      });
    }
  } else {
    // Active Student Timelines
    
    // 3. Annual IEP Review (365 days)
    if (student.iepReviewDate) {
      const daysLeft = getDaysRemaining(student.iepReviewDate);
      let status = "on-track";
      if (daysLeft <= 0) status = "overdue";
      else if (daysLeft <= 30) status = "warning";
      
      timelines.push({
        type: "Annual IEP Review",
        label: "Annual IEP Review",
        desc: "Mandatory annual update of IEP goals and placement",
        dueDate: student.iepReviewDate,
        daysRemaining: daysLeft,
        status,
        mandatory: true
      });
    }

    // 4. Triennial Re-evaluation (3 years)
    if (student.reevalDueDate) {
      const daysLeft = getDaysRemaining(student.reevalDueDate);
      let status = "on-track";
      if (daysLeft <= 0) status = "overdue";
      else if (daysLeft <= 90) status = "warning";
      
      timelines.push({
        type: "Triennial Re-evaluation",
        label: "Triennial Re-eval",
        desc: "Three-year eligibility re-evaluation review",
        dueDate: student.reevalDueDate,
        daysRemaining: daysLeft,
        status,
        mandatory: true
      });
    }
  }
  
  return timelines;
};

// Global Store State Holder (Simple Pub/Sub)
class StudentStore {
  constructor() {
    this.listeners = [];
    this.debounceTimer = null;
    
    // Load config from localStorage
    const savedClientId = localStorage.getItem("aegis_client_id") || "";
    const savedTheme = localStorage.getItem("aegis_theme") || "light";
    const savedWorkEmail = localStorage.getItem("aegis_work_email") || "ariel.facilitator@rcschools.net";
    let savedTeacherEmails = {
      "Ms. Davis": "davis@rcschools.net",
      "Mrs. Harrison": "harrison@rcschools.net",
      "Mr. Thompson": "thompson@rcschools.net",
      "Mr. Adams": "adams@rcschools.net"
    };
    try {
      const parsed = JSON.parse(localStorage.getItem("aegis_teacher_emails"));
      if (parsed) savedTeacherEmails = parsed;
    } catch(e) {}
    
    // Load local cache if offline
    let cachedStudents = null;
    let cachedScreenings = null;
    try {
      cachedStudents = JSON.parse(localStorage.getItem("aegis_students"));
      cachedScreenings = JSON.parse(localStorage.getItem("aegis_screenings"));
    } catch (e) {
      console.error("Local cache load failed", e);
    }

    this.state = {
      theme: savedTheme,
      clientId: savedClientId,
      syncStatus: "disconnected", // 'disconnected', 'connecting', 'synced', 'saving', 'error'
      syncError: null,
      accessToken: null,
      tokenExpiry: null,
      allDataFileId: localStorage.getItem("aegis_all_data_fid") || null,
      parentPortalFileId: localStorage.getItem("aegis_parent_fid") || null,
      
      // Email parameters
      workEmail: savedWorkEmail,
      teacherEmails: savedTeacherEmails,

      // Data Arrays
      students: cachedStudents || INITIAL_STUDENTS,
      screenings: cachedScreenings || INITIAL_SCREENINGS,
      
      // UI State
      activeTab: "dashboard",
      isParentMode: false,
      flashingGreen: false
    };

    // Apply theme
    document.documentElement.setAttribute("data-theme", savedTheme);
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
    if (newState.theme) localStorage.setItem("aegis_theme", newState.theme);
    if (newState.clientId !== undefined) localStorage.setItem("aegis_client_id", newState.clientId);
    if (newState.allDataFileId) localStorage.setItem("aegis_all_data_fid", newState.allDataFileId);
    if (newState.parentPortalFileId) localStorage.setItem("aegis_parent_fid", newState.parentPortalFileId);
    if (newState.workEmail !== undefined) localStorage.setItem("aegis_work_email", newState.workEmail);
    if (newState.teacherEmails !== undefined) localStorage.setItem("aegis_teacher_emails", JSON.stringify(newState.teacherEmails));
    
    // Save database cache in localStorage for instant offline access
    localStorage.setItem("aegis_students", JSON.stringify(this.state.students));
    localStorage.setItem("aegis_screenings", JSON.stringify(this.state.screenings));
    
    this.emit();
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateState({ theme });
  }

  // Google OAuth Log In
  connectGoogleDrive() {
    if (!this.state.clientId) {
      this.updateState({ syncStatus: "error", syncError: "Please enter a valid Google Client ID in Settings first." });
      return;
    }

    this.updateState({ syncStatus: "connecting", syncError: null });

    driveService.requestAccessToken(
      this.state.clientId,
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
    this.updateState({
      accessToken: null,
      tokenExpiry: null,
      syncStatus: "disconnected",
      syncError: null
    });
  }

  // Check Token Validity
  isTokenValid() {
    return this.state.accessToken && this.state.tokenExpiry && Date.now() < this.state.tokenExpiry;
  }

  // Load Database from Google Drive
  async syncFromGoogleDrive() {
    if (!this.isTokenValid()) {
      this.connectGoogleDrive();
      return;
    }

    try {
      this.updateState({ syncStatus: "connecting" });
      
      // 1. Search for all-data.json
      let fileId = await driveService.findFile(this.state.accessToken, "all-data.json");
      
      if (fileId) {
        // Load existing database
        const cloudData = await driveService.readFile(this.state.accessToken, fileId);
        
        this.updateState({
          allDataFileId: fileId,
          students: cloudData.students || [],
          screenings: cloudData.screenings || [],
          workEmail: cloudData.workEmail || this.state.workEmail || "ariel.facilitator@rcschools.net",
          teacherEmails: cloudData.teacherEmails || this.state.teacherEmails || {
            "Ms. Davis": "davis@rcschools.net",
            "Mrs. Harrison": "harrison@rcschools.net",
            "Mr. Thompson": "thompson@rcschools.net",
            "Mr. Adams": "adams@rcschools.net"
          },
          syncStatus: "synced",
          flashingGreen: true
        });

        // Auto-upgrade older cloud file format by saving current configuration to Google Drive
        if (!cloudData.workEmail || !cloudData.teacherEmails) {
          this.triggerCloudSave();
        }
        
        setTimeout(() => this.updateState({ flashingGreen: false }), 800);
      } else {
        // File doesn't exist, create it with initial mock data
        const initialPayload = {
          students: this.state.students,
          screenings: this.state.screenings
        };
        const newFileId = await driveService.createFile(this.state.accessToken, "all-data.json", initialPayload);
        
        // Also create segregated parent-portal.json
        const parentPayload = driveService.segregateParentData(initialPayload);
        const parentFileId = await driveService.createFile(this.state.accessToken, "parent-portal.json", parentPayload);

        this.updateState({
          allDataFileId: newFileId,
          parentPortalFileId: parentFileId,
          syncStatus: "synced",
          flashingGreen: true
        });

        setTimeout(() => this.updateState({ flashingGreen: false }), 800);
      }
    } catch (err) {
      console.error(err);
      this.updateState({ syncStatus: "error", syncError: `Sync Failed: ${err.message}` });
    }
  }

  // Debounced Auto-Save back to Google Drive
  triggerCloudSave() {
    // If not logged in, just keep saving locally
    if (!this.isTokenValid() || !this.state.allDataFileId) {
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
          teacherEmails: this.state.teacherEmails
        };

        // 1. Update all-data.json (Confidential Data)
        await driveService.updateFile(this.state.accessToken, this.state.allDataFileId, payload);
        
        // 2. Build and update parent-portal.json (Segregated Data)
        let parentFid = this.state.parentPortalFileId;
        if (!parentFid) {
          parentFid = await driveService.findFile(this.state.accessToken, "parent-portal.json");
        }
        
        const parentPayload = driveService.segregateParentData(payload);
        
        if (parentFid) {
          await driveService.updateFile(this.state.accessToken, parentFid, parentPayload);
        } else {
          const newParentFid = await driveService.createFile(this.state.accessToken, "parent-portal.json", parentPayload);
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
        ...student
      }
    ];
    this.updateState({ students: updated });
    this.triggerCloudSave();
  }

  // Edit Student details
  updateStudent(studentId, updatedFields) {
    const updated = this.state.students.map(s => {
      if (s.id === studentId) {
        return { ...s, ...updatedFields };
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
        status: "Consent Pending",
        referralDate: new Date().toISOString().split("T")[0],
        consentReceivedDate: "",
        teacherChecklistSigned: false,
        nudgeSent: false,
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
        return { ...s, ...updatedFields };
      }
      return s;
    });
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
      status: "Active",
      iepReviewDate: addDays(new Date().toISOString().split("T")[0], 30), // Initial IEP due within 30 days of placement!
      reevalDueDate: addDays(new Date().toISOString().split("T")[0], 3 * 365), // 3 years later
      accommodations: initialAccommodations,
      selNeeds: {
        type: "Asynchronous Development",
        details: "Undergoing initial placement assessment. Identify core overexcitabilities.",
        strategies: ["Dynamic interest-based pacing"],
        logs: [{ date: new Date().toISOString().split("T")[0], note: "Placement finalized from evaluation grid." }]
      },
      progressReports: []
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
          }
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
          progressReports: reports
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
                  ${t.daysRemaining < 0 ? `${Math.abs(t.daysRemaining)} Days Overdue` : t.daysRemaining === 0 ? "Due Today" : `${t.daysRemaining} Days Left`}
                </span>
              </div>
              <div style="font-weight: 700; margin-bottom: 4px; color: #334155;">[${t.type}] ${t.label}</div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 8px; line-height: 1.4;">${t.desc}</div>
              <div style="font-size: 11px; color: #475569;">Due Date: <strong>${t.dueDate}</strong></div>
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
