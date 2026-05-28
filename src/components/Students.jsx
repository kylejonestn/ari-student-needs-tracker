/* ==========================================
   Aegis Gifted Tracker - Students Component
   ========================================== */

import React, { useState } from "react";
import { Search, Plus, UserPlus, BookOpen, Edit2, Check, FileText } from "lucide-react";

export default function Students({ students, addStudent, updateStudent }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State for Adding Student
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("6th");
  const [newTeacher, setNewTeacher] = useState("");
  const [newIepDate, setNewIepDate] = useState("");
  const [newReevalDate, setNewReevalDate] = useState("");
  const [newAccommodations, setNewAccommodations] = useState("");

  // Accommodations editor state
  const [newAccomText, setNewAccomText] = useState("");

  const filteredStudents = students.filter(
    (student) =>
      student.status === "Active" &&
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newName || !newTeacher || !newIepDate || !newReevalDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const accomList = newAccommodations
      ? newAccommodations.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    addStudent({
      name: newName,
      grade: newGrade,
      school: "Blackman Middle School",
      classroomTeacher: newTeacher,
      iepReviewDate: newIepDate,
      reevalDueDate: newReevalDate,
      accommodations: accomList,
    });

    // Reset Form
    setNewName("");
    setNewTeacher("");
    setNewIepDate("");
    setNewReevalDate("");
    setNewAccommodations("");
    setShowAddForm(false);
  };

  const handleAddAccommodation = (studentId) => {
    if (!newAccomText.trim()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const accommodations = [...(student.accommodations || []), newAccomText.trim()];
    updateStudent(studentId, { accommodations });
    setNewAccomText("");
    
    // Sync modal state
    setSelectedStudent({ ...student, accommodations });
  };

  const handleRemoveAccommodation = (studentId, index) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const accommodations = student.accommodations.filter((_, idx) => idx !== index);
    updateStudent(studentId, { accommodations });
    
    // Sync modal state
    setSelectedStudent({ ...student, accommodations });
  };

  return (
    <div>
      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        {/* Search */}
        <div style={{ position: "relative", flexGrow: "1", maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search students by name..."
            style={{ paddingLeft: "40px", width: "100%" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Add Student Action Button */}
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? "Show Student List" : "Add Transfer Student"}
        </button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={20} color="var(--accent-purple)" />
            Add New Transfer Student Profile
          </h3>
          <form onSubmit={handleAddStudent}>
            <div className="form-row">
              <div className="form-group">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Sarah Montgomery"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Grade Level *</label>
                <select className="select-field" value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
                  <option value="6th">6th Grade</option>
                  <option value="7th">7th Grade</option>
                  <option value="8th">8th Grade</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Classroom Core Teacher *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Mrs. Harrison (ELA)"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Initial Accommodations (comma-separated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Curriculum Compacting, Advanced Pacing"
                  value={newAccommodations}
                  onChange={(e) => setNewAccommodations(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Annual IEP Review Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={newIepDate}
                  onChange={(e) => setNewIepDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Triennial Re-evaluation Date *</label>
                <input
                  type="date"
                  className="input-field"
                  value={newReevalDate}
                  onChange={(e) => setNewReevalDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Students Grid */}
      <div className="students-grid">
        {filteredStudents.map((student) => (
          <div key={student.id} className="student-card">
            <div className="student-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="student-initials">
                  {student.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{student.name}</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{student.grade} Grade</span>
                </div>
              </div>
              <span className="student-card-tag" style={{ color: "var(--accent-purple)", borderColor: "var(--accent-purple)" }}>
                {student.status}
              </span>
            </div>

            <div className="student-details-list">
              <span>
                <label>Teacher:</label>
                <span>{student.classroomTeacher}</span>
              </span>
              <span>
                <label>IEP Annual Due:</label>
                <span style={{ fontWeight: "600" }}>{student.iepReviewDate}</span>
              </span>
              <span>
                <label>Accommodations:</label>
                <span style={{ color: "var(--accent-purple)", fontWeight: "600" }}>
                  {student.accommodations ? student.accommodations.length : 0} Logged
                </span>
              </span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: "100%", padding: "6px", fontSize: "12px", marginTop: "8px" }}
              onClick={() => setSelectedStudent(student)}
            >
              <BookOpen size={14} />
              Open Accommodations & Profile
            </button>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No students found matching your search.
          </div>
        )}
      </div>

      {/* Student Profile & Accommodations Editor Drawer/Modal */}
      {selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          padding: "16px"
        }}>
          <div className="glass-panel" style={{
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "var(--bg-sidebar)",
            border: "1px solid var(--border-color)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>{selectedStudent.name}</h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Active Profile • {selectedStudent.grade} Grade • Blackman Middle</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setSelectedStudent(null)}>Close</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Profile Details */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--accent-purple)", marginBottom: "8px", textTransform: "uppercase" }}>General Info</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                  <div><label style={{ color: "var(--text-muted)" }}>Classroom Teacher:</label> <p style={{ fontWeight: "600" }}>{selectedStudent.classroomTeacher}</p></div>
                  <div><label style={{ color: "var(--text-muted)" }}>School District:</label> <p style={{ fontWeight: "600" }}>Rutherford County Schools</p></div>
                  <div><label style={{ color: "var(--text-muted)" }}>Annual IEP Due:</label> <p style={{ fontWeight: "600", color: "var(--accent-amber)" }}>{selectedStudent.iepReviewDate}</p></div>
                  <div><label style={{ color: "var(--text-muted)" }}>Triennial Re-eval Due:</label> <p style={{ fontWeight: "600" }}>{selectedStudent.reevalDueDate}</p></div>
                </div>
              </div>

              {/* Accommodations tracking */}
              <div>
                <h4 style={{ fontSize: "14px", color: "var(--accent-purple)", marginBottom: "8px", textTransform: "uppercase" }}>Accommodations List</h4>
                
                {/* Add Accommodation Input */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Add custom accommodation (e.g. Curriculum Compacting)"
                    style={{ flexGrow: "1", padding: "8px" }}
                    value={newAccomText}
                    onChange={(e) => setNewAccomText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddAccommodation(selectedStudent.id)}
                  />
                  <button className="btn btn-primary" style={{ padding: "8px 12px" }} onClick={() => handleAddAccommodation(selectedStudent.id)}>
                    Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selectedStudent.accommodations && selectedStudent.accommodations.map((accom, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-primary)",
                      fontSize: "13px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <span>{accom}</span>
                      <button 
                        style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", fontWeight: "600" }}
                        onClick={() => handleRemoveAccommodation(selectedStudent.id, index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(!selectedStudent.accommodations || selectedStudent.accommodations.length === 0) && (
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "10px" }}>No accommodations logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
