/* ==========================================
   Aegis Gifted Tracker - SyncConflictModal Component
   ========================================== */

import React, { useState } from "react";
import { AlertCircle, CheckCircle, X, Zap, Database, Cloud } from "lucide-react";

/**
 * Props:
 * - conflicts: array of conflict objects { id, type, name, local, cloud, keep }
 * - onResolve: function(conflicts, resolveAllNewest)
 * - onCancel: function()
 */
export default function SyncConflictModal({ conflicts = [], onResolve, onCancel }) {
  const [conflictList, setConflictList] = useState(
    conflicts.map(c => {
      const localTime = new Date(c.local?.updatedAt || 0).getTime();
      const cloudTime = new Date(c.cloud?.updatedAt || 0).getTime();
      return {
        ...c,
        keep: c.keep || (localTime >= cloudTime ? "local" : "cloud")
      };
    })
  );
  const [resolveAllNewest, setResolveAllNewest] = useState(false);

  const handleKeepChange = (id, keepChoice) => {
    setConflictList(prev =>
      prev.map(c => (c.id === id ? { ...c, keep: keepChoice } : c))
    );
  };

  const handleApply = (forceNewest = false) => {
    onResolve(conflictList, forceNewest || resolveAllNewest);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown Date";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const getRecordSummary = (item) => {
    if (!item) return "No details";
    const parts = [];
    if (item.grade) parts.push(`Grade: ${item.grade}`);
    if (item.classroomTeacher) parts.push(`Teacher: ${item.classroomTeacher}`);
    if (item.iepDueDate) parts.push(`IEP Due: ${item.iepDueDate}`);
    if (item.status) parts.push(`Status: ${item.status}`);
    if (Array.isArray(item.accommodations)) {
      parts.push(`Accoms: ${item.accommodations.length}`);
    }
    return parts.length > 0 ? parts.join(" • ") : "Record profile";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 8, 20, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(168, 85, 247, 0.4)",
          backgroundColor: "var(--bg-sidebar)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "14px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-purple)"
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>
                Cloud Sync: Data Conflicts Detected
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                {conflictList.length} record(s) differ between your device and Google Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px"
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bulk Action Strip */}
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            border: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="bulkAlwaysNewest"
              checked={resolveAllNewest}
              onChange={(e) => setResolveAllNewest(e.target.checked)}
              style={{ cursor: "pointer", width: "16px", height: "16px" }}
            />
            <label
              htmlFor="bulkAlwaysNewest"
              style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer", userSelect: "none" }}
            >
              Always choose newest timestamp
            </label>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleApply(true)}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--accent-purple)"
            }}
            title="Auto-resolve all conflicts keeping the most recent modifications and sync immediately"
          >
            <Zap size={14} />
            Always Choose Newest (Bulk Action)
          </button>
        </div>

        {/* Conflicts Scroll Area */}
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingRight: "4px"
          }}
        >
          {conflictList.map((conflict) => {
            const localTime = new Date(conflict.local?.updatedAt || 0).getTime();
            const cloudTime = new Date(conflict.cloud?.updatedAt || 0).getTime();
            const isLocalNewer = localTime >= cloudTime;

            return (
              <div
                key={conflict.id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "14px",
                  backgroundColor: "var(--bg-primary)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px"
                  }}
                >
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--accent-purple)" }}>
                    {conflict.name || conflict.id}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      backgroundColor: "var(--bg-sidebar)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)"
                    }}
                  >
                    {conflict.type === "students" ? "Student Profile" : "Screening Profile"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "8px"
                  }}
                >
                  {/* Local Option */}
                  <label
                    style={{
                      border: `1.5px solid ${
                        conflict.keep === "local" ? "var(--accent-purple)" : "var(--border-color)"
                      }`,
                      borderRadius: "8px",
                      padding: "10px",
                      cursor: "pointer",
                      backgroundColor:
                        conflict.keep === "local"
                          ? "rgba(168, 85, 247, 0.08)"
                          : "var(--bg-sidebar)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", fontSize: "12px" }}>
                        <input
                          type="radio"
                          name={`choice-${conflict.id}`}
                          value="local"
                          checked={conflict.keep === "local"}
                          onChange={() => handleKeepChange(conflict.id, "local")}
                          style={{ cursor: "pointer" }}
                        />
                        <Database size={13} color="var(--accent-purple)" />
                        <span>Local Cache</span>
                      </div>
                      {isLocalNewer && (
                        <span style={{ fontSize: "10px", color: "var(--accent-emerald)", fontWeight: "700" }}>
                          ★ Newer
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Modified: {formatDate(conflict.local?.updatedAt)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-main)", lineHeight: "1.3" }}>
                      {getRecordSummary(conflict.local)}
                    </div>
                  </label>

                  {/* Cloud Option */}
                  <label
                    style={{
                      border: `1.5px solid ${
                        conflict.keep === "cloud" ? "var(--accent-purple)" : "var(--border-color)"
                      }`,
                      borderRadius: "8px",
                      padding: "10px",
                      cursor: "pointer",
                      backgroundColor:
                        conflict.keep === "cloud"
                          ? "rgba(168, 85, 247, 0.08)"
                          : "var(--bg-sidebar)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", fontSize: "12px" }}>
                        <input
                          type="radio"
                          name={`choice-${conflict.id}`}
                          value="cloud"
                          checked={conflict.keep === "cloud"}
                          onChange={() => handleKeepChange(conflict.id, "cloud")}
                          style={{ cursor: "pointer" }}
                        />
                        <Cloud size={13} color="var(--accent-purple)" />
                        <span>Google Drive</span>
                      </div>
                      {!isLocalNewer && (
                        <span style={{ fontSize: "10px", color: "var(--accent-emerald)", fontWeight: "700" }}>
                          ★ Newer
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Modified: {formatDate(conflict.cloud?.updatedAt)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-main)", lineHeight: "1.3" }}>
                      {getRecordSummary(conflict.cloud)}
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-color)"
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleApply(false)}
              style={{
                padding: "8px 18px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <CheckCircle size={14} />
              Apply Choices & Sync to Cloud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
