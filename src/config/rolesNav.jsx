import {
  Dashboard,
  MenuBook,
  Science,
  AccountBalance,
  Groups,
  School,
  Flag,
  People,
} from "@mui/icons-material";
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
    { text: "Teaching", path: "/teaching", icon: <MenuBook /> },
    {
      text: "Research",
      path: "/research",
      icon: <Science />,
      nested: [
        { text: "Paper Publication", path: "/research/paper-publication" },
        { text: "Guiding Ph.D Scholars", path: "/research/phd-scholars" },
      ],
    },
    { text: "Administration", path: "/admin", icon: <AccountBalance /> },
    { text: "Interpersonal", path: "/interpersonal", icon: <Groups /> },
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
      text: "User & Role Management",
      path: "/role-management",
      icon: <People />
    }
  ],

  // Example for a future "Department HOD" role
  "HOD": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Protectrdata", path: "/hod/protecrdataupload" }
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
};
