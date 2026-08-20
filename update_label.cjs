const fs = require('fs');
const files = [
  'src/pages/faculty/BookChapterPublication.jsx',
  'src/pages/faculty/ConferencePublication.jsx',
  'src/pages/faculty/ConsultancyPublication.jsx',
  'src/pages/faculty/FundedProject.jsx',
  'src/pages/faculty/JournalPublication.jsx',
  'src/pages/faculty/NovelProductPublication.jsx',
  'src/pages/faculty/PatentPublication.jsx',
  'src/pages/faculty/PhdScholarPublication.jsx',
  'src/pages/faculty/TextbookPublication.jsx'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const name = file.includes('Journal') ? 'LabelValue' : 'LabelValueDetails';
    const premiumCode = 'const ' + name + ' = ({ label, value, chip, horizontal = false }) => (\n' +
      '    <Box sx={{\n' +
      '      p: 2,\n' +
      '      borderRadius: "16px",\n' +
      '      background: horizontal ? "transparent" : "linear-gradient(145deg, var(--bg-paper) 0%, var(--bg-panel) 100%)",\n' +
      '      border: horizontal ? "none" : "1px solid var(--border-color)",\n' +
      '      borderBottom: horizontal ? "1px solid var(--border-color)" : "1px solid var(--border-color)",\n' +
      '      display: "flex",\n' +
      '      flexDirection: horizontal ? "row" : "column",\n' +
      '      alignItems: horizontal ? "center" : "flex-start",\n' +
      '      justifyContent: horizontal ? "flex-start" : "center",\n' +
      '      gap: horizontal ? 2 : 1,\n' +
      '      height: "100%",\n' +
      '      boxShadow: horizontal ? "none" : "0 4px 20px rgba(0,0,0,0.03)",\n' +
      '      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",\n' +
      '      "&:hover": horizontal ? {} : {\n' +
      '        borderColor: "var(--color-primary)",\n' +
      '        transform: "translateY(-2px)",\n' +
      '        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",\n' +
      '      },\n' +
      '      "&:last-child": horizontal ? { borderBottom: "none" } : {},\n' +
      '    }}>\n' +
      '      <Typography variant="caption" sx={{ color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 1 }}>\n' +
      '        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "var(--color-primary)", opacity: 0.8 }} />\n' +
      '        {label}\n' +
      '      </Typography>\n' +
      '      <Box sx={{ flex: horizontal ? 1 : "none", display: "flex", alignItems: "center", mt: horizontal ? 0 : 0.5, ml: horizontal ? 0 : 1.5 }}>\n' +
      '        {chip ? chip : <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.95rem", wordBreak: "break-word", lineHeight: 1.4 }}>{value || "-"}</Typography>}\n' +
      '      </Box>\n' +
      '    </Box>\n' +
      '  );';

    // Regex to match the function block accurately
    const regex = new RegExp('const ' + name + ' = \\(\\{.*?(?:\\r?\\n.*?)*?  \\);', 'g');
    if (content.match(regex)) {
      const result = content.replace(regex, premiumCode);
      fs.writeFileSync(file, result);
      console.log("Updated " + file);
    } else {
      console.log("Regex not matched in " + file);
    }
  } catch(e) {
    console.error("Error with file " + file + ": " + e);
  }
});
console.log("Done");
