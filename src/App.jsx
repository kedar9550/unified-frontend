import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/login/Login";
import MainLayout from "./components/layouts/MainLayout";
import { useAuth } from "./context/AuthContext";
import { Box, Typography } from "@mui/material";
import Teaching from "./pages/faculty/Teaching";
import AcademicManagement from "./pages/uniprime/academics/AcademicManagement";
import FacultyFormatResults from "./pages/examAdmin/FacultyFormatResults";
import StudentFormatResults from "./pages/examAdmin/StudentFormatResults";
import Discrepancies from "./pages/examAdmin/Discrepancies";
import DeptProctorUploads from "./pages/hod/DeptProctorUploads";
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

function App() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  // Register once — never re-registers on re-render
  useEffect(() => {
    registerLoadingHandlers(startLoading, stopLoading);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {isLoading && <Loader />}
      <Routes>
        <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<Navigate to="/" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/teaching" element={<ProtectedRoute element={<Teaching />} />} />
        <Route path="/academics/management" element={<ProtectedRoute element={<AcademicManagement />} />} />
        <Route path="exam-result/faculty-format" element={<ProtectedRoute element={<FacultyFormatResults />} />} />
        <Route path="exam-result/students-format" element={<ProtectedRoute element={<StudentFormatResults />} />} />
        <Route path="exam-result/discrepancies" element={<ProtectedRoute element={<Discrepancies />} />} />
        <Route path="/hod/protecrdataupload" element={<ProtectedRoute element={<DeptProctorUploads />} />} />
        <Route path="/academics/programs" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/department" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/roles" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/feedback-management" element={<ProtectedRoute element={<FeedbackManagement />} />} />
        <Route path="/feedback-management/discrepancies" element={<ProtectedRoute element={<FeedbackDiscrepancies />} />} />
        <Route path="/student/student-uploads" element={<ProtectedRoute element={<Studentuploads />} />} />
        <Route path="/student/assigned-students" element={<ProtectedRoute element={<Assignedstudents />} />} />
        <Route path="/student/department-mapping" element={<ProtectedRoute element={<DepartmentMapping />} />} />

        <Route path="*" element={<ProtectedRoute element={<Box p={4}><Typography variant="h4">Page Content</Typography></Box>} />} />
      </Routes>
    </>
  );
}

export default App;