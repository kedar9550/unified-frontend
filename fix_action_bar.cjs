const fs = require('fs');

const paths = [
    'src/pages/research/researchApproval/TextBookApprovalDetail.jsx',
    'src/pages/research/researchApproval/PhdScholarApprovalDetail.jsx',
    'src/pages/research/researchApproval/PatentApprovalDetail.jsx',
    'src/pages/research/researchApproval/NovelProductApprovalDetail.jsx',
    'src/pages/research/researchApproval/FundedProjectApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConsultancyApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConferenceApprovalDetails.jsx',
    'src/pages/research/researchApproval/BookChapterApprovalDetail.jsx',
    'src/pages/research/researchApproval/JournalApprovalDetail.jsx' 
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // 1. Replace Journal/Funded/Novel/Consultancy cases that only have ResearchAdmin check
        const regex1 = /\{\(isResearchAdmin && data\.status === 'Pending at R&D'\) \? \(/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, "{((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (");
            console.log('Fixed simple check in', p);
        }
        
        // 2. Replace the cases that already have isHOD but use 'Pending at HOD'
        const regex2 = /\{\(\(isResearchAdmin && data\.status === 'Pending at R&D'\) \|\| \(isHOD && data\.status === 'Pending at HOD'\)\) \? \(/g;
        if (regex2.test(content)) {
            content = content.replace(regex2, "{((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (");
            console.log('Fixed complex check in', p);
        }
        
        // 3. For Novel/Funded/Consultancy they might not have parentheses. Let's do a generic replace just in case:
        const regex3 = /\{isResearchAdmin && data\.status === 'Pending at R&D' \? \(/g;
        if (regex3.test(content)) {
            content = content.replace(regex3, "{((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (");
            console.log('Fixed alternate simple check in', p);
        }
        
        fs.writeFileSync(p, content);
    }
}
