const fs = require('fs');

const paths = [
    'src/pages/research/researchApproval/ResearchApprovalDetailWrapper.jsx',
    'src/pages/research/researchApproval/TextBookApprovalDetail.jsx',
    'src/pages/research/researchApproval/PhdScholarFacultyDetail.jsx',
    'src/pages/research/researchApproval/ResearchApprovalList.jsx',
    'src/pages/research/researchApproval/PhdScholarApprovalDetail.jsx',
    'src/pages/research/researchApproval/PatentApprovalDetail.jsx',
    'src/pages/research/researchApproval/NovelProductApprovalDetail.jsx',
    'src/pages/research/researchApproval/FundedProjectApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConsultancyApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConferenceApprovalDetails.jsx',
    'src/pages/research/researchApproval/BookChapterApprovalDetail.jsx'
];

const newCode = `    const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
    const isDean = r === 'RESEARCH_DEAN';
    const isCoordinator = r === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;`;

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        let changed = false;
        
        // Let's replace any single "const isHOD = !role || role === 'HOD';" or similar 
        // with the generic check.
        // It's safer to just look for "const isHOD = " and replace it if we don't already have isResearchAdmin
        
        if (content.includes("const isHOD = ") && !content.includes("const r = typeof role")) {
             // Let's find the exact line containing const isHOD
             const isHodMatch = content.match(/const isHOD = [^\n]+;/);
             if (isHodMatch) {
                 content = content.replace(isHodMatch[0], newCode);
                 
                 // If there was already const isDean, we might get redeclaration error. So let's remove existing ones
                 content = content.replace(/const isDean = [^\n]+;\n/g, '');
                 content = content.replace(/const isCoordinator = [^\n]+;\n/g, '');
                 content = content.replace(/const isResearchAdmin = [^\n]+;\n/g, '');
                 
                 fs.writeFileSync(p, content);
                 console.log('Updated', p);
             }
        }
    }
}
