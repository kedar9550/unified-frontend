const fs = require('fs');
let content = fs.readFileSync('src/config/rolesNav.jsx', 'utf8');

// Inject Research into Submissions nested array where Resource Utilization is present
content = content.replace(/{\s*text:\s*"Resource Utilization"/g, "{ text: \"Research\", path: \"/hod/research-approvals\", icon: <Science /> },\n        { text: \"Resource Utilization\"");

fs.writeFileSync('src/config/rolesNav.jsx', content);
console.log('Updated rolesNav.jsx');
