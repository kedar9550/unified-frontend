import {
  Dashboard,
  MenuBook,
  Science,
  AccountBalance,
  Groups,
  School,
  Flag,
  People
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
    { text: "Teaching", path: "/teaching", icon: <MenuBook /> },
    {
      text: "Publications",

      icon: <Science />,
      nested: [
        { text: "Text Book", path: "/research/textbook-publication" },
        { text: "Book Chapter", path: "/research/book-chapter-publication" },
        { text: "Journal", path: "/research/journal-publication" },
        { text: "Patent", path: "/research/patent-publication" },
        { text: "Funded Project", path: "/research/funded-project" },
        { text: "Consultancy", path: "/research/consultancy-publication" },
        { text: "Conference", path: "/research/conference-publication" },
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
      text: "Employee & Role Management",
      path: "/role-management",
      icon: <People />
    },
    {
      text: "Student Management",
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

  // Feedback Coordinator
  "FEEDBACK COORDINATOR": [
    { text: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { text: "Feedback Management", path: "/feedback-management", icon: <MenuBook /> },
    { text: "Discrepancies", path: "/feedback-management/discrepancies", icon: <Flag /> },
  ],
};
