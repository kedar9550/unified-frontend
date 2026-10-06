const fs = require('fs');

const paths = [
    'src/pages/research/researchApproval/FundedProjectApprovalDetail.jsx',
    'src/pages/research/researchApproval/NovelProductApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConsultancyApprovalDetail.jsx'
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // Fix for the regex version
        const regex1 = /\{\(isResearchAdmin && \/pending\/i\.test\(data\.status\)\) \? \(/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, "{((isResearchAdmin && /pending/i.test(data.status)) || (isHOD && data.status === 'Pending')) ? (");
            fs.writeFileSync(p, content);
            console.log('Fixed rendering in', p);
        }
    }
}
