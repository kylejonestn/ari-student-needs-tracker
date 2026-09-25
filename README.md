# Aegis — BMS Gifted Student Needs & Timeline Tracker

A specialized, state-compliant tracking and caseload management web application built for Blackman Middle School Gifted Education facilitators. Aegis streamlines Tennessee regulatory timelines, initial screening evaluations, IEP goal monitoring, progress reporting, teacher data mining, and bi-directional cloud backup.

---

## 🌟 Key Features

* **Tennessee Timeline Countdown & Alert Engine**:
  * Real-time countdown tracking of 60-calendar-day initial evaluations, SIGS/Renzulli teacher checklists, 10/20-day IEP parent notices, psychological evaluations, and IEP finalization windows.
  * Direct filtering on dashboard alert cards (Action Warning Timelines, Overdue Items) with automated schedule calculation skipping weekends and RCS district holiday schedules.
* **Interactive Caseload Timeline ("Pizza Tracker")**:
  * Visual, dot-stepper timeline for every active student tracking preparation milestones from August setup through post-meeting document archiving.
  * Dedicated step pipelines for both **Annual IEPs (10 milestones)** and **Triennial Re-evaluations (13 milestones)**.
  * Granular post-meeting breakdown separating meeting finalization from subsequent teacher signatures, Pulse uploads, PWN dispatch, and physical SPED filing.
* **Main Dashboard & Due Date Synchronization**:
  * Dual planning windows: toggle between **This Week** and **Next Week** to preview upcoming deadlines.
  * Interactive action buttons directly on dashboard cards to mark items finished (Finalize Today, Mark Printed, Signatures Done, File Updated).
  * Dedicated **Post-Meeting Follow-Up & Filing Tracker** panel with real-time checkboxes, due date badges, and batch completion.
  * **Deep-Link Navigation & Smooth Anchor Jump**: Clicking any student name on Dashboard cards navigates directly to their workflow (IEP Caseload Timeline or Screening Pipeline), auto-expands the student accordion, smoothly scrolls the card into viewport center (`block: "center"`), and highlights it with a temporary focus pulse.
  * **Interactive Checklist Mode**: Optional toggleable checklist mode directly on Dashboard cards with checkmark pop animations, smooth card collapse transitions, and a 4-second undo grace period.
* **Student Directory & Caseload Management**:
  * Sort and filter by Grade, IEP Due Date, Classroom Teacher, and status.
  * Multi-selection action mode (bulk teacher update, bulk calendar dates, soft deletes).
* **Screening Center**:
  * Step-by-step pipeline for candidate referrals: Quick Cume Survey, Parental Consent, 60-Day Evaluation Testing Matrix, Informed Consent, Psychological Testing, and Placement Meetings.
  * Case closing and archiving with preservation of historical notes and score matrices.
* **Smart Cloud Sync (Google Drive)**:
  * Bi-directional synchronization with Google Drive using Google Identity Services (OAuth2).
  * Optimistic Concurrency Control (OCC) with in-flight mutex locks and automatic follow-up queueing.
  * Three-way non-clobbering local reconciliation ensuring rapid checkbox clicks and navigation changes are never reverted.
  * Field-by-field diff comparison modal on data conflicts, distributed soft-deletion tombstones, and instant one-click sync undo.
* **SEL Studio & Parent Portal**:
  * Student strengths, learning styles, emotional check-ins, and parent-friendly progress summaries.

---

## 🍕 Caseload Timeline ("Pizza Tracker") Workflows

Every active student has an interactive progress stepper ("pizza tracker") mapping state and district milestones relative to their scheduled meeting date.

### 1. Annual IEP Workflow (10 Steps)
| Step # | Milestone Label | Due Date Calculation | Key Requirements / Actions |
|---|---|---|---|
| **1** | **August Prep** | Fixed: Aug 15 | Parent intro letter sent, teacher calendar dates proposed |
| **2** | **Parent Proposal** | 25 calendar days prior | Parent proposal letter sent, email permission received |
| **3** | **Formal Invitation** | 20 calendar days prior | Formal invite sent, meeting notice waiver check |
| **4** | **Teacher Checklist** | 15 calendar days prior | Pre-Vocational dispatch, general ed teacher checklists |
| **5** | **Data Check (Mining)** | 7 school days prior | Mine TCAP, Mastery Connect, AIMSweb, Savvas scores; Transition survey |
| **6** | **Draft & Delivery** | 4 & 2 school days prior | TN Pulse draft written (4 school days); draft sent to parent (48 school hours) |
| **7** | **Meeting & Finalize** | **Day of Meeting (Day 0)** | Hold IEP meeting and finalize/lock document in TN Pulse (`iepFinalizedDate`) |
| **8** | **At-A-Glance & Signatures** | **+1 calendar day post-finalize** | Print 1-page teacher summary; collect classroom teacher signatures |
| **9** | **PWN & Uploads** | **+2 calendar days post-finalize** | Upload signed IEP to Pulse; write PWN; send parent copy; upload to SharePoint |
| **10** | **SPED File** | **+4 calendar days post-finalize** | Update physical SPED folder and complete paperwork archiving |

---

### 2. Triennial Re-evaluation Workflow (13 Steps)
| Step # | Milestone Label | Due Date Calculation | Key Requirements / Actions |
|---|---|---|---|
| **1** | **August Prep** | Fixed: Aug 15 | Proposed re-eval meeting date calendared |
| **2** | **Parent Proposal** | 25 calendar days prior | Initial contact and proposed date alignment |
| **3** | **Formal Invitation** | 20 calendar days prior | Formal Re-eval Meeting invitation sent |
| **4** | **Teacher Checklist** | 15 calendar days prior | Classroom teacher characteristic rating scales |
| **5** | **Re-eval Surveys** | 10 calendar days prior | Parent survey, teacher survey, and facilitator self-survey |
| **6** | **Direct Observation** | 13 calendar days prior | Conduct 35–40 minute student classroom observation note |
| **7** | **Psych Handoff** | 10 calendar days prior | Compile surveys & observation notes; hand off packet to School Psychologist |
| **8** | **Data Check (Mining)** | 7 school days prior | Mine standardized academic data and score matrices |
| **9** | **Draft & Delivery** | 4 & 2 school days prior | Draft IEP on TN Pulse; deliver draft to parents |
| **10** | **Meeting & Finalize** | **Day of Meeting (Day 0)** | Hold Re-eval meeting; finalize Re-eval eligibility & IEP on Pulse |
| **11** | **At-A-Glance & Signatures** | **+1 calendar day post-finalize** | Print At-A-Glance; collect teacher signatures |
| **12** | **PWN & Uploads** | **+2 calendar days post-finalize** | Upload signed IEP to Pulse; write PWN; send parent copy; SharePoint upload |
| **13** | **SPED File** | **+4 calendar days post-finalize** | Update physical SPED file in records room |

---

## 📊 Main Dashboard Due Date Synchronization

The **Main Dashboard (`Dashboard.jsx`)** acts as the central command center, synchronizing all active student milestones with real-time due dates and action controls.

### 1. Dual Planning Windows ("This Week" vs. "Next Week")
* Facilitators can toggle between **This Week** and **Next Week** to project deadlines across the current or upcoming school week (Monday 00:00 to Sunday 23:59).
* Stat cards immediately re-calculate:
  * **Due this/next week**: Counts all active tasks whose due date falls within the selected window.
  * **Overdue Items**: Highlights overdue deadlines requiring immediate action.

### 2. Tennessee Timeline & Due Summaries (Left Column)
* Pulls dynamic countdown tasks from `calculateTimelines` in `studentStore.js`.
* Each task card displays:
  * Clickable student name (deep-links directly to the student's exact step in the IEP Planner).
  * Days remaining countdown badge (`DUE TODAY`, `X Days Left`, or `X Days OVERDUE`).
  * Due date and mandatory state compliance tags.
* **In-Line Quick Actions**:
  * **Finalize Today**: Instantly sets `iepFinalizedDate` to today's date and locks the milestone.
  * **Mark Printed**: Marks the 1-page IEP At-A-Glance summary as printed.
  * **Signatures Done**: Marks classroom teacher signatures as collected.
  * **File Updated**: Marks physical SPED file archived, concluding the cycle.

### 3. Post-Meeting Follow-Up & Filing Tracker (Right Column)
* Tracks all students who have had their meeting or finalized their document but still have post-meeting filing tasks pending (`!student.iepPhysicalFileCompleted`).
* Groups tasks into 3 progressive deadline blocks with dynamic due dates:
  1. **At-A-Glance & Signatures** (+1 calendar day post-finalize)
  2. **Pulse, PWN & Parent Copy** (+2 calendar days post-finalize)
  3. **Update Physical SPED File** (+4 calendar days post-finalize)
* Checkboxes are live-bound to `studentStore.js` and auto-saved to Google Drive.
* Facilitators can click **Complete All Post-Meeting Tasks** to mark all filing steps finished in one click.

### 4. Interactive Dashboard Checklist Mode (Optional / Off by Default)
Aegis includes an optional direct checklist mode allowing facilitators to mark tasks complete directly from the main timeline cards:
* **One-Time Feature Teaser Banner**:
  * Facilitators are introduced to the feature via an elegant, non-intrusive teaser banner on the dashboard.
  * Options: **"Try It Out (Turn On)"** or **"Keep Default (Off)"**, plus one-click dismissal. Once interacted with, it never appears again (`seenChecklistTeaser`).
* **Header Checklist Mode Toggle**:
  * An in-header toggle button (`Checklist Mode: ON / OFF`) allows switching between view-only mode and interactive checklist mode anytime.
  * Also configurable in **Settings & Cloud Sync** under Workflow preferences.
* **Foolproof Checklist Safeguards**:
  * **Accidental Click Guard (4-Second Undo Grace Period)**: When a task is checked off, it remains visible with a green completed badge and an immediate **"Undo"** button for 4 seconds before smoothly dissolving from the active view.
  * **Smart Field Mapping**: Automatically populates date timestamps (`iepInvitationSentDate`, `iepFinalizedDate`, etc.) and sets composite boolean tasks safely.
  * **"Show Completed Tasks" Filter**: Toggle to review all tasks completed in the current period and uncheck/reopen any item if needed.
  * **Cloud Sync Safety**: All completions immediately benefit from the mutex lock, non-clobbering local reconciliation, and debounced Google Drive backup.

---

## ⚡ Smart Cloud Sync & Concurrency Engine

Aegis uses a multi-tier synchronization and locking architecture to prevent race conditions, stale overwrites, and state collision when clicking checkboxes quickly or moving between workstation devices.

```
User Action (Checkbox / Edit)
  │
  ├──► Immediate Local State Mutation (UI updates in 0ms)
  │
  ├──► Debounced Auto-Save Trigger (400ms delay)
  │      │
  │      ├── Lock Active? ──► Set pendingFollowupSync = true; Return in-flight Promise
  │      │
  │      └── Lock Free ────► Acquire syncInProgress Lock
  │                             │
  │                             ├── Google Drive Read & Merge (2-Way OCC)
  │                             │
  │                             ├── Pre-Save Reconciliation (Live Local Wins)
  │                             │
  │                             ├── Google Drive Direct Write (all-data.json & parent-portal.json)
  │                             │
  │                             ├── Post-Save Reconciliation (Live Local Wins)
  │                             │
  │                             └── Release Lock ──► If pendingFollowupSync: Trigger Follow-up Sync
```

* **In-Flight Mutex Lock (`syncInProgress`)**: Guarantees only one Google Drive API write occurs at a time. Rapid calls are queued cleanly.
* **Non-Clobbering Timestamp Reconciliation (`reconcileWithLiveLocal`)**: If the user checks a box while network I/O is in-flight, the live in-memory edit has a newer `updatedAt` timestamp and is **never** overwritten by older snapshot data returned from the cloud.
* **Snappy 400ms Debouncing**: Fast and responsive autosaving that batches consecutive rapid clicks into a single network operation.
* **Lifecycle Auto-Flush**: Automatically flushes pending saves immediately on `beforeunload` or when switching/minimizing browser tabs (`visibilitychange: hidden`).

---

## 📅 Tennessee Regulatory Deadlines Reference

| Milestone | Window / Buffer | Type | Reference Rule |
|---|---|---|---|
| **Initial Evaluation** | 60 Days | Calendar Days | State mandated 60-day evaluation timeline from consent |
| **IEP Parent Proposal** | 25 Days Prior | Calendar Days | Buffer to align dates with parents |
| **Formal IEP Invitation** | 20 Days Prior | Calendar Days | Formal meeting notice to parent & general ed teachers |
| **Teacher Traits Checklist** | 15 Days Prior | Calendar Days | SIGS / Renzulli rating scale check |
| **Direct Classroom Observation** | 13 Days Prior | Calendar Days | Re-evaluation direct observation note (35–40 min) |
| **Re-eval Surveys & Psych Handoff**| 10 Days Prior | Calendar Days | Parent/Teacher/Self surveys submitted to School Psych |
| **Academic Data Mining** | 7 School Days Prior | School Days | TCAP, Mastery Connect, AIMSweb, Savvas data check |
| **Student Transition Survey** | 6 School Days Prior | School Days | Grade-level transition goals survey |
| **IEP Draft Completion** | 4 School Days Prior | School Days | Comprehensive TN Pulse draft written |
| **Draft Sent to Parents** | 2 School Days Prior | School Days | 48 business/school hours advance copy rule |
| **IEP Finalization** | Day of Meeting | Calendar Days | TN Pulse document locked and finalized |
| **At-A-Glance Signatures** | +1 Day Post-Finalize | Calendar Days | Print glance summary & gather teacher signatures |
| **Pulse, PWN & Parent Copy** | +2 Days Post-Finalize | Calendar Days | Pulse upload, PWN dispatched, copy mailed/sent |
| **Physical SPED File Archive** | +4 Days Post-Finalize | Calendar Days | Permanent records folder updated |

*Note: All school day calculations skip weekends and Rutherford County Schools (RCS) calendar holidays.*

---

## 🚀 Branching & Deployment Architecture (Subfolder Routing)

This application uses a dual-environment **Subfolder Routing** deployment model on GitHub Pages via a single publishing branch (`gh-pages`).

```
GitHub Repository
 ├── main branch  ──(GitHub Actions)──► gh-pages root (/)       ──► https://kylejonestn.github.io/ari-student-needs-tracker/
 └── dev branch   ──(GitHub Actions)──► gh-pages /dev folder    ──► https://kylejonestn.github.io/ari-student-needs-tracker/dev/
```

### Live URLs

* **Production Environment (`main` branch)**:  
  🔗 [`https://kylejonestn.github.io/ari-student-needs-tracker/`](https://kylejonestn.github.io/ari-student-needs-tracker/)
* **Staging / Testing Environment (`dev` branch)**:  
  🔗 [`https://kylejonestn.github.io/ari-student-needs-tracker/dev/`](https://kylejonestn.github.io/ari-student-needs-tracker/dev/)

### How It Works

1. **Development & Testing Workflow**:
   * All new features, UI tweaks, and bug fixes are committed and pushed to the `dev` branch first.
   * GitHub Actions builds the `dev` branch with base path `/ari-student-needs-tracker/dev/` and deploys it into the `/dev/` subfolder on `gh-pages` without modifying root production files.
   * The developer/facilitator tests changes live at `.../dev/` (identified by a visual `[DEV]` badge in the sidebar header).
2. **Promoting to Production**:
   * Once changes are verified and approved, `dev` is merged into `main` and pushed.
   * GitHub Actions builds `main` with base path `/ari-student-needs-tracker/` and publishes to the root directory on `gh-pages`.
3. **Google Identity Services (OAuth2) Compatibility**:
   * Google OAuth validates authorized JavaScript origins by domain (`https://kylejonestn.github.io`). Because both production and `/dev/` share the exact same domain origin, Google Drive synchronization works on both environments without additional OAuth configurations.

---

## 🛠️ Local Development & Scripts

### Prerequisites
* Node.js (v20 or higher)
* npm

### Install Dependencies
```bash
npm install
```

### Run Local Dev Server
```bash
npm run dev
```

### Run Automated Unit Tests (48 Tests)
```bash
npm test
```

### Production Build
```bash
npm run build
```

### Staging / Dev Build
```bash
npm run build:dev
```

### Manual Deployment (Optional)
```bash
# Deploy to Production root on gh-pages
npm run deploy

# Deploy to /dev subfolder on gh-pages
npm run deploy:dev
```

---

## 📁 Repository Structure

```
├── .github/workflows/
│   └── deploy.yml            # CI/CD dual deployment to root & /dev subfolder
├── public/
│   ├── sample_caseload_template.csv  # Sample import template for teachers
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx     # Overview stats, countdowns, weekly checklist, post-meeting tracker
│   │   ├── Students.jsx      # Caseload directory & CSV import wizard
│   │   ├── ScreeningGrid.jsx # Multi-step screening candidate pipeline
│   │   ├── IepPlanner.jsx    # IEP goal planning, 10/13-step pizza tracker stepper
│   │   ├── ProgressReports.jsx
│   │   ├── SelStudio.jsx
│   │   ├── Sidebar.jsx       # Navigation menu & [DEV] badge indicator
│   │   ├── SyncConflictModal.jsx # Visual data diff conflict resolver
│   │   └── SettingsPanel.jsx # Cloud sync, email configuration, holiday dates
│   ├── utils/
│   │   ├── studentStore.js   # State management, timeline engine, OCC cloud sync
│   │   ├── driveService.js   # Google Drive API v3 client & GIS OAuth
│   │   └── studentStore.test.js # 48 automated unit tests
│   ├── App.jsx               # Main layout & tab routing assembler
│   └── main.jsx
├── vite.config.js            # Dynamic base path resolver
└── package.json
```
