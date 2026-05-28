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
          syncStatus: "synced",
          flashingGreen: true
        });
        
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
          screenings: this.state.screenings
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
}

export const store = new StudentStore();
export default store;
