/* ==========================================
   Aegis Gifted Tracker - High-Fidelity Mock Data
   ========================================== */

export const INITIAL_STUDENTS = [
  {
    id: "active-1",
    name: "Sarah Montgomery",
    grade: "7th",
    school: "Blackman Middle School",
    classroomTeacher: "Mrs. Harrison (ELA)",
    status: "Active",
    iepReviewDate: "2026-07-15", // Annual IEP Review Date
    reevalDueDate: "2027-11-20",  // Triennial Re-evaluation Date
    accommodations: [
      "Curriculum Compacting in ELA",
      "Advanced Math Tier 3",
      "Socratic Seminar Leadership Roles"
    ],
    selNeeds: {
      type: "Perfectionism & Anxiety",
      details: "Sarah struggles with fear of failure, leading to task paralysis on open-ended creative assignments.",
      strategies: ["Praising process over outcome", "Setting explicit 'done' criteria", "Safe-to-fail mini-projects"],
      logs: [
        { date: "2026-05-12", note: "Sarah completed her history portfolio without rewriting her drafts five times. Huge win for perfectionism management!" },
        { date: "2026-04-18", note: "Anxiety spike during creative writing. Reassured her that draft grading is purely participation-based." }
      ]
    },
    progressReports: [
      {
        quarter: "Q3",
        date: "2026-03-15",
        goals: [
          { title: "Advanced Analytical Reading", progress: "Achieved", comment: "Sarah consistently performs at high school standards in text analysis." },
          { title: "Managing Task Perfectionism", progress: "Progressing", comment: "Significant progress in draft completion times, though anxiety remains a trigger." }
        ]
      }
    ]
  },
  {
    id: "active-2",
    name: "Jackson Weaver",
    grade: "8th",
    school: "Blackman Middle School",
    classroomTeacher: "Mr. Thompson (Science)",
    status: "Active",
    iepReviewDate: "2026-06-08", // Annual IEP Due VERY SOON (current date: May 28, 2026)
    reevalDueDate: "2026-06-25",  // Triennial Re-evaluation Due VERY SOON
    accommodations: [
      "Twice-Exceptional (2e) ADHD Support",
      "Visual Organizers for Multi-step Science Lab Reports",
      "Alternative Assessment Portfolios"
    ],
    selNeeds: {
      type: "Asynchronous Development",
      details: "Jackson's conceptual cognitive capacity is at a high-school senior level, but his emotional self-regulation and executive functioning are typical of a 6th grader.",
      strategies: ["Executive skill scaffolding", "Dynamic interest-based pacing", "Mindfulness focus breaks"],
      logs: [
        { date: "2026-05-18", note: "Jackson organized his science project using a Kanban board. Visual tracking really helps his ADHD." }
      ]
    },
    progressReports: [
      {
        quarter: "Q3",
        date: "2026-03-15",
        goals: [
          { title: "Creative Synthesis in Lab Reports", progress: "Progressing", comment: "Jackson is brilliant conceptually, but continues to need organizers to complete written summaries." }
        ]
      }
    ]
  },
  {
    id: "active-3",
    name: "Emily Rodriguez",
    grade: "6th",
    school: "Blackman Middle School",
    classroomTeacher: "Ms. Davis (Social Studies)",
    status: "Active",
    iepReviewDate: "2027-04-10",
    reevalDueDate: "2029-04-05",
    accommodations: [
      "Independent Study Contracts in Social Studies",
      "Spanish Bilingual Advanced Literature Options"
    ],
    selNeeds: {
      type: "Sensory & Emotional Overexcitability",
      details: "Emily has intense emotional reactions and is highly empathetic, causing her to feel overwhelmed by loud classroom dynamics and peer conflicts.",
      strategies: ["Cool-down zones with advanced reading", "Peer-mediation leadership training", "Reflective journaling"],
      logs: [
        { date: "2026-05-02", note: "Emily successfully mediated a minor group dispute in history class, exhibiting great emotional leadership." }
      ]
    },
    progressReports: []
  }
];

export const INITIAL_SCREENINGS = [
  {
    id: "screen-1",
    name: "Liam Taylor",
    grade: "6th",
    school: "Blackman Middle School",
    classroomTeacher: "Ms. Davis",
    referralDate: "2026-04-10",
    consentReceivedDate: "2026-04-16", // 42 days ago (60-day deadline is June 15, 2026!)
    status: "Evaluation in Progress",
    teacherChecklistSigned: false, // Ms. Davis hasn't returned her checklist yet!
    nudgeSent: false,
    matrix: {
      cognition: { instrument: "WISC-V Full Scale IQ", score: 126, points: 20 },
      performance: { instrument: "TCAP ELA Percentile", score: 98, points: 20 },
      creativity: { instrument: "Renzulli Rating Scale", score: 0, points: 0 } // Pending Ms. Davis's checklist!
    }
  },
  {
    id: "screen-2",
    name: "Sophia Kim",
    grade: "7th",
    school: "Blackman Middle School",
    classroomTeacher: "Mr. Adams",
    referralDate: "2026-05-20",
    consentReceivedDate: "", // Parental Consent PENDING
    status: "Consent Pending",
    teacherChecklistSigned: false,
    nudgeSent: false,
    matrix: {
      cognition: { instrument: "", score: "", points: 0 },
      performance: { instrument: "", score: "", points: 0 },
      creativity: { instrument: "", score: "", points: 0 }
    }
  },
  {
    id: "screen-3",
    name: "Oliver Brown",
    grade: "6th",
    school: "Blackman Middle School",
    classroomTeacher: "Mrs. Harrison",
    referralDate: "2026-05-22",
    consentReceivedDate: "2026-05-26", // 2 days ago (58 days remaining, On Track!)
    status: "Evaluation in Progress",
    teacherChecklistSigned: true, // Signed and returned!
    nudgeSent: false,
    matrix: {
      cognition: { instrument: "RIAS-2 Verbal Intelligence", score: 132, points: 25 },
      performance: { instrument: "TCAP Math Percentile", score: 96, points: 15 },
      creativity: { instrument: "Torrance Test of Creativity", score: 88, points: 15 } // Eligible (55 total points!)
    }
  }
];

export const SEL_STRATEGY_TEMPLATES = [
  {
    need: "Perfectionism & Anxiety",
    description: "Intense desire to make all tasks perfect, causing extreme writing anxiety and task delay.",
    strategies: [
      "Draft Compacting: Allow submitting bulleted ideas rather than structured sentences for initial grading.",
      "Process over Product Praise: Verbally reward effort, research paths, and creative mistakes.",
      "Explicit 'Done' Thresholds: Define exactly what 'acceptable' work is before beginning tasks."
    ]
  },
  {
    need: "Asynchronous Development",
    description: "Vast discrepancy between high cognitive development and age-appropriate emotional, physical, or organizational development.",
    strategies: [
      "Executive Skills Scaffolding: Use visual checklist charts, color-coded folders, and digital calendars.",
      "Tiered Communication: Engage their high conceptual level while patiently guiding emotional reactions.",
      "Flexible Academic Pacing: Allow rapid deep-dives into interests, but maintain support structures."
    ]
  },
  {
    need: "Emotional & Sensory Overexcitabilities",
    description: "Highly intense emotional responses, physical sensitivity to light/noise, and deep empathy.",
    strategies: [
      "Sensory Escape Zones: Designated quiet work table inside the gifted room with noise-canceling headphones.",
      "Expressive Reflective Journaling: Allow 5 minutes of written stream-of-consciousness at the start of class.",
      "Peer Leadership Outlets: Channel high empathy into class mediation roles or reading buddies."
    ]
  },
  {
    need: "Twice-Exceptional (2e)",
    description: "Gifted students who also have a diagnosed disability (e.g. ADHD, Autism, Dyslexia).",
    strategies: [
      "Strength-Based Accommodations: Design projects leveraging their cognitive strengths (e.g. verbal presenting) rather than testing deficits (e.g. handwriting).",
      "Multisensory Task-Planning: Use Kanban boards, visual charts, and hands-on tactile organizers.",
      "High-Interest Engagement: Anchor necessary skill practice inside their active areas of special interest."
    ]
  }
];
