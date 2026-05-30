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
  ManageAccounts
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
        { text: "SDG's", path: "/research/sdg" },
      ],
    },
    // { text: "Administration", path: "/admin", icon: <AccountBalance /> },
    // { text: "Interpersonal", path: "/interpersonal", icon: <Groups /> },
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
          text: "Reports",
          path: "/research-dean/reports"
        }
      ]
    }
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
          text: "Reports",
          path: "/research-coordinator/reports"
        }
      ]
    }
  ],
};
