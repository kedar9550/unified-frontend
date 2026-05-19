import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/login/Login";
import MainLayout from "./components/layouts/MainLayout";
import { useAuth } from "./context/AuthContext";
import { Box, Typography } from "@mui/material";
import Teaching from "./pages/faculty/Teaching";
import TextbookPublication from "./pages/faculty/TextbookPublication";
import BookChapterPublication from "./pages/faculty/BookChapterPublication";
import JournalPublication from "./pages/faculty/JournalPublication";
import PatentPublication from "./pages/faculty/PatentPublication";
import FundedProject from "./pages/faculty/FundedProject";
import ConsultancyPublication from "./pages/faculty/ConsultancyPublication";
import AcademicManagement from "./pages/uniprime/academics/AcademicManagement";
import FacultyFormatResults from "./pages/examAdmin/FacultyFormatResults";
import StudentFormatResults from "./pages/examAdmin/StudentFormatResults";
import Discrepancies from "./pages/examAdmin/Discrepancies";
import DeptProctorUploads from "./pages/hod/DeptProctorUploads";
import HODDiscrepancies from "./pages/hod/HODDiscrepancies";
import AcademicStructure from "./pages/uniprime/academics/AcademicStructure";
import Assignedstudents from "./pages/uniprime/Student/Assignedstudents";
import RoleManagement from "./pages/uniprime/Roles/Rolemanagement";
import { useLoading } from "./context/LoadingContext";
import Loader from "./components/common/Loader";
import FeedbackManagement from "./pages/feedback/FeedbackManagement";
import FeedbackDiscrepancies from "./pages/feedback/FeedbackDiscrepancies";
import Studentuploads from "./pages/uniprime/Student/Studentuploads";
import DepartmentMapping from "./pages/uniprime/Student/DepartmentMapping";
import Dashboard from "./pages/Dashboard";
import { registerLoadingHandlers } from "./api/axios";
import SDG from "./pages/faculty/SDG";
import Profile from "./components/common/Profile";
import SDGManagement from "./pages/uniprime/SDGManagement";


import ResearchApprovalList from './pages/research/researchApproval/ResearchApprovalList';
import ResearchApprovalDetailWrapper from './pages/research/researchApproval/ResearchApprovalDetailWrapper';
import ResearchReports from './pages/research/ResearchReports';



const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const ProtectedRoute = ({ element: Element }) => {
  const location = useLocation();
  return (
    <MainLayout>
      {React.cloneElement(Element, { key: location.pathname })}
    </MainLayout>
  );
};

import { Toaster } from "sonner";

function App() {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  useEffect(() => {
    registerLoadingHandlers(startLoading, stopLoading);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    // Initialize theme
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Toaster 
        position={isMobile ? "top-center" : "top-right"} 
        theme={document.body.classList.contains("dark-mode") ? "dark" : "light"}
        closeButton
      />
      {isLoading && <Loader fullScreen />}
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<Navigate to="/" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/teaching" element={<ProtectedRoute element={<Teaching />} />} />
        <Route path="/research/textbook-publication" element={<ProtectedRoute element={<TextbookPublication />} />} />
        <Route path="/research/book-chapter-publication" element={<ProtectedRoute element={<BookChapterPublication />} />} />
        <Route path="/research/journal-publication" element={<ProtectedRoute element={<JournalPublication />} />} />
        <Route path="/research/patent-publication" element={<ProtectedRoute element={<PatentPublication />} />} />
        <Route path="/research/funded-project" element={<ProtectedRoute element={<FundedProject />} />} />
        <Route path="/research/consultancy-publication" element={<ProtectedRoute element={<ConsultancyPublication />} />} />
        <Route path="/research/sdg" element={<ProtectedRoute element={<SDG />} />} />
        <Route path="/academics/management" element={<ProtectedRoute element={<AcademicManagement />} />} />
        <Route path="exam-result/faculty-format" element={<ProtectedRoute element={<FacultyFormatResults />} />} />
        <Route path="exam-result/students-format" element={<ProtectedRoute element={<StudentFormatResults />} />} />
        <Route path="exam-result/discrepancies" element={<ProtectedRoute element={<Discrepancies />} />} />
        <Route path="/hod/protecrdataupload" element={<ProtectedRoute element={<DeptProctorUploads />} />} />
        <Route path="/hod/discrepancies" element={<ProtectedRoute element={<HODDiscrepancies />} />} />
        <Route path="/academics/programs" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/department" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/roles" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/feedback-management" element={<ProtectedRoute element={<FeedbackManagement />} />} />
        <Route path="/feedback-management/discrepancies" element={<ProtectedRoute element={<FeedbackDiscrepancies />} />} />
        <Route path="/student/student-uploads" element={<ProtectedRoute element={<Studentuploads />} />} />
        <Route path="/student/assigned-students" element={<ProtectedRoute element={<Assignedstudents />} />} />
        <Route path="/student/department-mapping" element={<ProtectedRoute element={<DepartmentMapping />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/uniprime/sdg-management" element={<ProtectedRoute element={<SDGManagement />} />} />
        <Route path="/hod/research-approvals" element={<ProtectedRoute element={<ResearchApprovalList role="HOD" />} />} />
        <Route path="/hod/research-request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="HOD" />} />} />

        <Route path="/research-dean/approvals" element={<ProtectedRoute element={<ResearchApprovalList role="RESEARCH_DEAN" />} />} />
        <Route path="/research-dean/request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="RESEARCH_DEAN" />} />} />

        <Route path="/research-coordinator/approvals" element={<ProtectedRoute element={<ResearchApprovalList role="RESEARCH_COORDINATOR" />} />} />
        <Route path="/research-coordinator/request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="RESEARCH_COORDINATOR" />} />} />

        <Route path="/research-dean/reports" element={<ProtectedRoute element={<ResearchReports />} />} />
        <Route path="/research-coordinator/reports" element={<ProtectedRoute element={<ResearchReports />} />} />


        <Route path="*" element={<ProtectedRoute element={<Box p={4}><Typography variant="h4">Page Content</Typography></Box>} />} />
      </Routes>
    </>
  );
}

export default App;