# Aegis — BMS Gifted Student Needs & Timeline Tracker

A specialized, state-compliant tracking and caseload management web application built for Blackman Middle School Gifted Education facilitators. Aegis streamlines Tennessee regulatory timelines, initial screening evaluations, IEP goal monitoring, progress reporting, teacher data mining, and bi-directional cloud backup.

---

## 🌟 Key Features

* **Tennessee Timeline Countdown & Alert Engine**:
  * Real-time tracking of 60-calendar-day initial evaluations, SIGS/Renzulli teacher checklists, 10/20-day IEP parent notices, psychological evaluations, and IEP finalization windows.
  * Direct filtering on dashboard alert cards (Action Warning Timelines, Overdue Items) with automated schedule calculation skipping weekends and RCS district holiday schedules.
* **Student Directory & Caseload Management**:
  * Sort and filter by Grade, IEP Due Date, Classroom Teacher, and status.
  * Multi-selection action mode (bulk teacher update, bulk calendar dates, soft deletes).
* **Screening Center**:
  * Step-by-step pipeline for candidate referrals: Quick Cume Survey, Parental Consent, 60-Day Evaluation Testing Matrix, Informed Consent, Psychological Testing, and Placement Meetings.
  * Case closing and archiving with preservation of historical notes and score matrices.
* **Caseload CSV Import Wizard**:
  * Smart column auto-mapping, sample template download (`sample_caseload_template.csv`), and date normalizer supporting `YYYY-MM-DD`, `DD/MM/YYYY`, `DD/MM/YY`, `MM/DD/YYYY`, and `MM/DD/YY`.
* **Smart Cloud Sync (Google Drive)**:
  * Bi-directional synchronization with Google Drive using Google Identity Services (OAuth2).
  * Field-by-field diff comparison modal on data conflicts.
  * Distributed soft-deletion tombstones and instant one-click sync undo.
* **SEL Studio & Parent Portal**:
  * Student strengths, learning styles, emotional check-ins, and parent-friendly progress summaries.

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

### Run Automated Unit Tests
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
│   │   ├── Dashboard.jsx     # Overview stats, countdowns, weekly checklist
│   │   ├── Students.jsx      # Caseload directory & CSV import wizard
│   │   ├── ScreeningGrid.jsx # Multi-step screening candidate pipeline
│   │   ├── IepPlanner.jsx    # IEP goal planning & meeting workflows
│   │   ├── ProgressReports.jsx
│   │   ├── SelStudio.jsx
│   │   ├── Sidebar.jsx       # Navigation menu & [DEV] badge indicator
│   │   ├── SyncConflictModal.jsx # Visual data diff conflict resolver
│   │   └── SettingsPanel.jsx # Cloud sync, email configuration, holiday dates
│   ├── utils/
│   │   ├── studentStore.js   # State management, timeline engine, cloud sync
│   │   └── studentStore.test.js # 24 automated unit tests
│   ├── App.jsx               # Main layout & tab routing assembler
│   └── main.jsx
├── vite.config.js            # Dynamic base path resolver
└── package.json
```
