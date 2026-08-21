/* ==========================================
   Aegis Gifted Tracker - studentStore Unit Tests
   ========================================== */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentStore, getDifferences } from "./studentStore.js";

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

  it("should detect a conflict when local and cloud have differing content for the same student", () => {
    const localData = {
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "6th",
          classroomTeacher: "Mrs. Harrison",
          updatedAt: "2026-08-20T12:00:00.000Z" // Newer local
        }
      ],
      screenings: []
    };

    const cloudData = {
      students: [
        {
          id: "stu-1",
          name: "Alice Montgomery",
          grade: "7th", // Changed in cloud
          classroomTeacher: "Mr. Thompson",
          updatedAt: "2026-08-20T11:00:00.000Z" // Older cloud
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

  it("should detect conflicts in screening profiles as well", () => {
    const localData = {
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

