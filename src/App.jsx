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
import ConferencePublication from "./pages/faculty/ConferencePublication";
import PhdScholarPublication from "./pages/faculty/PhdScholarPublication";
import NovelProductPublication from "./pages/faculty/NovelProductPublication";
import AcademicManagement from "./pages/uniprime/academics/AcademicManagement";
import FacultyFormatResults from "./pages/examAdmin/FacultyFormatResults";
import StudentFormatResults from "./pages/examAdmin/StudentFormatResults";
import Discrepancies from "./pages/examAdmin/Discrepancies";
import HODDiscrepancies from "./pages/hod/HODDiscrepancies";
import AcademicStructure from "./pages/uniprime/academics/AcademicStructure";
import Assignedstudents from "./pages/uniprime/Student/Assignedstudents";
import RoleManagement from "./pages/uniprime/Roles/Rolemanagement";
import { useLoading } from "./context/LoadingContext";
import Loader from "./components/common/Loader";
import FeedbackManagement from "./pages/feedback/FeedbackManagement";
import FeedbackDiscrepancies from "./pages/feedback/FeedbackDiscrepancies";
import Studentuploads from "./pages/uniprime/Student/Studentuploads";
import Dashboard from "./pages/Dashboard";
import { registerLoadingHandlers } from "./api/axios";
import SDG from "./pages/faculty/SDG";
import Profile from "./components/common/Profile";
import SDGManagement from "./pages/uniprime/SDGManagement";
import ProctoringUpload from "./pages/uniprime/ProctoringUpload";
import UniprimeDiscrepancies from "./pages/uniprime/UniprimeDiscrepancies";
import ResearchUploads from "./pages/uniprime/ResearchUploads";
import DOIFetcher from "./pages/faculty/DOITest";
import FacultyAdministration from "./pages/faculty/FacultyAdministration";
import EventCoordination from "./pages/faculty/EventCoordination";

import ResourceUtilization from "./pages/faculty/ResourceUtilization";
import Contribution from "./pages/faculty/Contribution";
import ResourceUtilizationApproval from "./pages/hod/ResourceUtilizationApproval";
import ContributionApproval from "./pages/hod/ContributionApproval";

import ResearchApprovalList from './pages/research/researchApproval/ResearchApprovalList';
import ResearchApprovalDetailWrapper from './pages/research/researchApproval/ResearchApprovalDetailWrapper';
import ResearchReports from './pages/research/ResearchReports';
import ReferenceJournalManagement from './pages/research/ReferenceJournalManagement';
import AuthorCitationsManagement from './pages/research/AuthorCitationsManagement';

// Self Appraisal Modules
import SelfAppraisal from "./pages/faculty/SelfAppraisal";
import AppraisalSettings from "./pages/uniprime/AppraisalSettings";
import AppraisalReports from "./pages/uniprime/AppraisalReports";
import AppraisalReportDetail from "./pages/uniprime/AppraisalReportDetail";
import AppraisalEvaluation from "./pages/hod/AppraisalEvaluation";
import AppraisalResearchScoring from "./pages/research/AppraisalResearchScoring";
import StaffList from "./pages/hod/StaffList";
import MyResearchMetrics from "./pages/faculty/MyResearchMetrics";

// Utilities Modules
import ShortenUrl from "./pages/utilities/ShortenUrl";
import GenerateQR from "./pages/utilities/GenerateQR";
import ManageShortenUrl from "./pages/utilities/ManageShortenUrl";
import ManageQR from "./pages/utilities/ManageQR";
import RedirectHandler from "./pages/utilities/RedirectHandler";

// Service Desk Modules
import RaiseTicket from "./pages/serviceDesk/RaiseTicket";
import MyTickets from "./pages/serviceDesk/MyTickets";
import TicketDetail from "./pages/serviceDesk/TicketDetail";
import ManageServices from "./pages/serviceDesk/ManageServices";
import ManageTickets from "./pages/serviceDesk/ManageTickets";
import ManageServiceMembers from "./pages/serviceDesk/ManageServiceMembers";
import AssignedToMe from "./pages/serviceDesk/AssignedToMe";
import Reports from "./pages/serviceDesk/Reports";
import FeedbackOverview from "./pages/serviceDesk/FeedbackOverview";

//Student Event Admin
import EventCreation from "./pages/studenteventsadmin/evencreation";
import EventCoordinators from "./pages/studenteventsadmin/EventCoordinators";
import ClubManagement from "./pages/studenteventsadmin/ClubManagement";
import EventAssignment from "./pages/studenteventsadmin/EventAssignment";
import FestManagement from "./pages/convener/FestManagement";
import GroupManagement from "./pages/studenteventsadmin/Groupmanagement";
import GroupCoordinators from "./pages/studenteventsadmin/GroupCoordinators";
import DepartmentManagement from "./pages/studenteventsadmin/Departmentmanagement";
import OrganisationCommittee from "./pages/studenteventsadmin/OrganisationCommittee";
import MajorEventGroups from "./pages/majorEventAdmin/MajorEventGroups";
import FormAssign from "./pages/majorEventAdmin/FormAssign";
import FormPreview from "./pages/majorEventAdmin/FormPreview";
import Payments from "./pages/studenteventsadmin/Payments";
import Registrations from "./pages/studenteventsadmin/Registrations";
import Participants from "./pages/studenteventsadmin/Participants";
import ScanPass from "./pages/studenteventsadmin/ScanPass";
import ScanAccommodation from "./pages/studenteventsadmin/ScanAccommodation";
import Passes from "./pages/studenteventsadmin/Passes";
import UpdatePasses from "./pages/studenteventsadmin/UpdatePasses";
import WinningCertificates from "./pages/studenteventsadmin/WinningCertificates";
import ParticipationCertificates from "./pages/studenteventsadmin/ParticipationCertificates";
import SendMail from "./pages/studenteventsadmin/SendMail";
import VerifyCertificate from "./pages/public/VerifyCertificate";

// Infrastructure
import Building from "./pages/Infrastructure/Building";
import Floor from "./pages/Infrastructure/Floor";
import Ground from "./pages/Infrastructure/Ground";

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
        <Route path="/signup" element={<PublicOnlyRoute><Login defaultSignUp={true} /></PublicOnlyRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/teaching" element={<ProtectedRoute element={<Teaching />} />} />
        <Route path="/research/textbook-publication" element={<ProtectedRoute element={<TextbookPublication />} />} />
        <Route path="/research/book-chapter-publication" element={<ProtectedRoute element={<BookChapterPublication />} />} />
        <Route path="/research/journal-publication" element={<ProtectedRoute element={<JournalPublication />} />} />
        <Route path="/faculty/my-research-metrics" element={<ProtectedRoute element={<MyResearchMetrics />} />} />
        <Route path="/research/patent-publication" element={<ProtectedRoute element={<PatentPublication />} />} />
        <Route path="/research/funded-project" element={<ProtectedRoute element={<FundedProject />} />} />
        <Route path="/research/consultancy-publication" element={<ProtectedRoute element={<ConsultancyPublication />} />} />
        <Route path="/research/conference-publication" element={<ProtectedRoute element={<ConferencePublication />} />} />
        <Route path="/research/phd-scholars" element={<ProtectedRoute element={<PhdScholarPublication />} />} />
        <Route path="/research/novel-products" element={<ProtectedRoute element={<NovelProductPublication />} />} />
        <Route path="/research/sdg" element={<ProtectedRoute element={<SDG />} />} />
        <Route path="/academics/management" element={<ProtectedRoute element={<AcademicManagement />} />} />
        <Route path="exam-result/faculty-format" element={<ProtectedRoute element={<FacultyFormatResults />} />} />
        <Route path="exam-result/students-format" element={<ProtectedRoute element={<StudentFormatResults />} />} />
        <Route path="exam-result/discrepancies" element={<ProtectedRoute element={<Discrepancies />} />} />
        <Route path="/hod/discrepancies" element={<ProtectedRoute element={<HODDiscrepancies />} />} />
        <Route path="/academics/programs" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/department" element={<ProtectedRoute element={<AcademicStructure />} />} />
        <Route path="/academics/roles" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/role-management" element={<ProtectedRoute element={<RoleManagement />} />} />
        <Route path="/feedback-management" element={<ProtectedRoute element={<FeedbackManagement />} />} />
        <Route path="/feedback-management/discrepancies" element={<ProtectedRoute element={<FeedbackDiscrepancies />} />} />
        <Route path="/student/student-uploads" element={<ProtectedRoute element={<Studentuploads />} />} />
        <Route path="/student/assigned-students" element={<ProtectedRoute element={<Assignedstudents />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/uniprime/sdg-management" element={<ProtectedRoute element={<SDGManagement />} />} />
        <Route path="/uniprime/proctoring-upload" element={<ProtectedRoute element={<ProctoringUpload />} />} />
        <Route path="/uniprime/discrepancies" element={<ProtectedRoute element={<UniprimeDiscrepancies />} />} />
        <Route path="/uniprime/research-uploads" element={<ProtectedRoute element={<ResearchUploads />} />} />

        {/* Value Addition Modules */}
        <Route path="/value-addition/resource-utilization" element={<ProtectedRoute element={<ResourceUtilization />} />} />
        <Route path="/value-addition/contribution" element={<ProtectedRoute element={<Contribution />} />} />
        <Route path="/hod/value-addition/resource-utilization" element={<ProtectedRoute element={<ResourceUtilizationApproval />} />} />
        <Route path="/hod/value-addition/contribution" element={<ProtectedRoute element={<ContributionApproval />} />} />

        <Route path="/hod/research-approvals" element={<ProtectedRoute element={<ResearchApprovalList role="HOD" />} />} />
        <Route path="/hod/research-request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="HOD" />} />} />
        <Route path="/faculty/administration" element={<ProtectedRoute element={<FacultyAdministration />} />} />
        <Route path="/hod/staff" element={<ProtectedRoute element={<StaffList />} />} />

        {/* Self Appraisal routes */}
        <Route path="/faculty/event-coordination" element={<ProtectedRoute element={<EventCoordination />} />} />
        <Route path="/faculty/appraisal" element={<ProtectedRoute element={<SelfAppraisal />} />} />
        <Route path="/hod/appraisal-verification" element={<ProtectedRoute element={<AppraisalEvaluation />} />} />
        <Route path="/uniprime/appraisal-settings" element={<ProtectedRoute element={<AppraisalSettings />} />} />
        <Route path="/uniprime/appraisal-reports" element={<ProtectedRoute element={<AppraisalReports />} />} />
        <Route path="/appraisal/details/:id" element={<ProtectedRoute element={<AppraisalReportDetail />} />} />
        <Route path="/research-dean/appraisal-finalization" element={<ProtectedRoute element={<AppraisalResearchScoring />} />} />
        <Route path="/research-coordinator/appraisal-finalization" element={<ProtectedRoute element={<AppraisalResearchScoring />} />} />

        <Route path="/research-dean/approvals" element={<ProtectedRoute element={<ResearchApprovalList role="RESEARCH_DEAN" />} />} />
        <Route path="/research-dean/request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="RESEARCH_DEAN" />} />} />

        <Route path="/research-coordinator/approvals" element={<ProtectedRoute element={<ResearchApprovalList role="RESEARCH_COORDINATOR" />} />} />
        <Route path="/research-coordinator/request/:type/:id" element={<ProtectedRoute element={<ResearchApprovalDetailWrapper role="RESEARCH_COORDINATOR" />} />} />

        <Route path="/research-dean/reports" element={<ProtectedRoute element={<ResearchReports />} />} />
        <Route path="/research-coordinator/reports" element={<ProtectedRoute element={<ResearchReports />} />} />

        <Route path="/research-dean/reference-journals" element={<ProtectedRoute element={<ReferenceJournalManagement />} />} />
        <Route path="/research-dean/author-citations" element={<ProtectedRoute element={<AuthorCitationsManagement />} />} />
        <Route path="/research-coordinator/reference-journals" element={<ProtectedRoute element={<ReferenceJournalManagement />} />} />
        <Route path="/research-coordinator/author-citations" element={<ProtectedRoute element={<AuthorCitationsManagement />} />} />

        {/* Utilities Routes */}
        <Route path="/utilities/shorten-url" element={<ProtectedRoute element={<ShortenUrl />} />} />
        <Route path="/utilities/generate-qr" element={<ProtectedRoute element={<GenerateQR />} />} />
        <Route path="/utilities/manage-shorten-url" element={<ProtectedRoute element={<ManageShortenUrl />} />} />
        <Route path="/utilities/manage-qr" element={<ProtectedRoute element={<ManageQR />} />} />

        {/* Public Redirect Route */}
        <Route path="/go/:shortCode" element={<RedirectHandler />} />
        
        {/* Public Certificate Verification Route */}
        <Route path="/verify/certificate/:receipt/:roll" element={<VerifyCertificate />} />

        <Route path="/doi-test" element={<DOIFetcher />} />

        {/* Service Desk Routes */}
        <Route path="/service-desk/raise" element={<ProtectedRoute element={<RaiseTicket />} />} />
        <Route path="/service-desk/my-tickets" element={<ProtectedRoute element={<MyTickets />} />} />
        <Route path="/service-desk/assigned-to-me" element={<ProtectedRoute element={<AssignedToMe />} />} />
        <Route path="/service-desk/ticket/:id" element={<ProtectedRoute element={<TicketDetail />} />} />
        <Route path="/service-desk/admin/manage-services" element={<ProtectedRoute element={<ManageServices />} />} />
        <Route path="/service-desk/admin/services" element={<ProtectedRoute element={<ManageTickets />} />} />
        <Route path="/service-desk/admin/team" element={<ProtectedRoute element={<ManageServiceMembers />} />} />
        <Route path="/service-desk/reports" element={<ProtectedRoute element={<Reports />} />} />
        <Route path="/service-desk/admin/feedback" element={<ProtectedRoute element={<FeedbackOverview />} />} />

        {/* Student Event Admin */}
        {/* <Route path="/student-event-admin" element={<ProtectedRoute element={<StudentEventAdmin />} />} /> */}
        <Route path="/student-event-admin/clubs" element={<ProtectedRoute element={<ClubManagement />} />} />
        <Route path="/student-event-admin/event-assignments" element={<ProtectedRoute element={<EventAssignment />} />} />
        <Route path="/convener/fests" element={<ProtectedRoute element={<FestManagement />} />} />


        <Route path="/Eventveda/groups" element={<ProtectedRoute element={<GroupManagement />} />} />
        <Route path="/Eventveda/groups/coordinators" element={<ProtectedRoute element={<GroupCoordinators />} />} />
        <Route path="/Eventveda/events" element={<ProtectedRoute element={<EventCreation />} />} />
        <Route path="/Eventveda/events/coordinators" element={<ProtectedRoute element={<EventCoordinators />} />} />
        <Route path="/Eventveda/organisation-committee" element={<ProtectedRoute element={<OrganisationCommittee />} />} />
        <Route path="/Eventveda/departments" element={<ProtectedRoute element={<DepartmentManagement />} />} />
        <Route path="/Eventveda/payments" element={<ProtectedRoute element={<Payments />} />} />
        <Route path="/Eventveda/registrations" element={<ProtectedRoute element={<Registrations />} />} />
        <Route path="/Eventveda/participants" element={<ProtectedRoute element={<Participants mode="all" />} />} />
        <Route path="/Eventveda/participants/all" element={<ProtectedRoute element={<Participants mode="all" />} />} />
        <Route path="/Eventveda/participants/accommodation" element={<ProtectedRoute element={<Participants mode="accommodation" />} />} />
        <Route path="/Eventveda/participants/no-accommodation" element={<ProtectedRoute element={<Participants mode="no-accommodation" />} />} />
        <Route path="/Eventveda/scan-pass" element={<ProtectedRoute element={<ScanPass />} />} />
        <Route path="/Eventveda/scan-accommodation" element={<ProtectedRoute element={<ScanAccommodation />} />} />
        <Route path="/Eventveda/passes" element={<ProtectedRoute element={<Passes />} />} />
        <Route path="/Eventveda/update-passes" element={<ProtectedRoute element={<UpdatePasses />} />} />
        <Route path="/Eventveda/winning-certificates" element={<ProtectedRoute element={<WinningCertificates />} />} />
        <Route path="/Eventveda/participation-certificates" element={<ProtectedRoute element={<ParticipationCertificates />} />} />
        <Route path="/Eventveda/send-mail" element={<ProtectedRoute element={<SendMail />} />} />
        <Route path="/major-event-admin/groups" element={<ProtectedRoute element={<MajorEventGroups />} />} />
        <Route path="/major-event-admin/form-assign" element={<ProtectedRoute element={<FormAssign />} />} />
        <Route path="/major-event-admin/form-preview" element={<ProtectedRoute element={<FormPreview />} />} />

        {/* Infrastructure */}
        <Route path="/infrastructure/building" element={<ProtectedRoute element={<Building />} />} />
        <Route path="/infrastructure/floors" element={<ProtectedRoute element={<Floor />} />} />
        <Route path="/infrastructure/grounds" element={<ProtectedRoute element={<Ground />} />} />

        <Route path="*" element={<ProtectedRoute element={<Box p={4}><Typography variant="h4">Page Content</Typography></Box>} />} />
      </Routes>
    </>
  );
}

export default App;
