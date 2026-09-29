const fs = require('fs');
const p = 'd:/W/Unified/unified-frontend/src/pages/research/researchApproval/ResearchApprovalList.jsx';

let content = fs.readFileSync(p, 'utf8');

const regex = /<Select[\s\S]*?<MenuItem value="All">All Status<\/MenuItem>\s*<MenuItem value="Pending">Pending at R&D<\/MenuItem>\s*<MenuItem value="Approved">Approved<\/MenuItem>\s*<MenuItem value="Rejected">Rejected<\/MenuItem>\s*<\/Select>/;

const newDropdown = `<Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ 
                                    borderRadius: "12px", 
                                    background: "var(--bg-glass)",
                                    color: "var(--text-primary)",
                                    "& .MuiSelect-icon": { fill: "url(#themeGradient)" }
                                }}
                                MenuProps={{ disableAriaHidden: true }}
                            >
                                <MenuItem value="All">All Status</MenuItem>
                                {isHOD ? (
                                    <>
                                        <MenuItem value="Pending">Pending at HOD</MenuItem>
                                        <MenuItem value="Pending at R&D">Pending at R&D</MenuItem>
                                    </>
                                ) : (
                                    <MenuItem value="Pending">Pending at R&D</MenuItem>
                                )}
                                <MenuItem value="Approved">Approved</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                            </Select>`;

content = content.replace(regex, newDropdown);
fs.writeFileSync(p, content);
console.log('Fixed dropdown');
