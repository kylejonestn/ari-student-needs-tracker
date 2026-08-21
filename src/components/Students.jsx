/* ==========================================
   Aegis Gifted Tracker - Students Component
   ========================================== */

import React, { useState } from "react";
import { Search, Plus, UserPlus, BookOpen, Edit2, Check, FileText, ClipboardList, FileSpreadsheet, Upload, ArrowRight, Info, AlertCircle, Trash2, ArrowUpCircle, UserCheck, Archive, X, RefreshCw, Cloud, MessageSquare, ChevronDown, ChevronUp, StickyNote, ArrowUpDown } from "lucide-react";
import { guessTeacherEmail, store } from "../utils/studentStore";

export default function Students({ 
  students, 
  addStudent, 
  addStudents, 
  updateStudent,
  teacherEmails = {},
  bulkUpdateStudents,
  bulkDeleteStudents,
  bulkPromoteStudents
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Bulk Selection and Dialog State
  const [selectedIds, setSelectedIds] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);

  // Form State for Adding Student
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("6th");
  const [newTeacher, setNewTeacher] = useState("");
  const [newIepDate, setNewIepDate] = useState("");
  const [newReevalDate, setNewReevalDate] = useState("");
  const [newAccommodations, setNewAccommodations] = useState("");

  // CSV Import Wizard State
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 = Upload, 2 = Mapping, 3 = Preview
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    grade: "",
    classroomTeacher: "",
    iepDueDate: "",
    reevalDueDate: "",
    accommodations: ""
  });
  const [importPreviewData, setImportPreviewData] = useState([]);

  // Client-side CSV Parser
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"'; // Double quotes escape
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // Handle CRLF
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    
    // Filter empty lines and trim cells
    const cleanLines = lines
      .map(r => r.map(c => c.trim()))
      .filter(r => r.length > 0 && r.some(c => c !== ""));
      
    return cleanLines;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        alert("The CSV file must contain a header row and at least one data row.");
        return;
      }

      const headers = parsed[0];
      const rows = parsed.slice(1);

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Perform soft matching
      const mapping = {
        name: "",
        grade: "",
        classroomTeacher: "",
        iepDueDate: "",
        reevalDueDate: "",
        accommodations: ""
      };

      const softMatches = {
        name: ["name", "student", "full name", "student name", "fullname"],
        grade: ["grade", "grade level", "class grade", "gradelevel"],
        classroomTeacher: ["teacher", "homeroom", "classroom teacher", "homeroom teacher", "core teacher", "subject teacher"],
        iepDueDate: ["iep", "iep date", "iep review", "annual iep", "review date"],
        reevalDueDate: ["reeval", "reeval date", "re-eval", "triennial", "re-evaluation"],
        accommodations: ["accommodations", "supports", "services", "accoms"]
      };

      headers.forEach(h => {
        const lowerH = h.toLowerCase().trim();
        Object.keys(softMatches).forEach(field => {
          if (softMatches[field].some(match => lowerH.includes(match) || match.includes(lowerH))) {
            if (!mapping[field]) { // Map first match
              mapping[field] = h;
            }
          }
        });
      });

      setColumnMapping(mapping);
      setWizardStep(2);
    };
    reader.readAsText(file);
  };

  const handleBuildPreview = () => {
    // Verify required mappings are present
    const required = ["name"];
    const missing = required.filter(f => !columnMapping[f]);
    if (missing.length > 0) {
      alert(`Please map all required columns before proceeding: ${missing.map(m => m.toUpperCase()).join(", ")}`);
      return;
    }

    // Map rows to target format
    const preview = csvRows.map((row) => {
      const getVal = (field) => {
        const headerName = columnMapping[field];
        if (!headerName) return "";
        const colIdx = csvHeaders.indexOf(headerName);
        return colIdx >= 0 ? row[colIdx] : "";
      };

      const name = getVal("name");
      const grade = getVal("grade");
      const teacher = getVal("classroomTeacher");
      const iepDate = getVal("iepDueDate");
      const reevalDate = getVal("reevalDueDate");
      const accomsRaw = getVal("accommodations");

      // Validate date formats (simple YYYY-MM-DD check, empty or TBD is valid)
      const isValidDate = (dStr) => {
        if (!dStr || dStr.trim() === "" || dStr.trim() === "TBD") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(dStr.trim());
      };

      // Accomms parser: split by comma, semicolon, or newlines
      const accommodations = accomsRaw
        ? accomsRaw.split(/[;,\n]+/).map(a => a.trim()).filter(Boolean)
        : [];

      return {
        name,
        grade: grade || "",
        school: "Blackman Middle School",
        classroomTeacher: teacher || "",
        iepDueDate: iepDate || "",
        reevalDueDate: reevalDate || "",
        accommodations,
        isValid: !!name && isValidDate(iepDate) && isValidDate(reevalDate),
        validationErrors: {
          name: !name,
          grade: false,
          classroomTeacher: false,
          iepDueDate: !isValidDate(iepDate),
          reevalDueDate: !isValidDate(reevalDate)
        }
      };
    });

    setImportPreviewData(preview);
    setWizardStep(3);
  };

  const handleFinalizeImport = () => {
    const validStudents = importPreviewData.filter(s => s.isValid);
    if (validStudents.length === 0) {
      alert("No valid student records found to import. Please check date formats (must be YYYY-MM-DD) and required columns.");
      return;
    }

    addStudents(validStudents.map(({ name, grade, school, classroomTeacher, iepDueDate, reevalDueDate, accommodations }) => ({
      name,
      grade,
      school,
      classroomTeacher,
      iepDueDate,
      reevalDueDate,
      accommodations,
      updatedAt: new Date().toISOString()
    })));

    alert(`Successfully imported ${validStudents.length} students!`);
    
    // Reset wizard
    setWizardStep(1);
    setCsvHeaders([]);
    setCsvRows([]);
    setColumnMapping({
      name: "",
      grade: "",
      classroomTeacher: "",
      iepDueDate: "",
      reevalDueDate: "",
      accommodations: ""
    });
    setImportPreviewData([]);
    setShowImportWizard(false);
  };

  // Accommodations editor state
  const [newAccomText, setNewAccomText] = useState("");
  const [expandedAccoms, setExpandedAccoms] = useState({});
  const [accomNoteInput, setAccomNoteInput] = useState({});

  // Sort and Filter state
  const [sortBy, setSortBy] = useState("name"); // "name" | "grade" | "iepDueDate" | "classroomTeacher"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");

  const availableTeachers = Array.from(
    new Set(
      students
        .filter((s) => !s.deleted && s.status === "Active" && s.classroomTeacher)
        .map((s) => s.classroomTeacher.trim())
    )
  ).sort();

  const filteredStudents = students
    .filter((student) => {
      if (student.deleted || student.status !== "Active") return false;
      if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterGrade !== "all" && student.grade !== filterGrade) return false;
      if (filterTeacher !== "all" && student.classroomTeacher !== filterTeacher) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "grade") {
        const gradeRank = { "6th": 6, "7th": 7, "8th": 8 };
        const rankA = gradeRank[a.grade] || parseInt(a.grade) || 99;
        const rankB = gradeRank[b.grade] || parseInt(b.grade) || 99;
        comparison = rankA - rankB;
        if (comparison === 0) comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "iepDueDate") {
        const dateA = a.iepDueDate || a.iepReviewDate || "9999-99-99";
        const dateB = b.iepDueDate || b.iepReviewDate || "9999-99-99";
        comparison = dateA.localeCompare(dateB);
        if (comparison === 0) comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "classroomTeacher") {
        const teacherA = a.classroomTeacher || "ZZZ";
        const teacherB = b.classroomTeacher || "ZZZ";
        comparison = teacherA.localeCompare(teacherB);
        if (comparison === 0) comparison = a.name.localeCompare(b.name);
      } else {
        // Default: name
        comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleAccom = (index) => {
    setExpandedAccoms(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addNote = (accomIdx) => {
    const noteText = accomNoteInput[accomIdx];
    if (!noteText || !noteText.trim()) return;
    if (!selectedStudent) return;
    const newNote = { text: noteText.trim(), date: new Date().toLocaleDateString() };
    const accommodations = selectedStudent.accommodations.map((ac, idx) =>
      idx === accomIdx ? { ...ac, notes: [newNote, ...(ac.notes || [])] } : ac
    );
    updateStudent(selectedStudent.id, { accommodations });
    setSelectedStudent({ ...selectedStudent, accommodations });
    setAccomNoteInput(prev => {
      const copy = { ...prev };
      delete copy[accomIdx];
      return copy;
    });
  };

  const editNote = (accomIdx, noteIdx) => {
    if (!selectedStudent) return;
    const currentNote = selectedStudent.accommodations[accomIdx].notes[noteIdx];
    const newText = prompt('Edit note', currentNote.text);
    if (newText === null) return; // cancelled
    const accommodations = selectedStudent.accommodations.map((ac, idx) => {
      if (idx === accomIdx) {
        const notes = ac.notes.map((n, i) => (i === noteIdx ? { ...n, text: newText } : n));
        return { ...ac, notes };
      }
      return ac;
    });
    updateStudent(selectedStudent.id, { accommodations });
    setSelectedStudent({ ...selectedStudent, accommodations });
  };

  const deleteNote = (accomIdx, noteIdx) => {
    if (!selectedStudent) return;
    const accommodations = selectedStudent.accommodations.map((ac, idx) => {
      if (idx === accomIdx) {
        const notes = ac.notes.filter((_, i) => i !== noteIdx);
        return { ...ac, notes };
      }
      return ac;
    });
    updateStudent(selectedStudent.id, { accommodations });
    setSelectedStudent({ ...selectedStudent, accommodations });
  };

  const handleAddStudent = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newName.trim()) {
      alert("Please enter the student's name.");
      return;
    }

    // Convert accommodation strings to objects {label, notes}
    const accomList = newAccommodations
      ? newAccommodations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label, notes: [] }))
      : [];

    addStudent({
      name: newName.trim(),
      grade: newGrade,
      school: "Blackman Middle School",
      classroomTeacher: newTeacher,
      iepDueDate: newIepDate,
      reevalDueDate: newReevalDate,
      accommodations: accomList,
      updatedAt: new Date().toISOString()
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

    // Normalize existing accommodations to objects
    const existingAccoms = (student.accommodations || []).map((a) =>
      typeof a === 'string' ? { label: a, notes: [] } : a
    );
    const newAccomObj = { label: newAccomText.trim(), notes: [] };
    const accommodations = [...existingAccoms, newAccomObj];
    updateStudent(studentId, { accommodations });
    setNewAccomText("");

    // Sync modal state
    setSelectedStudent({ ...student, accommodations });
  };

  const handleRemoveAccommodation = (studentId, index) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const accommodations = student.accommodations.map((ac, idx) => idx === index ? { ...ac, deleted: true, deletedAt: new Date().toISOString() } : ac);
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

        {/* Bulk Import, Cloud Sync, and Add Student Actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn btn-secondary" onClick={() => store.syncToCloud()} title="Sync and merge database with Google Drive">
            <RefreshCw size={16} />
            Cloud Sync
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImportWizard(true)}>
            <FileSpreadsheet size={16} />
            Bulk Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} />
            {showAddForm ? "Show Student List" : "Add Student"}
          </button>
        </div>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={20} color="var(--accent-purple)" />
            Add New Student Profile
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

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Classroom Core Teacher</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Mrs. Harrison (ELA)"
                style={{ width: "100%" }}
                value={newTeacher}
                onChange={(e) => {
                  setNewTeacher(e.target.value);
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label>Initial Accommodations (comma-separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Curriculum Compacting, Advanced Pacing"
                value={newAccommodations}
                onChange={(e) => setNewAccommodations(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>IEP Due Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={newIepDate}
                  onChange={(e) => setNewIepDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Triennial Re-evaluation Date</label>
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

      {/* Directory Controls: Select All & Sort/Filter Strip */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center", 
        flexWrap: "wrap",
        gap: "12px", 
        marginBottom: "16px", 
        padding: "10px 16px",
        borderRadius: "10px", 
        backgroundColor: "var(--bg-sidebar)",
        border: "1px solid var(--border-color)"
      }}>
        {/* Left Side: Select All Checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input 
            type="checkbox" 
            id="selectAllCheckbox"
            checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.includes(s.id))}
            onChange={(e) => {
              if (e.target.checked) {
                const allFilteredIds = filteredStudents.map(s => s.id);
                setSelectedIds(prev => {
                  const combined = new Set([...prev, ...allFilteredIds]);
                  return Array.from(combined);
                });
              } else {
                const filteredIdsSet = new Set(filteredStudents.map(s => s.id));
                setSelectedIds(prev => prev.filter(id => !filteredIdsSet.has(id)));
              }
            }}
            style={{ cursor: "pointer", width: "16px", height: "16px" }}
          />
          <label htmlFor="selectAllCheckbox" style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer", userSelect: "none" }}>
            Select All ({filteredStudents.length})
          </label>
          {selectedIds.length > 0 && (
            <span style={{ fontSize: "12px", color: "var(--accent-purple)", fontWeight: "700", borderLeft: "1px solid var(--border-color)", paddingLeft: "10px" }}>
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        {/* Right Side: Sort & Filter Controls next to selectAll */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <ArrowUpDown size={13} />
              Sort:
            </span>
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px", width: "auto", cursor: "pointer" }}
            >
              <option value="name">Name (A-Z)</option>
              <option value="grade">Grade</option>
              <option value="iepDueDate">IEP Due Date</option>
              <option value="classroomTeacher">Teacher</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
              title={sortOrder === "asc" ? "Ascending order (click for Descending)" : "Descending order (click for Ascending)"}
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          {/* Grade Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Grade:</span>
            <select
              className="input-field"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px", width: "auto", cursor: "pointer" }}
            >
              <option value="all">All Grades</option>
              <option value="6th">6th Grade</option>
              <option value="7th">7th Grade</option>
              <option value="8th">8th Grade</option>
            </select>
          </div>

          {/* Teacher Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Teacher:</span>
            <select
              className="input-field"
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              style={{ padding: "4px 8px", fontSize: "12px", width: "auto", maxWidth: "160px", cursor: "pointer" }}
            >
              <option value="all">All Teachers</option>
              {availableTeachers.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters if active */}
          {(filterGrade !== "all" || filterTeacher !== "all" || searchTerm !== "" || sortBy !== "name") && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilterGrade("all");
                setFilterTeacher("all");
                setSearchTerm("");
                setSortBy("name");
                setSortOrder("asc");
              }}
              style={{ padding: "4px 8px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-rose)" }}
              title="Reset all filters and sorting"
            >
              <X size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Students Grid */}
      <div className="students-grid">
        {filteredStudents.map((student) => {
          const isSelected = selectedIds.includes(student.id);
          return (
            <div 
              key={student.id} 
              className="student-card"
              onClick={() => setSelectedStudent(student)}
              style={{
                cursor: "pointer",
                ...(isSelected ? { borderColor: "var(--accent-purple)", boxShadow: "0 0 10px rgba(168, 85, 247, 0.25)" } : {})
              }}
            >
              <div className="student-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSelectedIds(prev => prev.filter(id => id !== student.id));
                      } else {
                        setSelectedIds(prev => [...prev, student.id]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: "pointer", width: "15px", height: "15px" }}
                  />
                  <div className="student-initials" style={isSelected ? { backgroundColor: "var(--accent-purple)", color: "#fff" } : {}}>
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700" }}>{student.name}</h3>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{student.grade} Grade</span>
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
                  <label>IEP Due Date:</label>
                  <span style={{ fontWeight: "600" }}>{student.iepDueDate}</span>
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
          );
        })}
        {filteredStudents.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No students found matching your search.
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <>
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 60px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <div style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(25, 18, 40, 0.9)", 
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 10px 40px 0 rgba(0, 0, 0, 0.4)",
            borderRadius: "16px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            zIndex: 150,
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            maxWidth: "95vw",
            width: "max-content",
            flexWrap: "wrap",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ 
                backgroundColor: "var(--accent-purple)", 
                color: "#fff", 
                borderRadius: "50%", 
                width: "22px", 
                height: "22px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "11px", 
                fontWeight: "700" 
              }}>
                {selectedIds.length}
              </span>
              <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-heading)" }}>Selected</span>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ padding: "6px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--accent-purple)" }}
                onClick={() => setShowPromoteConfirm(true)}
              >
                <ArrowUpCircle size={14} />
                Promote Grade
              </button>
              
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: "6px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => {
                  setSelectedTeacher("");
                  setShowTeacherModal(true);
                }}
              >
                <UserCheck size={14} />
                Reassign Teacher
              </button>

              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: "6px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to archive ${selectedIds.length} student(s)? They will be moved to 'Inactive' status.`)) {
                    bulkUpdateStudents(selectedIds, { status: "Inactive" });
                    setSelectedIds([]);
                  }
                }}
              >
                <Archive size={14} />
                Archive/Exit
              </button>

              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: "6px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", borderColor: "rgba(244, 63, 94, 0.4)", color: "var(--accent-rose)" }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Delete
              </button>

              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: "6px 10px", fontSize: "11px" }}
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bulk Homeroom Reassignment Modal */}
      {showTeacherModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 210, padding: "16px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "24px", backgroundColor: "var(--bg-sidebar)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Bulk Homeroom Reassignment</h3>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setShowTeacherModal(false)}>
                <X size={18} />
              </button>
            </div>
            
             <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Select Classroom Teacher</label>
              <select 
                className="select-field" 
                value={selectedTeacher} 
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{ width: "100%", marginTop: "6px" }}
              >
                <option value="">-- Choose Homeroom Teacher --</option>
                {Array.from(new Set([
                  ...students.map(s => s.classroomTeacher),
                  "Ms. Davis", "Mrs. Harrison", "Mr. Thompson", "Mr. Adams"
                ].filter(Boolean))).sort().map(teacher => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setShowTeacherModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: "6px 12px", fontSize: "12px" }} 
                onClick={() => {
                  if (!selectedTeacher) {
                    alert("Please select a teacher.");
                    return;
                  }
                  bulkUpdateStudents(selectedIds, { 
                    classroomTeacher: selectedTeacher
                  });
                  setSelectedIds([]);
                  setShowTeacherModal(false);
                }}
              >
                Assign Homeroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 210, padding: "16px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "24px", border: "1px solid var(--accent-rose)", backgroundColor: "var(--bg-sidebar)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <AlertCircle size={20} />
              Permanently Delete Students?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "20px", lineHeight: "1.5" }}>
              You are about to permanently delete <strong>{selectedIds.length} student profile(s)</strong> and all associated IEP/Re-evaluation timelines. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--accent-rose)" }} 
                onClick={() => {
                  bulkDeleteStudents(selectedIds);
                  setSelectedIds([]);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Promote Confirmation Modal */}
      {showPromoteConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 210, padding: "16px"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "24px", backgroundColor: "var(--bg-sidebar)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <ArrowUpCircle size={20} color="var(--accent-purple)" />
              Bulk Promote Students?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "12px", lineHeight: "1.5" }}>
              You are promoting <strong>{selectedIds.length} student(s)</strong> to their next grade:
            </p>
            <ul style={{ fontSize: "12px", paddingLeft: "20px", marginBottom: "16px", listStyleType: "disc", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>6th Grade students will move to <strong>7th Grade</strong>.</li>
              <li>7th Grade students will move to <strong>8th Grade</strong>.</li>
              <li>8th Grade students (Graduating Middle School) will move to <strong>Inactive/Archived</strong> status.</li>
            </ul>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setShowPromoteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--accent-purple)" }} 
                onClick={() => {
                  bulkPromoteStudents(selectedIds);
                  setSelectedIds([]);
                  setShowPromoteConfirm(false);
                }}
              >
                Promote Caseload
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Classroom Teacher:</label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: "6px 10px", fontSize: "12px", width: "100%" }}
                      value={selectedStudent.classroomTeacher || ""}
                      onChange={(e) => {
                        const updated = { ...selectedStudent, classroomTeacher: e.target.value };
                        setSelectedStudent(updated);
                        updateStudent(selectedStudent.id, { classroomTeacher: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>IEP Due Date:</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ padding: "6px 10px", fontSize: "12px", width: "100%", color: "var(--accent-amber)" }}
                      value={selectedStudent.iepDueDate || ""}
                      onChange={(e) => {
                        const updated = { ...selectedStudent, iepDueDate: e.target.value };
                        setSelectedStudent(updated);
                        updateStudent(selectedStudent.id, { iepDueDate: e.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Triennial Re-eval Due:</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ padding: "6px 10px", fontSize: "12px", width: "100%" }}
                      value={selectedStudent.reevalDueDate || ""}
                      onChange={(e) => {
                        const updated = { ...selectedStudent, reevalDueDate: e.target.value };
                        setSelectedStudent(updated);
                        updateStudent(selectedStudent.id, { reevalDueDate: e.target.value });
                      }}
                    />
                  </div>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedStudent.accommodations && selectedStudent.accommodations
                      .map((accom, originalIdx) => ({ accom, originalIdx }))
                      .filter(({ accom }) => !accom.deleted)
                      .map(({ accom, originalIdx }) => {
                        const noteCount = accom.notes?.length || 0;
                        const isExpanded = !!expandedAccoms[originalIdx];

                        return (
                          <div
                            key={originalIdx}
                            style={{
                              borderRadius: "8px",
                              backgroundColor: "var(--bg-primary)",
                              border: `1px solid ${isExpanded ? "rgba(168, 85, 247, 0.4)" : "var(--border-color)"}`,
                              overflow: "hidden",
                              transition: "all 0.15s ease",
                              boxShadow: isExpanded ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
                            }}
                          >
                            {/* Card Header Row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                gap: "10px"
                              }}
                            >
                              <span style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--text-heading)", flexGrow: 1 }}>
                                {accom.label}
                              </span>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => toggleAccom(originalIdx)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    backgroundColor: isExpanded
                                      ? "rgba(168, 85, 247, 0.2)"
                                      : (noteCount > 0 ? "rgba(168, 85, 247, 0.1)" : "var(--bg-sidebar)"),
                                    color: (noteCount > 0 || isExpanded) ? "var(--accent-purple)" : "var(--text-muted)",
                                    border: `1px solid ${isExpanded ? "var(--accent-purple)" : "var(--border-color)"}`,
                                    transition: "all 0.15s ease"
                                  }}
                                  title="View and add implementation notes"
                                >
                                  <MessageSquare size={13} />
                                  <span>{noteCount > 0 ? `Notes (${noteCount})` : "Add Note"}</span>
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveAccommodation(selectedStudent.id, originalIdx)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    padding: "4px 6px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    fontSize: "12px"
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-rose)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                  title="Remove accommodation"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Notes Sub-Panel */}
                            {isExpanded && (
                              <div
                                style={{
                                  borderTop: "1px solid var(--border-color)",
                                  backgroundColor: "var(--bg-sidebar)",
                                  padding: "12px 14px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px"
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px"
                                  }}
                                >
                                  <StickyNote size={12} />
                                  Implementation & Observation Notes
                                </div>

                                {accom.notes && accom.notes.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {accom.notes
                                      .slice()
                                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                                      .map((note, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            backgroundColor: "var(--bg-primary)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "6px",
                                            padding: "8px 10px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px"
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center"
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: "10.5px",
                                                fontWeight: "600",
                                                color: "var(--accent-purple)",
                                                backgroundColor: "rgba(168, 85, 247, 0.1)",
                                                padding: "2px 6px",
                                                borderRadius: "4px"
                                              }}
                                            >
                                              📅 {note.date}
                                            </span>
                                            <div style={{ display: "flex", gap: "4px" }}>
                                              <button
                                                type="button"
                                                onClick={() => editNote(originalIdx, i)}
                                                style={{
                                                  background: "none",
                                                  border: "none",
                                                  color: "var(--text-muted)",
                                                  cursor: "pointer",
                                                  padding: "2px 4px",
                                                  display: "flex",
                                                  alignItems: "center"
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-purple)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                                title="Edit note"
                                              >
                                                <Edit2 size={12} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => deleteNote(originalIdx, i)}
                                                style={{
                                                  background: "none",
                                                  border: "none",
                                                  color: "var(--text-muted)",
                                                  cursor: "pointer",
                                                  padding: "2px 4px",
                                                  display: "flex",
                                                  alignItems: "center"
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-rose)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                                title="Delete note"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "12.5px",
                                              color: "var(--text-main)",
                                              lineHeight: "1.4"
                                            }}
                                          >
                                            {note.text}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--text-muted)",
                                      fontStyle: "italic",
                                      padding: "4px 0"
                                    }}
                                  >
                                    No notes added yet for this accommodation.
                                  </div>
                                )}

                                {/* Add Note Input */}
                                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={accomNoteInput[originalIdx] || ""}
                                    onChange={(e) =>
                                      setAccomNoteInput((prev) => ({
                                        ...prev,
                                        [originalIdx]: e.target.value
                                      }))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && addNote(originalIdx)}
                                    placeholder="Add implementation note or teacher feedback..."
                                    style={{ flexGrow: 1, padding: "6px 10px", fontSize: "12px" }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => addNote(originalIdx)}
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      backgroundColor: "var(--accent-purple)"
                                    }}
                                  >
                                    <Plus size={13} />
                                    Add Note
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {(!selectedStudent.accommodations || selectedStudent.accommodations.filter(a => !a.deleted).length === 0) && (
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "14px", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                        No accommodations logged yet.
                      </p>
                    )}
                  </div>
                </div>

              {/* IEP Meeting Prep & Data Mining Workspace */}
              <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                <h4 style={{ fontSize: "14px", color: "var(--accent-purple)", marginBottom: "8px", textTransform: "uppercase", display: "flex", gap: "6px", alignItems: "center" }}>
                  <ClipboardList size={16} />
                  IEP Meeting Prep & Data Mining
                </h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>Current TCAP Score</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. 98%ile ELA"
                        value={selectedStudent.iepDataMinedCurrentTcap || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMinedCurrentTcap: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMinedCurrentTcap: e.target.value });
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>Previous TCAP Score</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. 95%ile Math"
                        value={selectedStudent.iepDataMinedPrevTcap || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMinedPrevTcap: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMinedPrevTcap: e.target.value });
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>Mastery Connect Benchmark</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Math 92% Mastery"
                        value={selectedStudent.iepDataMinedMasteryConnect || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMinedMasteryConnect: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMinedMasteryConnect: e.target.value });
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>AIMSweb Reading Fluency</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. 145 WPM (96th)"
                        value={selectedStudent.iepDataMinedAimsWeb || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMinedAimsWeb: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMinedAimsWeb: e.target.value });
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>Savvas Math Data</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. Algebra 88%"
                        value={selectedStudent.iepDataMinedSavvas || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMinedSavvas: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMinedSavvas: e.target.value });
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px" }}>Zoom Virtual Meeting Link</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="e.g. rcschools.zoom.us/j/..."
                        value={selectedStudent.iepZoomLink || ""}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepZoomLink: e.target.value };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepZoomLink: e.target.value });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px" }}>Student Transition Goals ({selectedStudent.grade} Grade template)</label>
                    <textarea 
                      rows={2}
                      className="textarea-field" 
                      style={{ fontSize: "12px", padding: "6px 10px" }}
                      placeholder={
                        selectedStudent.grade === "8th" 
                          ? "8th Grade: High school transition planning, course selections, and self-advocacy goals..."
                          : "Transition goals: academic self-monitoring, career awareness interest checklists..."
                      }
                      value={selectedStudent.iepTransitionGoals || ""}
                      onChange={(e) => {
                        const updated = { ...selectedStudent, iepTransitionGoals: e.target.value };
                        setSelectedStudent(updated);
                        updateStudent(selectedStudent.id, { iepTransitionGoals: e.target.value });
                      }}
                    />
                  </div>

                  {/* Button to complete data mining checklist */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <label style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                      <input 
                        type="checkbox"
                        checked={selectedStudent.iepDataMiningCompleted || false}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepDataMiningCompleted: e.target.checked };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepDataMiningCompleted: e.target.checked });
                        }}
                      />
                      <span>Mark Data Mining Completed</span>
                    </label>
                    <label style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                      <input 
                        type="checkbox"
                        checked={selectedStudent.iepTransitionSurveyCompleted || false}
                        onChange={(e) => {
                          const updated = { ...selectedStudent, iepTransitionSurveyCompleted: e.target.checked };
                          setSelectedStudent(updated);
                          updateStudent(selectedStudent.id, { iepTransitionSurveyCompleted: e.target.checked });
                        }}
                      />
                      <span>Mark Transition Survey Completed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Wizard Modal */}
      {showImportWizard && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            width: "100%",
            maxWidth: "700px",
            maxHeight: "85vh",
            overflowY: "auto",
            border: "1px solid var(--accent-purple)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
          }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSpreadsheet size={22} color="var(--accent-purple)" />
                <h2 style={{ fontSize: "18px", margin: 0 }}>Caseload CSV Import Wizard</h2>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => {
                  setShowImportWizard(false);
                  setWizardStep(1);
                }}
              >
                Cancel
              </button>
            </div>

            {/* Step 1: File Upload */}
            {wizardStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: "8px",
                  padding: "40px 20px",
                  backgroundColor: "var(--bg-primary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px"
                }}
                onClick={() => document.getElementById("csv-file-input").click()}
                >
                  <Upload size={32} color="var(--text-muted)" />
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-heading)" }}>Upload caseload spreadsheet</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Drag and drop your .csv file here, or click to browse</span>
                  <input 
                    type="file" 
                    id="csv-file-input" 
                    accept=".csv" 
                    style={{ display: "none" }} 
                    onChange={handleFileUpload} 
                  />
                </div>

                <div style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  textAlign: "left",
                  fontSize: "12px"
                }}>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "var(--text-heading)" }}>
                    <Info size={14} color="var(--accent-purple)" />
                    CSV File Template Guide
                  </h4>
                  <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
                    Ensure your spreadsheet contains column headers. Aegis will automatically attempt to match the columns, but you will be able to review and manually map them next.
                  </p>
                  <div style={{ fontFamily: "monospace", padding: "8px", backgroundColor: "var(--bg-primary)", borderRadius: "4px", border: "1px solid var(--border-color)", overflowX: "auto" }}>
                    Name, Grade, Teacher, IEP Date, Re-eval Date, Accommodations
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Mapping Wizard */}
            {wizardStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0 }}>
                  Aegis has analyzed your CSV headers. Please map them to the corresponding student profile fields.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { key: "name", label: "Student Full Name", req: true },
                    { key: "grade", label: "Grade Level", req: false },
                    { key: "classroomTeacher", label: "Classroom Teacher", req: false },
                    { key: "iepDueDate", label: "IEP Due Date", req: false },
                    { key: "reevalDueDate", label: "Triennial Re-evaluation Date", req: false },
                    { key: "accommodations", label: "Accommodations List", req: false }
                  ].map((field) => (
                    <div key={field.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>
                        {field.label} {field.req && <span style={{ color: "var(--accent-rose)" }}>*</span>}
                      </span>
                      <select 
                        className="select-field"
                        style={{ padding: "6px 10px", fontSize: "12px", width: "100%" }}
                        value={columnMapping[field.key]}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                      >
                        <option value="">-- Ignore / Skip Column --</option>
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button className="btn btn-primary" onClick={handleBuildPreview}>
                    Next: Review Mapped Data
                    <ArrowRight size={14} style={{ marginLeft: "6px" }} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Verification & Preview */}
            {wizardStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "var(--text-heading)" }}>
                      Caseload Verification Summary
                    </h4>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                      Total rows parsed: {csvRows.length} | Valid to import: {importPreviewData.filter(s => s.isValid).length}
                    </p>
                  </div>
                  {importPreviewData.some(s => !s.isValid) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--accent-rose)", fontWeight: "600", padding: "6px 10px", borderRadius: "6px", backgroundColor: "var(--accent-rose-light)" }}>
                      <AlertCircle size={14} />
                      Warning: Some rows contain invalid dates (must be YYYY-MM-DD) or missing data and will be skipped.
                    </div>
                  )}
                </div>

                {/* Table Preview */}
                <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px", maxHeight: "300px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>Status</th>
                        <th style={{ padding: "10px" }}>Name</th>
                        <th style={{ padding: "10px" }}>Grade</th>
                        <th style={{ padding: "10px" }}>Teacher</th>
                        <th style={{ padding: "10px" }}>IEP Date</th>
                        <th style={{ padding: "10px" }}>Re-eval Date</th>
                        <th style={{ padding: "10px" }}>Accommodations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.map((row, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: "1px solid var(--border-color)", 
                          backgroundColor: row.isValid ? "transparent" : "var(--accent-rose-light)",
                          opacity: row.isValid ? 1 : 0.8
                        }}>
                          <td style={{ padding: "10px", fontWeight: "700", color: row.isValid ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                            {row.isValid ? "Valid" : "Skip"}
                          </td>
                          <td style={{ padding: "10px", fontWeight: row.validationErrors.name ? "700" : "500", color: row.validationErrors.name ? "var(--accent-rose)" : "inherit" }}>
                            {row.name || "(Missing)"}
                          </td>
                          <td style={{ padding: "10px", fontWeight: row.validationErrors.grade ? "700" : "500", color: row.validationErrors.grade ? "var(--accent-rose)" : "inherit" }}>
                            {row.grade || "(Not Set)"}
                          </td>
                          <td style={{ padding: "10px", fontWeight: row.validationErrors.classroomTeacher ? "700" : "500", color: row.validationErrors.classroomTeacher ? "var(--accent-rose)" : "inherit" }}>
                            {row.classroomTeacher || "(Not Set)"}
                          </td>
                          <td style={{ padding: "10px", fontWeight: row.validationErrors.iepDueDate ? "700" : "500", color: row.validationErrors.iepDueDate ? "var(--accent-rose)" : "inherit" }}>
                            {row.iepDueDate || "(Not Set)"}
                          </td>
                          <td style={{ padding: "10px", fontWeight: row.validationErrors.reevalDueDate ? "700" : "500", color: row.validationErrors.reevalDueDate ? "var(--accent-rose)" : "inherit" }}>
                            {row.reevalDueDate || "(Not Set)"}
                          </td>
                          <td style={{ padding: "10px", color: "var(--text-muted)" }}>
                            {row.accommodations.join(", ") || "None"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={() => setWizardStep(2)}>
                    Back to Mapping
                  </button>
                  <button className="btn btn-primary" onClick={handleFinalizeImport}>
                    Confirm & Bulk Import ({importPreviewData.filter(s => s.isValid).length} Students)
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
