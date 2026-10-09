import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initialFormState
old_initial_state = """  const initialFormState = {
    title: "",
    applicantName: "",
    patentName: "",
    patentFiledInInstitution: "Yes",
    isInstitutionRecord: "No",
    area: "",
    filingNo: "",
    dateOfFiling: "",
    status: "",
    patentFiledCountry: "India",
    customCountryName: "",
    applyingSeedGrant: "No",
    applyIncentive: "",
    otherInventors: [],
    appraisalEligible: "",
    approvedAmount: ""
  };"""

new_initial_state = """  const initialFormState = {
    facultyRole: "Applicant",
    applicantAffiliation: "",
    title: "",
    applicantName: "",
    patentName: "Aditya University",
    patentFiledInInstitution: "Yes",
    isInstitutionRecord: "No",
    area: "",
    filingNo: "",
    dateOfFiling: "",
    status: "",
    patentFiledCountry: "India",
    customCountryName: "",
    applyingSeedGrant: "No",
    applyIncentive: "",
    otherInventors: [],
    appraisalEligible: "",
    approvedAmount: ""
  };"""

content = content.replace(old_initial_state, new_initial_state)

# 2. Update radio button change for patentFiledInInstitution
old_patent_filed_change = """                  <RadioGroup
                    row
                    value={form.patentFiledInInstitution || "Yes"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        patentFiledInInstitution: val,
                        patentName: val === "Yes" ? (PATENT_APPLICANTS.includes(prev.patentName) ? prev.patentName : "") : (targetFacultyName || prev.patentName || "")
                      }));
                    }}
                  >"""

new_patent_filed_change = """                  <RadioGroup
                    row
                    value={form.patentFiledInInstitution || "Yes"}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newRole = form.facultyRole || "Applicant";
                      setForm(prev => ({
                        ...prev,
                        patentFiledInInstitution: val,
                        patentName: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (targetFacultyName || "") : ""),
                        applicantAffiliation: val === "Yes" ? "Aditya University" : (newRole === "Applicant" ? (targetFacultyDetails?.college || "") : "")
                      }));
                    }}
                  >"""

content = content.replace(old_patent_filed_change, new_patent_filed_change)

# 3. Replace the applicant UI block
old_applicant_ui = """              <Box>
                <Typography sx={labelStyle}>Name of the Applicant in Patent : <span style={{ color: 'red' }}>*</span></Typography>
                {(form.patentFiledInInstitution || "Yes") === "Yes" ? (
                  <Select size="small" fullWidth displayEmpty value={form.patentName} onChange={set("patentName")}>
                    <MenuItem value="" disabled>--Select--</MenuItem>
                    {PATENT_APPLICANTS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    value={form.patentName}
                    onChange={set("patentName")}
                    placeholder="Enter Applicant Name in Patent"
                  />
                )}
              </Box>"""

new_applicant_ui = """              {form.patentFiledInInstitution === "No" && (
                <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Target Faculty's Role in the Patent *</Typography>
                    <RadioGroup
                      row
                      value={form.facultyRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm(prev => ({
                          ...prev,
                          facultyRole: val,
                          patentName: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (targetFacultyName || "") : ""),
                          applicantAffiliation: prev.patentFiledInInstitution === "Yes" ? "Aditya University" : (val === "Applicant" ? (targetFacultyDetails?.college || "") : "")
                        }));
                      }}
                    >
                      <FormControlLabel value="Applicant" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Applicant</Typography>} />
                      <FormControlLabel value="Inventor / Co-Inventor" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Inventor / Co-Inventor</Typography>} />
                    </RadioGroup>
                  </Box>
                </Box>
              )}

              <Box>
                <Typography sx={labelStyle}>Name of the Applicant : *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.patentName}
                  onChange={set("patentName")}
                  placeholder="Enter Applicant Name"
                  disabled={(form.patentFiledInInstitution || "Yes") === "Yes" || form.facultyRole === "Applicant"}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Applicant Affiliation : *</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.applicantAffiliation}
                  onChange={set("applicantAffiliation")}
                  placeholder="Enter Applicant Affiliation"
                  disabled={(form.patentFiledInInstitution || "Yes") === "Yes" || form.facultyRole === "Applicant"}
                />
              </Box>"""

content = content.replace(old_applicant_ui, new_applicant_ui)

# 4. Update handleSubmit validations
old_submit_validation = """  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (!form.title || !form.filingNo || !form.dateOfFiling) {"""

new_submit_validation = """  const handleSubmit = async () => {
    if (!targetFacultyEmpId || !isTargetFacultyValid) {
      toast.error("Please verify a valid Target Faculty Employee ID first");
      return;
    }
    if (form.facultyRole === "Inventor / Co-Inventor" && (!form.patentName || !form.applicantAffiliation)) {
      toast.error("Please provide the Name of the Applicant and Applicant Affiliation");
      return;
    }
    if (!form.patentName) {
      toast.error("Please provide the Name of the Applicant");
      return;
    }
    if (!form.title || !form.filingNo || !form.dateOfFiling) {"""

content = content.replace(old_submit_validation, new_submit_validation)

# 5. Update fd.append in handleSubmit
old_fd_appends_1 = """      fd.append("applicantName", form.applicantName || targetFacultyName || "");
      fd.append("patentName", form.patentName);"""

new_fd_appends_1 = """      fd.append("facultyRole", form.facultyRole || "Applicant");
      fd.append("applicantAffiliation", form.facultyRole === "Applicant" ? (targetFacultyDetails?.college || "") : (form.applicantAffiliation || ""));
      fd.append("applicantName", targetFacultyName || "");
      fd.append("patentName", form.patentName);"""

content = content.replace(old_fd_appends_1, new_fd_appends_1)

# 6. Update reset state after success
old_reset = """      setForm({
        title: "", applicantName: "", patentName: "", patentFiledInInstitution: "Yes", isInstitutionRecord: "No",
        area: "", filingNo: "", dateOfFiling: "",
        status: "", patentFiledCountry: "India", customCountryName: "", applyingSeedGrant: "No", applyIncentive: "",
        otherInventors: [], appraisalEligible: "", approvedAmount: ""
      });"""

new_reset = """      setForm(initialFormState);"""

content = content.replace(old_reset, new_reset)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 5")
