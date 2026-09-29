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
    'src/pages/research/researchApproval/JournalApprovalDetail.jsx' // Just in case
];

const properBlock = `    const r = typeof role !== 'undefined' ? role : (typeof effectiveRole !== 'undefined' ? effectiveRole : '');
    const isDean = r === 'RESEARCH_DEAN';
    const isCoordinator = r === 'RESEARCH_COORDINATOR';
    const isResearchAdmin = isDean || isCoordinator;
    const isHOD = !isResearchAdmin;`;

for (const p of paths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        
        // Remove ANY combination of these lines
        content = content.replace(/\s*const r = typeof role !== 'undefined'[\s\S]*?;\n/g, '\n');
        content = content.replace(/\s*const isHOD = [^\n]*;/g, '');
        content = content.replace(/\s*const isDean = [^\n]*;/g, '');
        content = content.replace(/\s*const isCoordinator = [^\n]*;/g, '');
        content = content.replace(/\s*const isResearchAdmin = [^\n]*;/g, '');
        
        // Find the start of the component to inject properly
        // We look for 'const [Component] = ({ role }) => {' or similar
        // Let's just find the line with `useNavigate()` and inject after it.
        // That is usually right at the top of these components.
        
        const injectRegex = /(const navigate = useNavigate\(\);|const { id, type } = useParams\(\);|const { id } = useParams\(\);)/;
        
        if (injectRegex.test(content)) {
            content = content.replace(injectRegex, `$1\n\n${properBlock}`);
            fs.writeFileSync(p, content);
            console.log('Fixed', p);
        } else {
            console.log('Could not find injection point in', p);
        }
    }
}
