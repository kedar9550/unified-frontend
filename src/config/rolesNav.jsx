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
  LibraryBooks
} from "@mui/icons-material";
import PersonIcon from '@mui/icons-material/Person';
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
        { text: "SDG's", path: "/research/sdg" },
      ],
    },
    { text: "Administration", path: "/faculty/administration", icon: <AccountBalance /> },
    // { text: "Interpersonal", path: "/interpersonal", icon: <Groups /> },
    {
      text: "Value addition",
      icon: <AccountBalance />,
      nested: [
        { text: "Resource Utilization", path: "/value-addition/resource-utilization", icon: <Assignment /> },
        { text: "Contribution", path: "/value-addition/contribution", icon: <WorkspacePremium /> },
      ],
    },
    { text: "Self Appraisal", path: "/faculty/appraisal", icon: <Description /> },
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
    {
      text: "Students",
      icon: <PersonIcon />,
      nested: [
        {
          text: "Student Data Management",
          path: "/student/student-uploads"
        },
        {
          text: "Assigned Students",
          path: "/student/assigned-students"
        }
      ]
    },
    {
      text: "SDG Management",
      path: "/uniprime/sdg-management",
      icon: <Public />
    },
    {
      text: "Appraisal Settings",
      path: "/uniprime/appraisal-settings",
      icon: <ManageAccounts />
    },
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
        {
          text: "Proctoring Verification",
          path: "/hod/proctoring-approvals",
          icon: <SupervisorAccount />
        },
        {
          text: "Administration Verification",
          path: "/hod/administration-approvals",
          icon: <AccountBalance />
        },
        {
          text: "Resource Utilization",
          path: "/hod/value-addition/resource-utilization",
          icon: <Assignment />
        },
        {
          text: "Contribution",
          path: "/hod/value-addition/contribution",
          icon: <WorkspacePremium />
        },
        {
          text: "Appraisal Verification",
          path: "/hod/appraisal-verification",
          icon: <Description />
        },
      ]
    },
    // { text: "Proctordata", path: "/hod/protecrdataupload", icon: <People /> },
  ],

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
  "RESEARCH FEEDBACK COMMITTEE": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Feedback Reports", path: "/feedback-reports", icon: <Science /> },
  ],

  // Feedback Coordinator
  "FEEDBACK COORDINATOR": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Feedback Management", path: "/feedback-management", icon: <MenuBook /> },
    { text: "Discrepancies", path: "/feedback-management/discrepancies", icon: <Flag /> },
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
        {
          text: "Appraisal Finalization",
          path: "/research-dean/appraisal-finalization",
          icon: <Description />
        },
        {
          text: "Reports",
          path: "/research-dean/reports"
        }
      ]
    },
    { text: "Reference Journals", path: "/research-dean/reference-journals", icon: <LibraryBooks /> }
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
    { text: "Reference Journals", path: "/research-coordinator/reference-journals", icon: <LibraryBooks /> }
  ],
};
