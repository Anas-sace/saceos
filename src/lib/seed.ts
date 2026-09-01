import type {
  AppState,
  Perm,
  User,
  Task,
  LeaveRequest,
  LeadDataset,
  Conversation,
  Message,
  Ticket,
  RecognitionAward,
  AttendanceRecord,
  AppNotification,
} from "./types";

export const DEFAULT_ADMIN_PERMS: Perm[] = [
  "manage_users",
  "approve_leave",
  "upload_leads",
  "view_all_tickets",
  "view_reports",
  "view_all_eod",
];

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const DEFAULT_SEED_USERS: User[] = [
  {
    id: "u-superadmin",
    fullName: "Super Admin",
    username: "superadmin",
    email: "admin@sacegroup.com",
    password: "",
    designation: "Head of Operations & Technology",
    department: "Executive",
    role: "super_admin",
    reportingAdminId: null,
    active: true,
    dailyVision: "Design with purpose. Lead with kindness.",
    avatarColor: "#6366f1",
    avatarUrl: null,
    casualBalance: 12,
    sickBalance: 8,
  },
  {
    id: "u-admin",
    fullName: "Marcus Vance",
    username: "admin",
    email: "marcus@sacegroup.com",
    password: "",
    designation: "Operations Manager",
    department: "Operations",
    role: "admin",
    reportingAdminId: "u-superadmin",
    active: true,
    dailyVision: "Efficiency and excellence in every workflow.",
    avatarColor: "#0ea5e9",
    avatarUrl: null,
    casualBalance: 10,
    sickBalance: 6,
  },
  {
    id: "u-anas",
    fullName: "Anas Sace",
    username: "anas",
    email: "anas@sacegroup.com",
    password: "",
    designation: "Senior Curriculum Specialist",
    department: "Academics",
    role: "member",
    reportingAdminId: "u-admin",
    active: true,
    dailyVision: "Empowering every learner with clarity and passion.",
    avatarColor: "#f59e0b",
    avatarUrl: null,
    casualBalance: 14,
    sickBalance: 7,
  },
  {
    id: "u-sarah",
    fullName: "Sarah Jenkins",
    username: "sarah",
    email: "sarah@sacegroup.com",
    password: "",
    designation: "Admissions Coordinator",
    department: "Student Services",
    role: "member",
    reportingAdminId: "u-admin",
    active: true,
    dailyVision: "Connecting aspiring students to life-changing education.",
    avatarColor: "#ec4899",
    avatarUrl: null,
    casualBalance: 11,
    sickBalance: 5,
  },
];

const today = new Date();
const todayStr = dateKey(today);

const sampleTasks: Task[] = [
  {
    id: "task-1",
    title: "Review Q3 General English Curriculum Module",
    description: "Update student handbook and course outcome metrics for the new term intake.",
    assigneeId: "u-anas",
    assignedById: "u-admin",
    priority: "high",
    status: "in_progress",
    cadence: "today",
    startDate: todayStr,
    dueDate: todayStr,
    requiredProof: "any",
    proofs: [],
    comments: [
      {
        id: "tc-1",
        authorId: "u-admin",
        body: "Please verify that the speaking rubric is aligned with CEFR standards.",
        at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: "task-2",
    title: "Process Student Visa Documentation Batch",
    description:
      "Confirm verified passports, CoEs, and financial declarations for 12 international applicants.",
    assigneeId: "u-sarah",
    assignedById: "u-admin",
    priority: "urgent",
    status: "submitted",
    cadence: "today",
    startDate: todayStr,
    dueDate: todayStr,
    requiredProof: "file",
    proofs: [
      {
        id: "tp-1",
        type: "link",
        value: "https://drive.google.com/drive/folders/batch-august-processed",
        note: "All 12 student verification sheets uploaded and signed off.",
        submittedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    comments: [],
  },
  {
    id: "task-3",
    title: "Quarterly Departmental Resource Audit",
    description: "Audit audio-visual classroom equipment and license keys across all campus rooms.",
    assigneeId: "u-anas",
    assignedById: "u-superadmin",
    priority: "medium",
    status: "assigned",
    cadence: "quarterly",
    startDate: todayStr,
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
    requiredProof: "image",
    proofs: [],
    comments: [],
  },
];

const sampleAttendance: AttendanceRecord[] = [
  {
    id: "att-1",
    userId: "u-anas",
    date: todayStr,
    punchIn: new Date(Date.now() - 3600000 * 4).toISOString(),
    punchOut: null,
    hours: 4,
  },
  {
    id: "att-2",
    userId: "u-sarah",
    date: todayStr,
    punchIn: new Date(Date.now() - 3600000 * 5).toISOString(),
    punchOut: null,
    hours: 5,
  },
];

const sampleLeaves: LeaveRequest[] = [
  {
    id: "leave-1",
    userId: "u-anas",
    type: "casual",
    startDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10),
    halfDay: false,
    reason: "Attending professional educator accreditation symposium.",
    status: "approved",
    adminComment: "Approved. Please ensure hand-over notes are sent.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const sampleLeads: LeadDataset[] = [
  {
    id: "leads-1",
    name: "Southeast Asia Education Expo 2026",
    description: "Verified inquiries for IELTS preparation and University Pathway programs.",
    source: "sea_expo_inquiries.csv",
    uploadedById: "u-admin",
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    visibility: "public",
    locked: false,
    records: 148,
    tags: ["International", "Admissions", "IELTS"],
  },
  {
    id: "leads-2",
    name: "Corporate English Training Partnerships Q3",
    description: "Executive training leads for regional hospitality and healthcare providers.",
    source: "corporate_partnerships.xlsx",
    uploadedById: "u-superadmin",
    uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    visibility: "private",
    locked: true,
    records: 42,
    tags: ["Corporate", "Executive", "Confidential"],
  },
];

const sampleConversations: Conversation[] = [
  {
    id: "conv-1",
    name: "All Staff Announcements",
    kind: "announcement",
    participantIds: ["u-superadmin", "u-admin", "u-anas", "u-sarah"],
  },
  {
    id: "conv-2",
    name: "Academics & Operations",
    kind: "group",
    participantIds: ["u-admin", "u-anas", "u-sarah"],
  },
];

const sampleMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "u-superadmin",
    body: "Welcome to the new SACE Workforce Hub! Please remember to log your daily vision and punch in each morning.",
    at: new Date(Date.now() - 86400000 * 2).toISOString(),
    readBy: ["u-superadmin", "u-admin", "u-anas", "u-sarah"],
  },
  {
    id: "msg-2",
    conversationId: "conv-2",
    senderId: "u-admin",
    body: "Great job on completing the first round of mid-term evaluations team!",
    at: new Date(Date.now() - 3600000 * 3).toISOString(),
    readBy: ["u-admin", "u-anas"],
  },
];

const sampleTickets: Ticket[] = [
  {
    id: "t-1",
    code: "SACE-101",
    subject: "Additional Zoom Rooms license for Academic Testing",
    category: "it",
    description:
      "Requesting an extra breakout room seat license for the upcoming placement test cycle.",
    priority: "medium",
    status: "in_progress",
    createdById: "u-anas",
    ownerId: "u-admin",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    comments: [
      {
        id: "tc-1",
        authorId: "u-admin",
        body: "Checking available seats on our enterprise portal. Will update shortly.",
        at: new Date(Date.now() - 3600000 * 6).toISOString(),
        internal: false,
      },
    ],
  },
];

const sampleAwards: RecognitionAward[] = [
  {
    id: "award-1",
    userId: "u-anas",
    type: "Employee of the Month",
    period: "August 2026",
    reason: "Exceptional curriculum restructuring and dedication to student academic outcomes.",
    nominatedById: "u-superadmin",
    quote: "Anas continually sets the benchmark for pedagogical excellence and team support.",
    featured: true,
  },
  {
    id: "award-2",
    userId: "u-sarah",
    type: "Client Champion",
    period: "August 2026",
    reason: "Outstanding support for international student admissions and seamless onboarding.",
    nominatedById: "u-admin",
    quote: "Her empathetic guidance makes every new student feel welcomed from day one.",
    featured: false,
  },
];

const sampleNotifications: AppNotification[] = [
  {
    id: "notif-1",
    userId: "u-anas",
    title: "New Task Assigned",
    body: "Marcus Vance assigned you: Review Q3 General English Curriculum Module",
    at: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: false,
    href: "/tasks",
  },
  {
    id: "notif-2",
    userId: "u-anas",
    title: "Leave Request Approved",
    body: "Your casual leave request for next week has been approved.",
    at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    href: "/leave",
  },
];

export function createSeedState(): AppState {
  return {
    users: DEFAULT_SEED_USERS,
    attendance: sampleAttendance,
    tasks: sampleTasks,
    leaves: sampleLeaves,
    leads: sampleLeads,
    conversations: sampleConversations,
    messages: sampleMessages,
    tickets: sampleTickets,
    awards: sampleAwards,
    notifications: sampleNotifications,
    audit: [
      {
        id: "aud-1",
        actorId: "u-superadmin",
        action: "system_init",
        detail: "SACE Workforce Hub portal initialized with secure RBAC schema.",
        at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    ],
    eodReports: [],
    ticketSeq: 102,
    sessionUserId: null,
    adminPerms: DEFAULT_ADMIN_PERMS,
  };
}
