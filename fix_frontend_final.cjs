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
        
        // 1. Remove all these lines completely
        content = content.replace(/^[ \t]*const r = typeof role !== 'undefined'.*\n/gm, '');
        content = content.replace(/^[ \t]*const isDean = .*\n/gm, '');
        content = content.replace(/^[ \t]*const isCoordinator = .*\n/gm, '');
        content = content.replace(/^[ \t]*const isResearchAdmin = .*\n/gm, '');
        content = content.replace(/^[ \t]*const isHOD = .*\n/gm, '');
        
        // 2. Inject properly
        // Look for the component definition 'const ComponentName = ({ ... }) => {' or similar
        // usually followed by some hooks.
        // Let's inject it right after `const navigate = useNavigate();` OR `const { id } = useParams();` OR `const [data, setData] = useState(null);`
        
        // Try to find a good injection point
        const injectRegex = /(const \[data, setData\] = useState\(null\);|const navigate = useNavigate\(\);|const \{ user, activeRole \} = useAuth\(\);)/;
        
        if (injectRegex.test(content)) {
            content = content.replace(injectRegex, `$1\n${properBlock}`);
            fs.writeFileSync(p, content);
            console.log('Fixed variables in', p);
        } else {
            // For Wrapper which doesn't have data state
            const fallbackRegex = /(const navigate = useNavigate\(\);|const \{ type, id \} = useParams\(\);)/;
            if (fallbackRegex.test(content)) {
                content = content.replace(fallbackRegex, `$1\n${properBlock}`);
                fs.writeFileSync(p, content);
                console.log('Fixed variables (fallback) in', p);
            } else {
                // Another fallback, just put it after component declaration
                const compRegex = /(const [A-Za-z]+ = \([^)]*\) => \{)/;
                if (compRegex.test(content)) {
                    content = content.replace(compRegex, `$1\n${properBlock}`);
                    fs.writeFileSync(p, content);
                    console.log('Fixed variables (comp fallback) in', p);
                } else {
                    console.log('Failed to find injection point for', p);
                }
            }
        }
        
        // Let's also fix the rendering logic!
        // Replace isResearchAdmin && data.status === 'Pending at R&D' with the generalized condition
        let renderingFixed = false;
        
        // For ternary operations with isResearchAdmin
        const regex1 = /\{\(isResearchAdmin && data\.status === 'Pending at R&D'\) \? \(/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, "{((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (");
            renderingFixed = true;
        }

        // For cases without parentheses
        const regex2 = /\{isResearchAdmin && data\.status === 'Pending at R&D' \? \(/g;
        if (regex2.test(content)) {
            content = content.replace(regex2, "{((isResearchAdmin && data.status === 'Pending at R&D') || (isHOD && data.status === 'Pending')) ? (");
            renderingFixed = true;
        }

        if (renderingFixed) {
            fs.writeFileSync(p, content);
            console.log('Fixed rendering in', p);
        }
    }
}
