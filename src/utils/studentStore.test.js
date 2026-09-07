/* ==========================================
   Aegis Gifted Tracker - studentStore Unit Tests
   ========================================== */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentStore, getDifferences, normalizeToISODate, calculateTimelines } from "./studentStore.js";

describe("Smart Cloud Sync - mergeWithCloud", () => {
  const store = new StudentStore();

  it("should merge local-only and cloud-only students with zero conflicts", () => {
    const localData = {
      students: [
        { id: "stu-1", name: "Alice Local", updatedAt: "2026-08-20T10:00:00.000Z", grade: "6th" }
      ],
      screenings: []
    };

    const cloudData = {
      students: [
        { id: "stu-2", name: "Bob Cloud", updatedAt: "2026-08-20T09:00:00.000Z", grade: "7th" }
      ],
      screenings: []
    };

    const { merged, conflicts } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 0, "Should have 0 conflicts");
    assert.equal(merged.students.length, 2, "Merged should contain both students");
    assert.ok(merged.students.some(s => s.id === "stu-1"));
    assert.ok(merged.students.some(s => s.id === "stu-2"));
  });

  it("should recognize identical items without creating a conflict", () => {
    const student = {
      id: "stu-1",
      name: "Alice Montgomery",
      grade: "6th",
      classroomTeacher: "Ms. Davis",
      updatedAt: "2026-08-20T10:00:00.000Z"
    };

    const localData = { students: [student], screenings: [] };
    const cloudData = { students: [{ ...student }], screenings: [] };

    const { merged, conflicts } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 0, "Identical content should not produce conflicts");
    assert.equal(merged.students.length, 1);
    assert.equal(merged.students[0].name, "Alice Montgomery");
  });

  it("should detect a conflict when both local and cloud have concurrent edits after last sync", () => {
    const localData = {
      lastSyncedAt: "2026-08-20T10:00:00.000Z",
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "6th",
          classroomTeacher: "Mrs. Harrison",
          updatedAt: "2026-08-20T12:00:00.000Z" // Edited locally after last sync
        }
      ],
      screenings: []
    };

    const cloudData = {
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "7th", // Changed in cloud after last sync
          classroomTeacher: "Mr. Thompson",
          updatedAt: "2026-08-20T11:00:00.000Z"
        }
      ],
      screenings: []
    };

    const { merged, conflicts } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 1, "Should detect 1 conflict");
    assert.equal(conflicts[0].id, "stu-1");
    assert.equal(conflicts[0].type, "students");
    assert.equal(conflicts[0].local.grade, "6th");
    assert.equal(conflicts[0].cloud.grade, "7th");
  });

  it("should automatically adopt cloud update when local record was untouched (e.g. secondary device or iPhone)", () => {
    const localData = {
      lastSyncedAt: "2026-08-20T10:00:00.000Z",
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "6th",
          classroomTeacher: "Mrs. Harrison",
          updatedAt: "2026-08-20T09:00:00.000Z" // Untouched since before last sync
        }
      ],
      screenings: []
    };

    const cloudData = {
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "7th", // Edited on primary laptop
          classroomTeacher: "Mrs. Harrison",
          updatedAt: "2026-08-20T11:00:00.000Z"
        }
      ],
      screenings: []
    };

    const { merged, conflicts, stats } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 0, "Should have 0 conflicts and adopt cloud update automatically");
    assert.equal(merged.students[0].grade, "7th", "Should adopt 7th grade from cloud");
    assert.equal(stats.cloudAdded, 1);
  });

  it("should detect conflicts in screening profiles during concurrent edits", () => {
    const localData = {
      lastSyncedAt: "2026-08-20T10:00:00.000Z",
      students: [],
      screenings: [
        {
          id: "screen-1",
          name: "Liam Candidate",
          status: "60-Day Evaluation",
          updatedAt: "2026-08-20T14:00:00.000Z"
        }
      ]
    };

    const cloudData = {
      students: [],
      screenings: [
        {
          id: "screen-1",
          name: "Liam Candidate",
          status: "Permission to Test",
          updatedAt: "2026-08-20T13:00:00.000Z"
        }
      ]
    };

    const { merged, conflicts } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].type, "screenings");
    assert.equal(conflicts[0].local.status, "60-Day Evaluation");
    assert.equal(conflicts[0].cloud.status, "Permission to Test");
  });
});

describe("Smart Cloud Sync - applyResolution", () => {
  it("should apply resolution picking local when user keeps local", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Alice Local", grade: "6th", updatedAt: "2026-08-20T10:00:00.000Z" }
    ];

    const conflicts = [
      {
        id: "stu-1",
        type: "students",
        name: "Alice",
        local: { id: "stu-1", name: "Alice Local", grade: "6th", updatedAt: "2026-08-20T10:00:00.000Z" },
        cloud: { id: "stu-1", name: "Alice Cloud", grade: "7th", updatedAt: "2026-08-20T11:00:00.000Z" },
        keep: "local"
      }
    ];

    store.applyResolution(conflicts, false);

    assert.equal(store.state.students.length, 1);
    assert.equal(store.state.students[0].name, "Alice Local");
    assert.equal(store.state.students[0].grade, "6th");
    assert.equal(store.state.syncStatus, "synced");
  });

  it("should apply resolution picking cloud when user keeps cloud", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Alice Local", grade: "6th", updatedAt: "2026-08-20T10:00:00.000Z" }
    ];

    const conflicts = [
      {
        id: "stu-1",
        type: "students",
        name: "Alice",
        local: { id: "stu-1", name: "Alice Local", grade: "6th", updatedAt: "2026-08-20T10:00:00.000Z" },
        cloud: { id: "stu-1", name: "Alice Cloud", grade: "7th", updatedAt: "2026-08-20T11:00:00.000Z" },
        keep: "cloud"
      }
    ];

    store.applyResolution(conflicts, false);

    assert.equal(store.state.students.length, 1);
    assert.equal(store.state.students[0].name, "Alice Cloud");
    assert.equal(store.state.students[0].grade, "7th");
  });

  it("should automatically pick the newest timestamp for each conflict when resolveAllNewest is true", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Alice Local (Newer)", grade: "6th", updatedAt: "2026-08-20T15:00:00.000Z" },
      { id: "stu-2", name: "Bob Local (Older)", grade: "7th", updatedAt: "2026-08-20T08:00:00.000Z" }
    ];

    const conflicts = [
      {
        id: "stu-1",
        type: "students",
        name: "Alice",
        local: { id: "stu-1", name: "Alice Local (Newer)", grade: "6th", updatedAt: "2026-08-20T15:00:00.000Z" },
        cloud: { id: "stu-1", name: "Alice Cloud (Older)", grade: "6th", updatedAt: "2026-08-20T10:00:00.000Z" },
        keep: "cloud" // Ignored because resolveAllNewest = true
      },
      {
        id: "stu-2",
        type: "students",
        name: "Bob",
        local: { id: "stu-2", name: "Bob Local (Older)", grade: "7th", updatedAt: "2026-08-20T08:00:00.000Z" },
        cloud: { id: "stu-2", name: "Bob Cloud (Newer)", grade: "8th", updatedAt: "2026-08-20T16:00:00.000Z" },
        keep: "local" // Ignored because resolveAllNewest = true
      }
    ];

    store.applyResolution(conflicts, true);

    const stu1 = store.state.students.find(s => s.id === "stu-1");
    const stu2 = store.state.students.find(s => s.id === "stu-2");

    assert.equal(stu1.name, "Alice Local (Newer)", "Should pick newer local for stu-1");
    assert.equal(stu2.name, "Bob Cloud (Newer)", "Should pick newer cloud for stu-2");
    assert.equal(stu2.grade, "8th");
  });
});

describe("studentStore mutation timestamps", () => {
  it("should update student updatedAt timestamp on updateStudent", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Test Student", grade: "6th", updatedAt: "2026-01-01T00:00:00.000Z" }
    ];

    store.updateStudent("stu-1", { grade: "7th" });

    const student = store.state.students[0];
    assert.equal(student.grade, "7th");
    assert.ok(student.updatedAt > "2026-01-01T00:00:00.000Z", "updatedAt should be refreshed");
  });

  it("should update all students updatedAt timestamp on bulkUpdateStudents", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Student 1", classroomTeacher: "Teacher A", updatedAt: "2026-01-01T00:00:00.000Z" },
      { id: "stu-2", name: "Student 2", classroomTeacher: "Teacher A", updatedAt: "2026-01-01T00:00:00.000Z" }
    ];

    store.bulkUpdateStudents(["stu-1", "stu-2"], { classroomTeacher: "Mrs. Harrison" });

    assert.equal(store.state.students[0].classroomTeacher, "Mrs. Harrison");
    assert.equal(store.state.students[1].classroomTeacher, "Mrs. Harrison");
    assert.ok(store.state.students[0].updatedAt > "2026-01-01T00:00:00.000Z");
    assert.ok(store.state.students[1].updatedAt > "2026-01-01T00:00:00.000Z");
  });
});

describe("Smart Cloud Sync - Undo & Preservation", () => {
  it("should preserve newly created local student during merge and record localAdded stat", () => {
    const store = new StudentStore();
    const localData = {
      students: [
        { id: "stu-cloud", name: "Existing Cloud Student", grade: "6th" },
        { id: "stu-new-local", name: "Newly Added Local Student", grade: "7th" }
      ],
      screenings: []
    };
    const cloudData = {
      students: [
        { id: "stu-cloud", name: "Existing Cloud Student", grade: "6th" }
      ],
      screenings: []
    };

    const { merged, conflicts, stats } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 0);
    assert.equal(merged.students.length, 2);
    assert.ok(merged.students.some(s => s.id === "stu-new-local"), "Local student must be preserved");
    assert.equal(stats.localAdded, 1);
  });

  it("should undo last sync and restore pre-sync snapshot", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-local-orig", name: "Original Local Student", grade: "6th" }
    ];

    // Simulate saving pre-sync backup
    store.lastSyncBackup = {
      students: JSON.parse(JSON.stringify(store.state.students)),
      screenings: [],
      timestamp: Date.now()
    };

    // Simulate cloud sync overwriting state with remote data
    store.state.students = [
      { id: "stu-remote-1", name: "Remote Student", grade: "8th" }
    ];

    // Trigger Undo
    store.undoLastSync();

    assert.equal(store.state.students.length, 1);
    assert.equal(store.state.students[0].id, "stu-local-orig");
    assert.equal(store.state.students[0].name, "Original Local Student");
    assert.equal(store.state.hasUndoBackup, false);
  });
});

describe("Smart Cloud Sync - Deletions & Tombstones", () => {
  it("should mark student as deleted with updatedAt timestamp when bulkDeleteStudents is called", () => {
    const store = new StudentStore();
    store.state.students = [
      { id: "stu-1", name: "Student 1", grade: "6th", status: "Active" },
      { id: "stu-2", name: "Student 2", grade: "7th", status: "Active" }
    ];

    store.bulkDeleteStudents(["stu-1"]);

    const stu1 = store.state.students.find(s => s.id === "stu-1");
    const stu2 = store.state.students.find(s => s.id === "stu-2");

    assert.equal(stu1.deleted, true);
    assert.equal(stu1.status, "Inactive");
    assert.ok(stu1.updatedAt > "2026-01-01T00:00:00.000Z");
    assert.equal(stu2.deleted, undefined);
  });

  it("should preserve local deletion during merge when cloud still has the legacy active record", () => {
    const store = new StudentStore();
    const localData = {
      students: [
        { id: "stu-1", name: "Deleted Student", deleted: true, status: "Inactive", updatedAt: "2026-08-21T12:00:00.000Z" },
        { id: "stu-2", name: "Active Student", status: "Active", updatedAt: "2026-08-21T10:00:00.000Z" }
      ],
      screenings: []
    };
    const cloudData = {
      students: [
        { id: "stu-1", name: "Deleted Student", status: "Active", updatedAt: "2026-08-20T08:00:00.000Z" },
        { id: "stu-2", name: "Active Student", status: "Active", updatedAt: "2026-08-20T08:00:00.000Z" }
      ],
      screenings: []
    };

    const { merged, conflicts, stats } = store.mergeWithCloud(localData, cloudData);

    assert.equal(conflicts.length, 0, "No conflict should be raised for standard timestamp-driven deletion");
    const mergedStu1 = merged.students.find(s => s.id === "stu-1");
    assert.equal(mergedStu1.deleted, true, "Deleted student must remain deleted");
    assert.equal(mergedStu1.status, "Inactive");
  });

  it("should adopt cloud deletion when cloud deletion timestamp is newer than local edit", () => {
    const store = new StudentStore();
    const localData = {
      students: [
        { id: "stu-1", name: "Student 1", status: "Active", updatedAt: "2026-08-20T08:00:00.000Z" }
      ],
      screenings: []
    };
    const cloudData = {
      students: [
        { id: "stu-1", name: "Student 1", deleted: true, status: "Inactive", updatedAt: "2026-08-21T14:00:00.000Z" }
      ],
      screenings: []
    };

    const { merged } = store.mergeWithCloud(localData, cloudData);
    const mergedStu1 = merged.students.find(s => s.id === "stu-1");

    assert.equal(mergedStu1.deleted, true, "Newer cloud deletion must win");
  });

  it("should mark screening as Archived and deleted when removeScreening is called", () => {
    const store = new StudentStore();
    store.state.screenings = [
      { id: "scr-1", name: "Screening Student", status: "Pending Discontinuation" }
    ];

    store.removeScreening("scr-1");

    const scr = store.state.screenings.find(s => s.id === "scr-1");
    assert.equal(scr.deleted, true);
    assert.equal(scr.status, "Archived");
    assert.ok(scr.updatedAt);
  });

  it("should return empty timelines for archived or placed screenings", () => {
    const archivedScreening = { id: "scr-arch", name: "Archived Student", status: "Archived", deleted: true };
    const placedScreening = { id: "scr-placed", name: "Placed Student", status: "Placed", deleted: true };

    assert.deepEqual(calculateTimelines(archivedScreening, true), []);
    assert.deepEqual(calculateTimelines(placedScreening, true), []);
  });
});

describe("SyncConflictModal - getDifferences helper", () => {
  it("should detect and describe differences between local and cloud student records", () => {
    const localStudent = {
      grade: "7th",
      classroomTeacher: "Mrs. Harrison",
      iepDueDate: "2027-06-04",
      accommodations: [{ label: "Compacting", notes: ["Note 1", "Note 2"] }]
    };
    const cloudStudent = {
      grade: "6th",
      classroomTeacher: "Ms. Davis",
      iepDueDate: "2027-04-10",
      accommodations: [{ label: "Compacting", notes: [] }]
    };

    const diffs = getDifferences(localStudent, cloudStudent, "students");
    const diffKeys = diffs.map(d => d.key);

    assert.ok(diffKeys.includes("grade"), "Should detect grade diff");
    assert.ok(diffKeys.includes("classroomTeacher"), "Should detect teacher diff");
    assert.ok(diffKeys.includes("iepDueDate"), "Should detect IEP due date diff");
    assert.ok(diffKeys.includes("notes"), "Should detect accommodation notes diff");
  });
});

describe("Date Normalization - normalizeToISODate", () => {
  it("should preserve standard ISO YYYY-MM-DD format", () => {
    assert.equal(normalizeToISODate("2027-05-15"), "2027-05-15");
    assert.equal(normalizeToISODate("2028-09-20"), "2028-09-20");
  });

  it("should normalize DD/MM/YYYY and DD-MM-YYYY formats", () => {
    assert.equal(normalizeToISODate("15/05/2027"), "2027-05-15");
    assert.equal(normalizeToISODate("20-09-2028"), "2028-09-20");
  });

  it("should normalize DD/MM/YY and DD-MM-YY 2-digit year formats", () => {
    assert.equal(normalizeToISODate("15/05/27"), "2027-05-15");
    assert.equal(normalizeToISODate("20/09/28"), "2028-09-20");
    assert.equal(normalizeToISODate("04/06/27"), "2027-06-04");
  });

  it("should normalize MM/DD/YYYY and MM/DD/YY formats when day > 12", () => {
    assert.equal(normalizeToISODate("05/15/2027"), "2027-05-15");
    assert.equal(normalizeToISODate("05/15/27"), "2027-05-15");
  });

  it("should gracefully handle empty or TBD dates", () => {
    assert.equal(normalizeToISODate(""), "");
    assert.equal(normalizeToISODate("TBD"), "");
    assert.equal(normalizeToISODate("N/A"), "");
    assert.equal(normalizeToISODate(null), "");
  });
});

describe("Timeline Calculations - Status Categorization", () => {
  it("should mark negative days remaining as overdue rather than warning for screenings", () => {
    // Student with referral date in the distant past (e.g. 88 days ago)
    const pastScreening = {
      id: "scr-past",
      name: "Past Screening Student",
      status: "Quick Survey",
      referralDate: "2026-01-01"
    };

    const timelines = calculateTimelines(pastScreening, true);
    assert.ok(timelines.length > 0, "Should generate timeline");
    const quickSurvey = timelines.find(t => t.type === "Quick Survey");
    assert.ok(quickSurvey, "Quick Survey timeline should exist");
    assert.ok(quickSurvey.daysRemaining < 0, "Days remaining should be negative");
    assert.equal(quickSurvey.status, "overdue", "Status should be overdue, NOT warning");
  });

  it("should return empty timelines for Archived, Placed, or Deleted students", () => {
    assert.deepEqual(calculateTimelines({ id: "1", status: "Archived" }, true), []);
    assert.deepEqual(calculateTimelines({ id: "2", status: "Placed" }, true), []);
    assert.deepEqual(calculateTimelines({ id: "3", status: "Quick Survey", deleted: true }, true), []);
    assert.deepEqual(calculateTimelines({ id: "4", status: "Archived" }, false), []);
    assert.deepEqual(calculateTimelines({ id: "5", status: "Active", deleted: true }, false), []);
  });
});

describe("Google Drive Multi-Workstation Sync Enhancements", () => {
  it("should store and update connectedEmail and lastSyncedAt in store state", () => {
    const store = new StudentStore();
    const testEmail = "ariel.teacher@rcschools.net";
    const testTimestamp = new Date().toISOString();

    store.updateState({
      connectedEmail: testEmail,
      lastSyncedAt: testTimestamp
    });

    const state = store.getState();
    assert.equal(state.connectedEmail, testEmail, "connectedEmail should be set");
    assert.equal(state.lastSyncedAt, testTimestamp, "lastSyncedAt should be set");
  });

  it("should clear connectedEmail and lastSyncedAt upon disconnectGoogleDrive", () => {
    const store = new StudentStore();
    store.updateState({
      connectedEmail: "test@example.com",
      lastSyncedAt: new Date().toISOString(),
      accessToken: "mock-token",
      tokenExpiry: Date.now() + 3600000,
      syncStatus: "synced"
    });

    store.disconnectGoogleDrive();
    const state = store.getState();
    assert.equal(state.connectedEmail, null, "connectedEmail should be null after disconnect");
    assert.equal(state.lastSyncedAt, null, "lastSyncedAt should be null after disconnect");
    assert.equal(state.accessToken, null, "accessToken should be null");
    assert.equal(state.syncStatus, "disconnected", "syncStatus should be disconnected");
  });

  it("should preserve and merge new students added on two different devices concurrently", () => {
    const store = new StudentStore();
    const baselineSync = "2026-09-07T14:00:00.000Z";

    // Initial state before additions
    const initialStudent = { id: "stu-existing", name: "Existing Student", grade: "6th", updatedAt: baselineSync };

    // Device A adds Student A
    const deviceAStudent = { id: "stu-device-a", name: "Student From Device A", grade: "7th", updatedAt: "2026-09-07T14:05:00.000Z" };
    // Device B adds Student B
    const deviceBStudent = { id: "stu-device-b", name: "Student From Device B", grade: "8th", updatedAt: "2026-09-07T14:06:00.000Z" };

    // Device A synced first: Cloud has initial + Student A
    const cloudAfterDeviceA = {
      students: [initialStudent, deviceAStudent],
      screenings: []
    };

    // Device B has initial + Student B locally, with lastSyncedAt at baseline
    const deviceBLocalState = {
      lastSyncedAt: baselineSync,
      students: [initialStudent, deviceBStudent],
      screenings: []
    };

    // Device B syncs
    const { merged, conflicts, stats } = store.mergeWithCloud(deviceBLocalState, cloudAfterDeviceA);

    assert.equal(conflicts.length, 0, "No conflicts expected for distinct student additions");
    assert.equal(merged.students.length, 3, "All 3 students should be in merged dataset");
    assert.ok(merged.students.some(s => s.id === "stu-existing"), "Existing student preserved");
    assert.ok(merged.students.some(s => s.id === "stu-device-a"), "Device A student preserved");
    assert.ok(merged.students.some(s => s.id === "stu-device-b"), "Device B student preserved");
    assert.equal(stats.cloudAdded, 1, "Should count 1 cloud addition (Device A)");
    assert.equal(stats.localAdded, 1, "Should count 1 local addition (Device B)");
  });
});

