import { BRAND_CONFIG, getDevelopers } from './branding'

export const APP_NAME = BRAND_CONFIG.name
export const APP_SUBTITLE = BRAND_CONFIG.subtitle
export const APP_TAGLINE = BRAND_CONFIG.tagline
export const APP_DESCRIPTION = BRAND_CONFIG.shortDescription
export const TEAM_MIN_MEMBERS = 1
export const TEAM_MAX_MEMBERS = 3
export const DEFAULT_MAX_TEAMS_PER_UNIVERSITY = 6
export const RULES_VERSION = '1.0'

/** Universities offered in the team registration form. "Other" allows any institution. */
export const UNIVERSITIES = [
  'COMSATS University Islamabad (CUI)',
  'COMSATS University Islamabad — Vehari Campus',
  'COMSATS University Islamabad — Lahore Campus',
  'COMSATS University Islamabad — Wah Campus',
  'COMSATS University Islamabad — Abbottabad Campus',
  'National University of Sciences & Technology (NUST)',
  'FAST National University (FAST-NU)',
  'University of Engineering & Technology (UET) Lahore',
  'Punjab University College of Information Technology (PUCIT)',
  'Government College University (GCU) Lahore',
  'Air University',
  'Bahria University',
  'Riphah International University',
  'University of Central Punjab (UCP)',
  'University of Management & Technology (UMT)',
  'Other',
] as const

export const DEVELOPERS = getDevelopers()
// Backward compatibility exports
export const DEVELOPER_NAME = DEVELOPERS[0].name
export const DEVELOPER_TITLE = DEVELOPERS[0].title
export const DEVELOPER_LINKEDIN_URL = DEVELOPERS[0].linkedinUrl

export const COMPETITION_SUBJECTS = [
  { name: 'Programming Fundamentals', icon: 'Code2', description: 'Variables, data types, control structures, functions, recursion, and basic algorithm design.' },
  { name: 'Object Oriented Programming', icon: 'Layers', description: 'Classes, objects, inheritance, polymorphism, encapsulation, abstraction, and design patterns.' },
  { name: 'Data Structures & Algorithms', icon: 'GitBranch', description: 'Arrays, linked lists, trees, graphs, heaps, hash tables, sorting, searching, and dynamic programming.' },
  { name: 'Database Systems', icon: 'Database', description: 'Relational databases, SQL, normalization, transactions, ACID properties, indexing, and query optimization.' },
  { name: 'Computer Networks', icon: 'Network', description: 'OSI/TCP-IP models, protocols, routing, switching, DNS, HTTP, and network security fundamentals.' },
  { name: 'Software Engineering', icon: 'Cpu', description: 'SDLC models, requirements engineering, design, testing, project management, and agile practices.' },
  { name: 'Operating Systems', icon: 'Server', description: 'Process management, memory management, file systems, scheduling, synchronization, and deadlocks.' },
] as const

export const ROUNDS_INFO = [
  {
    number: 1,
    name: 'Round 1 — MCQ Screening',
    type: 'mcq_screening' as const,
    questions: 5,
    timePerQuestion: 30,
    points: '+1 correct / No negative marking',
    qualification: 'Top 80% qualify for Round 2',
    isOnline: true,
    badge: 'Online',
  },
  {
    number: 2,
    name: 'Round 2 — MCQ Screening',
    type: 'mcq_screening' as const,
    questions: 5,
    timePerQuestion: 45,
    points: '+1 correct / No negative marking',
    qualification: 'Top 4 teams qualify for Round 3',
    isOnline: true,
    badge: 'Online / Physical',
  },
  {
    number: 3,
    name: 'Round 3 — Rapid Fire',
    type: 'rapid_fire' as const,
    questions: null,
    timePerQuestion: null,
    points: '+1 correct / No negative marking',
    qualification: 'Top 2 teams proceed to the final',
    isOnline: false,
    badge: 'Physical (Organizer Console)',
    details: [
      '3 minutes total per team (configurable)',
      'Questions auto-skip after 3 seconds (configurable)',
      'Skipped questions are NOT repeated',
      '+1 for each correct answer',
    ],
  },
  {
    number: 4,
    name: 'Round 4 — Buzzer Final',
    type: 'buzzer' as const,
    questions: null,
    timePerQuestion: 10,
    points: '+1 correct / −0.5 incorrect',
    qualification: 'Championship round — 1 winner',
    isOnline: false,
    badge: 'Physical (Buzzer Console)',
    details: [
      'First eligible buzzer press receives the answering opportunity',
      '10 seconds to answer after buzz',
      'Turn passes if unanswered in time',
      'Organizer-defined warning or penalty for premature/unnecessary buzzes',
    ],
  },
] as const

export const TEAM_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  disqualified: 'Disqualified',
}

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
  { href: '/admin/registrations', label: 'Registrations', icon: 'ClipboardList' },
  { href: '/admin/teams', label: 'Teams', icon: 'Users' },
  { href: '/admin/participants', label: 'Participants', icon: 'User' },
  { href: '/admin/question-bank', label: 'Question Bank', icon: 'BookOpen' },
  { href: '/admin/subjects', label: 'Subjects', icon: 'Layers' },
  { href: '/admin/rounds', label: 'Rounds', icon: 'Trophy' },
  { href: '/admin/competition', label: 'Competition', icon: 'Settings2' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'Megaphone' },
  { href: '/admin/results', label: 'Results', icon: 'BarChart3' },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: 'Star' },
  { href: '/admin/users', label: 'Users & Roles', icon: 'ShieldCheck' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'ScrollText' },
  { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const
