const fs = require('fs');

const paths = [
    'src/pages/research/researchApproval/FundedProjectApprovalDetail.jsx',
    'src/pages/research/researchApproval/NovelProductApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConsultancyApprovalDetail.jsx',
    'src/pages/research/researchApproval/JournalApprovalDetail.jsx',
    'src/pages/research/researchApproval/PatentApprovalDetail.jsx',
    'src/pages/research/researchApproval/PhdScholarApprovalDetail.jsx',
    'src/pages/research/researchApproval/PhdScholarFacultyDetail.jsx',
    'src/pages/research/researchApproval/TextBookApprovalDetail.jsx',
    'src/pages/research/researchApproval/BookChapterApprovalDetail.jsx',
    'src/pages/research/researchApproval/ConferenceApprovalDetails.jsx',
    'src/pages/research/researchApproval/ResearchApprovalDetailWrapper.jsx',
    'src/pages/research/researchApproval/ResearchApprovalList.jsx'
];

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        content = content.replace(/[ \t]*const r = typeof role !== 'undefined'.*?\r?\n/g, '');
        content = content.replace(/[ \t]*const isDean = .*?\r?\n/g, '');
        content = content.replace(/[ \t]*const isCoordinator = .*?\r?\n/g, '');
        content = content.replace(/[ \t]*const isResearchAdmin = .*?\r?\n/g, '');
        content = content.replace(/[ \t]*const isHOD = .*?\r?\n/g, '');
        
        const properBlock = `    const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
    const isDean = r === 'RESEARCH_DEAN';
    const isCoordinator = r === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;`;
        
        const injectRegex = /(const \[data, setData\] = useState\(null\);|const navigate = useNavigate\(\);|const \{ user, activeRole \} = useAuth\(\);|const \{ type, id \} = useParams\(\);)/;
        if (injectRegex.test(content)) {
            content = content.replace(injectRegex, `$1\n${properBlock}`);
        }
        
        fs.writeFileSync(p, content);
        console.log('Cleaned and injected', p);
    }
}
