const fs = require('fs');

const paths = [
    'src/pages/research/researchApproval/FundedProjectApprovalDetail.jsx',
    'src/pages/research/researchApproval/NovelProductApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConsultancyApprovalDetail.jsx',
    'src/pages/research/researchApproval/JournalApprovalDetail.jsx',
    'src/pages/research/researchApproval/PatentApprovalDetail.jsx',
    'src/pages/research/researchApproval/PhdScholarApprovalDetail.jsx',
    'src/pages/research/researchApproval/TextBookApprovalDetail.jsx',
    'src/pages/research/researchApproval/BookChapterApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConferenceApprovalDetails.jsx'
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // Fix toast message for approve
        const regex = /toast\.success\(`Request \$\{action === 'Approve' \? 'Approved' : 'Rejected'\} successfully`\);/g;
        if (regex.test(content)) {
            content = content.replace(regex, "toast.success(`Request ${action === 'Approve' ? (isHOD ? 'Forwarded to R&D' : 'Approved') : 'Rejected'} successfully`);");
            fs.writeFileSync(p, content);
            console.log('Fixed success message in', p);
        } else {
            console.log('Regex not matched in', p);
        }
    }
}
