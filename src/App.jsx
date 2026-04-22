import { Routes, Route, Navigate } from "react-router-dom";
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

import RoleManagement from "./pages/uniprime/Roles/Rolemanagement";
import FeedbackManagement from "./pages/feedback/FeedbackManagement";


const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Routes>
        {/* Public Only routes */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/signup" element={<Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              Hear we place the dashboard components based on the roles
            </MainLayout>
          }
        />

        <Route
          path="/teaching"
          element={
            <MainLayout>
              <Teaching />
            </MainLayout>
          }
        />
        <Route
          path="/academics/management"
          element={
            <MainLayout>
              <AcademicManagement />
            </MainLayout>
          }
        />
        <Route
          path="exam-result/faculty-format"
          element={
            <MainLayout>
              <FacultyFormatResults />
            </MainLayout>
          }
        />
        <Route
          path="exam-result/students-format"
          element={
            <MainLayout>
              <StudentFormatResults />
            </MainLayout>
          }
        />
        <Route
          path="exam-result/discrepancies"
          element={
            <MainLayout>
              <Discrepancies />
            </MainLayout>
          }
        />
        <Route
          path="/hod/protecrdataupload"
          element={
            <MainLayout>
              <DeptProctorUploads />
            </MainLayout>
          }
        />
        <Route
          path="/academics/programs"
          element={
            <MainLayout>
              <AcademicStructure />
            </MainLayout>
          }
        />
        <Route
          path="/academics/department"
          element={
            <MainLayout>
              <AcademicStructure />
            </MainLayout>
          }
        />
        <Route
          path="/academics/roles"
          element={
            <MainLayout>
              <RoleManagement />
            </MainLayout>
          }
        />
        <Route
          path="/role-management"
          element={
            <MainLayout>
              <RoleManagement />
            </MainLayout>
          }
        />
        <Route
          path="/feedback-management"
          element={
            <MainLayout>
              <FeedbackManagement />
            </MainLayout>
          }
        />
        <Route
          path="*"
          element={
            <MainLayout>
              <Box p={4}>
                <Typography variant="h4">Page Content</Typography>
              </Box>
            </MainLayout>
          }
        />
      </Routes></>
  );
}
export default App;
