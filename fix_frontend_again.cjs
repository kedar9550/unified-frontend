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
    'src/pages/research/researchApproval/BookChapterApprovalDetail.jsx',
    'src/pages/research/researchApproval/JournalApprovalDetail.jsx' 
];

const properBlock = `    const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
    const isDean = r === 'RESEARCH_DEAN';
    const isCoordinator = r === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;`;

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // Let's replace the specific broken block with the proper block
        // The broken block looks like this (with varying spaces):
        // const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
        // const isHOD = !isResearchAdmin;
        // const isDean = role === 'RESEARCH_DEAN';
        // const isCoordinator = role === 'RESEARCH_COORDINATOR';
        // const isResearchAdmin = isDean || isCoordinator;

        const brokenBlockRegex = /\s*const r = typeof role !== 'undefined' \? role : \(typeof effectiveRole !== 'undefined' \? effectiveRole : ''\);\s*const isHOD = !isResearchAdmin;\s*const isDean = role === 'RESEARCH_DEAN';\s*const isCoordinator = role === 'RESEARCH_COORDINATOR';\s*const isResearchAdmin = isDean \|\| isCoordinator;/g;
        
        if (brokenBlockRegex.test(content)) {
            content = content.replace(brokenBlockRegex, `\n${properBlock}`);
            fs.writeFileSync(p, content);
            console.log('Fixed', p);
        } else {
            console.log('Broken block not found in', p);
        }
    }
}
