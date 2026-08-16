import {
  Dashboard,
  MenuBook,
  Science,
  Public,
  AccountBalance,
  Groups,
  School,
  Flag,
  People,
  Verified,
  SupervisorAccount,
  ManageAccounts,
  Assignment,
  WorkspacePremium,
  Description,
  LibraryBooks,
  Build,
  Link,
  QrCode,
  SupportAgent,
  AssignmentTurnedIn,
  Analytics,
  Group as GroupIcon,
  ConfirmationNumber,
  ListAlt,
  AssignmentInd,
  AccountTree,
  Assessment,
  Settings,
  CloudUpload,
  EventAvailable,
  Payment,
  PeopleAlt,
  CardMembership,
  Badge as BadgeIcon,
  Hotel,
  Person,
  FlagCircleRounded,
} from "@mui/icons-material";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import React from "react";

// Configuration for which side navigation items each role should see.
export const ROLE_ROUTES = {
  // Navigation items for the Student default role
  STUDENT: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Academics", path: "/academics", icon: <MenuBook /> },
  ],

  // Navigation items for the Faculty default role
  FACULTY: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Academics", path: "/teaching", icon: <MenuBook /> },
    {
      text: "Research",

      icon: <Science />,
      nested: [
        { text: "Journal", path: "/research/journal-publication" },
        { text: "Conference", path: "/research/conference-publication" },
        { text: "Book Chapter", path: "/research/book-chapter-publication" },
        { text: "Text Book", path: "/research/textbook-publication" },
        { text: "Patent", path: "/research/patent-publication" },
        { text: "Funded Project", path: "/research/funded-project" },
        { text: "Consultancy", path: "/research/consultancy-publication" },
        { text: "Ph.D. Scholars", path: "/research/phd-scholars" },
        { text: "Novel Products / Tech", path: "/research/novel-products" },
        { text: "My Research Metrics", path: "/faculty/my-research-metrics", icon: <Assessment /> },

      ],
    },

    // { text: "Interpersonal", path: "/interpersonal", icon: <Groups /> },
    {
      text: "Value addition",
      icon: <AccountBalance />,
      nested: [
        { text: "Resource Utilization", path: "/value-addition/resource-utilization", icon: <Assignment /> },
        { text: "Contribution", path: "/value-addition/contribution", icon: <WorkspacePremium /> },
      ],
    },
    // { text: "Administration", path: "/faculty/administration", icon: <AccountBalance /> },
    // { text: "Event Coordination", path: "/faculty/event-coordination", icon: <Groups /> },
    { text: "Self Appraisal", path: "/faculty/appraisal", icon: <Description /> },
    {
      text: "Utilities",
      icon: <Build />,
      nested: [
        { text: "Shorten URL", path: "/utilities/shorten-url", icon: <Link /> },
        { text: "Generate QR Code", path: "/utilities/generate-qr", icon: <QrCode /> },
        { text: "SDG's", path: "/research/sdg" },
      ]
    },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Raise Ticket", path: "/service-desk/raise", icon: <ConfirmationNumber /> },
        { text: "My Tickets", path: "/service-desk/my-tickets", icon: <ListAlt /> },
      ]
    }
  ],

  UNIPRIME: [
    {
      text: "Dashboard",
      path: "/dashboard",
      icon: <Dashboard />,
    },
    {
      text: "Academics",
      icon: <School />,
      nested: [
        {
          text: "Academic Management",
          path: "/academics/management",
        },
        {
          text: "Department Management",
          path: "/academics/department",
        },
      ],
    },
    {
      text: "Users & Roles",
      path: "/role-management",
      icon: <People />
    },
    // {
    //   text: "Students",
    //   icon: <PersonIcon />,
    //   nested: [
    //     {
    //       text: "Student Data Management",
    //       path: "/student/student-uploads"
    //     },
    //     {
    //       text: "Assigned Students",
    //       path: "/student/assigned-students"
    //     }
    //   ]
    // },
    {
      text: "SDG Management",
      path: "/uniprime/sdg-management",
      icon: <Public />
    },
    {
      text: "Appraisal",
      icon: <ManageAccounts />,
      nested: [
        {
          text: "Appraisal Settings",
          path: "/uniprime/appraisal-settings",
          icon: <Settings />
        },
        {
          text: "Appraisal Reports",
          path: "/uniprime/appraisal-reports",
          icon: <Assessment />
        },
      ]
    },
    { text: "Research Uploads", path: "/uniprime/research-uploads", icon: <CloudUpload /> },
    {
      text: "Utilities",
      icon: <Build />,
      nested: [
        { text: "Manage Shorten URL", path: "/utilities/manage-shorten-url", icon: <Link /> },
        { text: "Manage QR Code", path: "/utilities/manage-qr", icon: <QrCode /> }
      ]
    },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Manage Services", path: "/service-desk/admin/manage-services", icon: <AccountTree /> },
        { text: "Reports", path: "/service-desk/reports", icon: <Assessment /> },
        { text: "Feedback Analytics", path: "/service-desk/admin/feedback", icon: <Analytics /> }
      ]
    }
  ],

  // Example for a future "Department HOD" role
  "HOD": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Approvals",
      icon: <Verified />,
      nested: [
        {
          text: "Research",
          path: "/hod/research-approvals",
          icon: <Science />
        },
        // {
        //   text: "Proctoring Verification",
        //   icon: <SupervisorAccount />
        // },

        // {
        //   text: "Administration Verification",
        //   icon: <AccountBalance />
        // },
        {
          text: "Appraisal Verification",
          path: "/hod/appraisal-verification",
          icon: <Description />
        },
      ]
    },
    { text: "Staff Directory", path: "/hod/staff", icon: <People /> },
  ],

  // "SCHOOL_DEAN" role (same access as HOD but for their schools)
  "SCHOOL_DEAN": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Approvals",
      icon: <Verified />,
      nested: [
        {
          text: "Research",
          path: "/hod/research-approvals",
          icon: <Science />
        },
        {
          text: "Appraisal Verification",
          path: "/appraisal/management-evaluate",
          icon: <Description />
        },
      ]
    },
    { text: "Staff Directory", path: "/hod/staff", icon: <People /> },
  ],

  // Common Management appraisal layout
  PRO_VICE_CHANCELLOR_E_S: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  PRO_VICE_CHANCELLOR_A: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  PRO_VICE_CHANCELLOR_S_P: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  VICE_CHANCELLOR: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  DY_PRO_CHANCELLOR: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  REGISTRAR: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  DEAN_IQAC: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],
  DEAN_ADMISSIONS: [{ text: "Dashboard", path: "/dashboard", icon: <Dashboard /> }, { text: "Appraisal Verification", path: "/appraisal/management-evaluate", icon: <Description /> }],

  // Example for "Exam Section" role
  EXAMSECTION: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    // { text: "Results Upload", path: "/exam-admin", icon: <Dashboard /> },
    {
      text: "Results Upload",
      icon: <MenuBook />,
      nested: [
        { text: "Faculty Format", path: "/exam-result/faculty-format" },

        { text: "Students Format", path: "/exam-result/students-format" },
      ],
    },
    { text: "Discrepancies", path: "/exam-result/discrepancies", icon: <Flag /> },
  ],

  // Example for "Research Feedback Committee"
  RESEARCH_FEEDBACK_COMMITTEE: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Feedback Reports", path: "/feedback-reports", icon: <Science /> },
  ],

  // Feedback Coordinator
  FEEDBACK_COORDINATOR: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Feedback Management", path: "/feedback-management", icon: <MenuBook /> },
    { text: "Proctoring Upload", path: "/uniprime/proctoring-upload", icon: <Assignment /> },
    {
      text: "Discrepancies",
      icon: <Flag />,
      nested: [
        { text: "Feedback", path: "/feedback-management/discrepancies", icon: <Flag /> },
        { text: "Proctoring", path: "/uniprime/discrepancies", icon: <FlagCircleRounded /> },
      ],
    },
  ],

  "RESEARCH_DEAN": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Approvals",
      icon: <Verified />,
      nested: [
        {
          text: "Research",
          path: "/research-dean/approvals"
        },
        // {
        //   text: "Appraisal Finalization",
        //   path: "/research-dean/appraisal-finalization",
        //   icon: <Description />
        // },
        {
          text: "Reports",
          path: "/research-dean/reports"
        }
      ]
    },
    { text: "Reference Journals", path: "/research-dean/reference-journals", icon: <LibraryBooks /> },
    { text: "Author Citations", path: "/research-dean/author-citations", icon: <Assignment /> },
  ],

  "RESEARCH_COORDINATOR": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Approvals",
      icon: <Verified />,
      nested: [
        {
          text: "Research",
          path: "/research-coordinator/approvals"
        },
        {
          text: "Appraisal Finalization",
          path: "/research-coordinator/appraisal-finalization",
          icon: <Description />
        },
        {
          text: "Reports",
          path: "/research-coordinator/reports"
        }
      ]
    },
    { text: "Reference Journals", path: "/research-coordinator/reference-journals", icon: <LibraryBooks /> },
    { text: "Author Citations", path: "/research-coordinator/author-citations", icon: <Assignment /> },

  ],

  STAFF: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Utilities",
      icon: <Build />,
      nested: [
        { text: "Shorten URL", path: "/utilities/shorten-url", icon: <Link /> },
        { text: "Generate QR Code", path: "/utilities/generate-qr", icon: <QrCode /> }
      ]
    },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Raise Ticket", path: "/service-desk/raise" },
        { text: "My Tickets", path: "/service-desk/my-tickets" },
      ]
    }
  ],

  TECHNICAL_STAFF: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Utilities",
      icon: <Build />,
      nested: [
        { text: "Shorten URL", path: "/utilities/shorten-url", icon: <Link /> },
        { text: "Generate QR Code", path: "/utilities/generate-qr", icon: <QrCode /> }
      ]
    },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Raise Ticket", path: "/service-desk/raise" },
        { text: "My Tickets", path: "/service-desk/my-tickets" },
      ]
    }
  ],

  SERVICE_ADMIN: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },

    { text: "Service Team", path: "/service-desk/admin/team", icon: <GroupIcon /> },
    { text: "Manage Tickets", path: "/service-desk/admin/services", icon: <AssignmentTurnedIn /> },
    { text: "Reports", path: "/service-desk/reports", icon: <Analytics /> },
    { text: "Feedback Analytics", path: "/service-desk/admin/feedback", icon: <Analytics /> },

  ],

  SERVICE_EMP: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Assigned to Me", path: "/service-desk/assigned-to-me", icon: <AssignmentInd /> },
  ],

  STUDENT_EVENT_ADMIN: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    // { text: "Student Event Admin", path: "/student-event-admin", icon: <AssignmentInd /> },
    // { text: "Club Management", path: "/student-event-admin/clubs", icon: <Groups /> },
    // { text: "Event Assignment", path: "/student-event-admin/event-assignments", icon: <AssignmentInd /> },
    {
      text: "VEDA EVENT ",
      icon: <SupportAgent />,
      nested: [
        { text: "Organisation Committee", path: "/Eventveda/organisation-committee", icon: <Groups /> },
        { text: "Departments", path: "/Eventveda/departments", icon: <AccountTree /> },
        {
          text: "Infrastructure",
          icon: <AccountBalance />,
          nested: [
            { text: "Building", path: "/infrastructure/building", icon: <AccountBalance /> },
            { text: "Floors", path: "/infrastructure/floors", icon: <AccountBalance /> },
            { text: "Grounds for outdoor", path: "/infrastructure/grounds", icon: <AccountBalance /> }
          ]
        },
        {
          text: "Groups",
          icon: <Groups />,
          nested: [
            { text: "List", path: "/Eventveda/groups", icon: <Groups /> },
            { text: "Coordinators", path: "/Eventveda/groups/coordinators", icon: <Person /> }
          ]
        },
        {
          text: "Events",
          icon: <EventAvailable />,
          nested: [
            { text: "List", path: "/Eventveda/events", icon: <EventAvailable /> },
            { text: "Faculty Coordinators", path: "/Eventveda/events/coordinators", icon: <Person /> }
          ]
        },
        { text: "Payments", path: "/Eventveda/payments", icon: <Payment /> },
        { text: "Registrations", path: "/Eventveda/registrations", icon: <PeopleAlt /> },
        {
          text: "Participants",
          icon: <Groups />,
          nested: [
            { text: "All", path: "/Eventveda/participants/all", icon: <Groups /> },
            { text: "Accommodation", path: "/Eventveda/participants/accommodation", icon: <Hotel /> },
            { text: "No Accommodation", path: "/Eventveda/participants/no-accommodation", icon: <Hotel /> }
          ]
        },
        {
          text: "Student Passes",
          icon: <SupportAgent />,
          nested: [
            { text: "Scan for Attendance", path: "/Eventveda/scan-pass", icon: <QrCode /> },
            { text: "Passes", path: "/Eventveda/passes", icon: <CardMembership /> },
            { text: "Update Passes", path: "/Eventveda/update-passes", icon: <CardMembership /> }
          ]
        },
        {
          text: "Certificates",
          icon: <WorkspacePremium />,
          nested: [
            { text: "Winning Certificates", path: "/Eventveda/winning-certificates", icon: <WorkspacePremium /> },
            { text: "Participation Certificates", path: "/Eventveda/participation-certificates", icon: <WorkspacePremium /> }
          ]
        }
      ]
    },
    // { text: "Send Mail", path: "/Eventveda/send-mail", icon: <EmailIcon /> }
    //   nested: [
    //     { text: "Raise Ticket", path: "/service-desk/raise" },
    //     { text: "My Tickets", path: "/service-desk/my-tickets" },
    //   ]
    // }

  ],

  CONVENER: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Fest", path: "/convener/fests", icon: <Groups /> },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Raise Ticket", path: "/service-desk/raise" },
        { text: "My Tickets", path: "/service-desk/my-tickets" },
      ]
    }
  ],

  MAJOR_EVENT_ADMIN: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Fest Groups", path: "/major-event-admin/groups", icon: <Groups /> },
    {
      text: "Form Assign",
      icon: <Assignment />,
      nested: [
        { text: "Configuration", path: "/major-event-admin/form-assign" },
        { text: "Preview Forms", path: "/major-event-admin/form-preview" }
      ]
    },
    {
      text: "Service Desk",
      icon: <SupportAgent />,
      nested: [
        { text: "Raise Ticket", path: "/service-desk/raise" },
        { text: "My Tickets", path: "/service-desk/my-tickets" },
      ]
    }
  ],

  EVENT_COORDINATOR: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Infrastructure",
      icon: <AccountBalance />,
      nested: [
        { text: "Building", path: "/infrastructure/building", icon: <AccountBalance /> },
        { text: "Floors", path: "/infrastructure/floors", icon: <AccountBalance /> },
        { text: "Grounds for outdoor", path: "/infrastructure/grounds", icon: <AccountBalance /> }
      ]
    },
    {
      text: "Events",
      icon: <EventAvailable />,
      nested: [
        { text: "List", path: "/Eventveda/events", icon: <EventAvailable /> },
        { text: "Faculty Coordinators", path: "/Eventveda/events/coordinators", icon: <Person /> }
      ]
    },
    { text: "Payments", path: "/Eventveda/payments", icon: <Payment /> },
    { text: "Registrations", path: "/Eventveda/registrations", icon: <PeopleAlt /> },
    {
      text: "Participants",
      icon: <Groups />,
      nested: [
        { text: "All", path: "/Eventveda/participants/all", icon: <Groups /> },
        { text: "Accommodation", path: "/Eventveda/participants/accommodation", icon: <Hotel /> },
        { text: "No Accommodation", path: "/Eventveda/participants/no-accommodation", icon: <Hotel /> }
      ]
    },
    {
      text: "Student Passes",
      icon: <SupportAgent />,
      nested: [
        { text: "Passes", path: "/Eventveda/passes", icon: <CardMembership /> },
        { text: "Update Passes", path: "/Eventveda/update-passes", icon: <CardMembership /> }
      ]
    }
  ],

  FACULTY_COORDINATOR: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Events", path: "/Eventveda/events", icon: <EventAvailable /> },
    { text: "Payments", path: "/Eventveda/payments", icon: <Payment /> },
    { text: "Registrations", path: "/Eventveda/registrations", icon: <PeopleAlt /> },
    { text: "Participants", path: "/Eventveda/participants", icon: <Groups /> },
    {
      text: "Student Passes",
      icon: <SupportAgent />,
      nested: [
        { text: "Scan for Attendance", path: "/Eventveda/scan-pass", icon: <QrCode /> },
        { text: "Passes", path: "/Eventveda/passes", icon: <CardMembership /> },
        { text: "Update Passes", path: "/Eventveda/update-passes", icon: <CardMembership /> }
      ]
    },
    {
      text: "Certificates",
      icon: <WorkspacePremium />,
      nested: [
        { text: "Winning Certificates", path: "/Eventveda/winning-certificates", icon: <WorkspacePremium /> },
        { text: "Participation Certificates", path: "/Eventveda/participation-certificates", icon: <WorkspacePremium /> }
      ]
    }
  ],

  // ACCOMMODATION Coordinator
  ACCOMMODATION_COORDINATOR: [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    {
      text: "Participants",
      icon: <Groups />,
      nested: [
        { text: "All", path: "/Eventveda/participants/all", icon: <Groups /> },
        { text: "Accommodation", path: "/Eventveda/participants/accommodation", icon: <Hotel /> },
        { text: "No Accommodation", path: "/Eventveda/participants/no-accommodation", icon: <Hotel /> }
      ]
    },
    { text: "Scan for Accommodation", path: "/Eventveda/scan-accommodation", icon: <QrCode /> }
  ],


};
