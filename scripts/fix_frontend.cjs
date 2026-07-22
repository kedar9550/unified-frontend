const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/uniprime/academics/AcademicStructure.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: openModal logic
content = content.replace(
    /if \(selectedSchool\) \{\s+modalData\.schoolId = selectedSchool\._id;\s+\}/,
    `if (selectedSchool) {\n                modalData.schoolId = selectedSchool._id;\n                modalData.schoolIds = [selectedSchool._id];\n            }`
);

// Fix 2: schoolDepts filter
content = content.replace(
    /const schoolDepts = selectedSchool[\s\S]*?\? departments\.filter\(d =>[\s\S]*?\(d\.schoolIds && d\.schoolIds\.some\(id => \(id\?\._id \|\| id\) === selectedSchool\._id\)\) \|\|[\s\S]*?d\.schoolId\?\._id === selectedSchool\._id \|\|[\s\S]*?d\.schoolId === selectedSchool\._id[\s\S]*?\)[\s\S]*?: \[\];/,
    `const schoolDepts = selectedSchool\n            ? departments.filter(d =>\n                (d.schoolIds && d.schoolIds.some(id => (id?._id || id) === selectedSchool._id))\n            )\n            : [];`
);

// Fix 3: sDepts and sProgs logic in Grid
content = content.replace(
    /const sDepts = departments\.filter\(d =>[\s\S]*?\(d\.schoolIds && d\.schoolIds\.some\(id => \(id\?\._id \|\| id\) === school\._id\)\) \|\|[\s\S]*?d\.schoolId\?\._id === school\._id \|\|[\s\S]*?d\.schoolId === school\._id[\s\S]*?\);[\s\S]*?const sBranches = branches\.filter\(b =>[\s\S]*?b\.schoolId\?\._id === school\._id \|\| b\.schoolId === school\._id \|\|[\s\S]*?\(!b\.schoolId && sDepts\.some\(d => d\._id === b\.departmentId\?\._id \|\| d\._id === b\.departmentId\)\)[\s\S]*?\);[\s\S]*?const sProgsIds = new Set\(sBranches\.map\(b => b\.programId\?\._id \|\| b\.programId\)\);[\s\S]*?const sProgs = programs\.filter\(p => sProgsIds\.has\(p\._id\)\);/,
    `const sDepts = departments.filter(d =>\n                                (d.schoolIds && d.schoolIds.some(id => (id?._id || id) === school._id))\n                            );\n                            const sBranches = branches.filter(b =>\n                                b.schoolId?._id === school._id || b.schoolId === school._id ||\n                                (!b.schoolId && sDepts.some(d => d._id === b.departmentId?._id || d._id === b.departmentId))\n                            );\n                            const sProgsIds = new Set(sBranches.map(b => b.programId?._id || b.programId));\n                            const sProgs = programs.filter(p => sProgsIds.has(p._id));`
);

// Fix 4: Department Modal type select (schoolId -> schoolIds)
content = content.replace(
    /onChange=\{\(e\) => setModal\(\{ \.\.\.modal, data: \{ \.\.\.modal\.data, type: e\.target\.value, schoolId: e\.target\.value === 'Central' \? null : modal\.data\.schoolId \} \}\)\}/g,
    `onChange={(e) => setModal({ ...modal, data: { ...modal.data, type: e.target.value, schoolIds: e.target.value === 'Central' ? [] : modal.data.schoolIds } })}`
);

// Fix 5: Department Modal Select component values
content = content.replace(
    /modal\.data\.schoolIds[\s\S]*?\? modal\.data\.schoolIds\.map\(s => typeof s === 'object' \? s\._id : s\)[\s\S]*?: \(modal\.data\.schoolId \? \[typeof modal\.data\.schoolId === 'object' \? modal\.data\.schoolId\._id : modal\.data\.schoolId\] : \[\]\)/,
    `modal.data.schoolIds\n                                                    ? modal.data.schoolIds.map(s => typeof s === 'object' ? s._id : s)\n                                                    : []`
);

// Fix 6: Remove p.schoolId from Program modal logic (this was from earlier turn!)
content = content.replace(
    /schools\.map\(school => \(\{[\s\S]*?label: school\.name,[\s\S]*?value: school\._id,[\s\S]*?selected: p\.schoolId === school\._id \|\| p\.schoolId\?\._id === school\._id[\s\S]*?\}\)\)/g,
    `schools.map(school => ({\n                                                    label: school.name,\n                                                    value: school._id,\n                                                    selected: false\n                                                }))`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AcademicStructure.jsx');
