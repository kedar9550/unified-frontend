import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initialFormState with isUtilityType
old_initial_state = """  const initialFormState = {
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
    approvedAmount: "",
    publisheddate: "",
    granteddate: ""
  };"""

new_initial_state = """  const initialFormState = {
    facultyRole: "Applicant",
    applicantAffiliation: "",
    title: "",
    applicantName: "",
    patentName: "Aditya University",
    patentFiledInInstitution: "Yes",
    isInstitutionRecord: "No",
    isUtilityType: "Yes",
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
    approvedAmount: "",
    publisheddate: "",
    granteddate: ""
  };"""
content = content.replace(old_initial_state, new_initial_state)

# 2. Add isUtilityType to fd.append
old_fd_appends_3 = """      fd.append("facultyRole", form.facultyRole || "Applicant");
      fd.append("applicantAffiliation", form.facultyRole === "Applicant" ? (targetFacultyDetails?.college || "") : (form.applicantAffiliation || ""));
      fd.append("applicantName", targetFacultyName || "");
      fd.append("patentName", form.patentName);
      fd.append("patentFiledInInstitution", form.patentFiledInInstitution || "Yes");
      fd.append("area", form.area);"""

new_fd_appends_3 = """      fd.append("facultyRole", form.facultyRole || "Applicant");
      fd.append("applicantAffiliation", form.facultyRole === "Applicant" ? (targetFacultyDetails?.college || "") : (form.applicantAffiliation || ""));
      fd.append("applicantName", targetFacultyName || "");
      fd.append("patentName", form.patentName);
      fd.append("patentFiledInInstitution", form.patentFiledInInstitution || "Yes");
      fd.append("isUtilityType", form.isUtilityType || "Yes");
      fd.append("area", form.area);"""
content = content.replace(old_fd_appends_3, new_fd_appends_3)

# 3. Fix the reset form
old_reset_form = """      setForm({
        title: "", applicantName: "", patentName: "", patentFiledInInstitution: "Yes", isInstitutionRecord: "No",
        area: "", filingNo: "", dateOfFiling: "",
        status: "", patentFiledCountry: "India", customCountryName: "", applyingSeedGrant: "No", isStudentsInvolved: "No", applyIncentive: "",
        totalInventors: 1, otherInventors: [], appraisalEligible: "", approvedAmount: ""
      });"""
new_reset_form = """      setForm(initialFormState);"""
content = content.replace(old_reset_form, new_reset_form)


# 4. Rearrange the layout inside <FormCard title="Patent Details"> <Grid2>
old_layout = """          <FormCard title="Patent Details">
            <Grid2>
              {/* Is this an Institution Record? */}
              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is this an Institution Record? *</Typography>
                  <RadioGroup row value={form.isInstitutionRecord} onChange={set("isInstitutionRecord")}>
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                  {form.isInstitutionRecord === "Yes" && (
                    <Typography variant="caption" sx={{ color: "var(--color-warning, #f59e0b)", fontWeight: 600 }}>
                      ⚠ Institution Record: Apply Incentive and Appraisal Eligibility are Not Applicable
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Is Patent filed in Institution Name? */}
              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is Patent filed in University Name? *</Typography>
                  <RadioGroup
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
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>

              <Box>
                <Typography sx={labelStyle}>Academic Year :</Typography>
                <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
                </Select>
              </Box>
              {form.patentFiledInInstitution === "No" && (
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
              </Box>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Title of the Patent : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Full title of the patent" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Area of Patent :</Typography>
                <TextField size="small" fullWidth value={form.area} onChange={set("area")} placeholder="e.g. AI / Embedded Systems" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Patent Filing No : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.filingNo}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                      setForm(p => ({ ...p, filingNo: val }));
                    }
                  }}
                  placeholder="e.g. 202341012345"
                />
              </Box>
              {form.status !== "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Date of Filing : <span style={{ color: 'red' }}>*</span></Typography>
                  <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              <Box>
                <Typography sx={labelStyle}>Status of Patent Application :</Typography>
                <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
                  <MenuItem value="">--Select--</MenuItem>
                  {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Box>
              {(form.status === "Published" || form.status === "Granted") && (
                <Box>
                  <Typography sx={labelStyle}>Published Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.publisheddate} onChange={set("publisheddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              {form.status === "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Granted Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.granteddate} onChange={set("granteddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              <Box>
                <Typography sx={labelStyle}>Patent Filed Country :</Typography>
                <Select size="small" fullWidth value={form.patentFiledCountry} onChange={set("patentFiledCountry")}>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </Box>
              {form.patentFiledCountry === 'Others' && (
                <Box>
                  <Typography sx={labelStyle}>Enter Country Name :</Typography>
                  <TextField size="small" fullWidth value={form.customCountryName} onChange={set("customCountryName")} placeholder="e.g. USA, UK" />
                </Box>
              )}"""

new_layout = """          <FormCard title="Patent Details">
            <Grid2>
              {/* Row 0: Academic Year & Institution Record */}
              <Box>
                <Typography sx={labelStyle}>Academic Year :</Typography>
                <Select fullWidth size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {academicYears.map(y => <MenuItem key={y._id} value={y._id}>{y.yearRange || y.year}</MenuItem>)}
                </Select>
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", height: "100%" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)" }}>Is this an Institution Record? *</Typography>
                  <RadioGroup row value={form.isInstitutionRecord} onChange={set("isInstitutionRecord")}>
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>
              
              {form.isInstitutionRecord === "Yes" && (
                <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1 }}>
                    <Typography variant="caption" sx={{ color: "var(--color-warning, #f59e0b)", fontWeight: 600 }}>
                      ⚠ Institution Record: Apply Incentive and Appraisal Eligibility are Not Applicable
                    </Typography>
                </Box>
              )}

              {/* Target Faculty Role */}
              {form.patentFiledInInstitution === "No" && (
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

              {/* Row 1 */}
              <Box sx={{ p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Is Patent filed in University Name? *</Typography>
                  <RadioGroup
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
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>

              <Box sx={{ p: 2, background: "var(--bg-panel)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "12px", textTransform: "uppercase" }}>Is the patent utility type? *</Typography>
                  <RadioGroup
                    row
                    value={form.isUtilityType || "Yes"}
                    onChange={set("isUtilityType")}
                  >
                    <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                    <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                  </RadioGroup>
                </Box>
              </Box>

              {/* Row 2 */}
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
              </Box>

              {/* Row 3 */}
              <Box>
                <Typography sx={labelStyle}>Title of the Patent : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField size="small" fullWidth value={form.title} onChange={set("title")} placeholder="Enter Title of the Patent" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Status of Patent Application :</Typography>
                <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
                  <MenuItem value="">--Select--</MenuItem>
                  {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Box>

              {/* Row 4 */}
              <Box>
                <Typography sx={labelStyle}>Area of Patent :</Typography>
                <TextField size="small" fullWidth value={form.area} onChange={set("area")} placeholder="e.g. AI / Embedded Systems" />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Patent Application No : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={form.filingNo}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[A-Za-z0-9\/.-]+$/.test(val)) {
                      setForm(p => ({ ...p, filingNo: val }));
                    }
                  }}
                  placeholder="e.g. 202341012345"
                />
              </Box>

              {/* Row 5 */}
              <Box>
                <Typography sx={labelStyle}>Date of Filing : {form.status !== "Granted" && <span style={{ color: 'red' }}>*</span>}</Typography>
                {form.status !== "Granted" ? (
                  <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                ) : (
                  <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true } }} disabled />
                )}
              </Box>
              <Box>
                <Typography sx={labelStyle}>Patent Filed Country :</Typography>
                <Select size="small" fullWidth value={form.patentFiledCountry} onChange={set("patentFiledCountry")}>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </Box>

              {/* Conditional rows */}
              {(form.status === "Published" || form.status === "Granted") && (
                <Box>
                  <Typography sx={labelStyle}>Published Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.publisheddate} onChange={set("publisheddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              {form.status === "Granted" && (
                <Box>
                  <Typography sx={labelStyle}>Granted Date :</Typography>
                  <TextField size="small" fullWidth type="date" value={form.granteddate} onChange={set("granteddate")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().split("T")[0] } }} />
                </Box>
              )}
              {form.patentFiledCountry === 'Others' && (
                <Box>
                  <Typography sx={labelStyle}>Enter Country Name :</Typography>
                  <TextField size="small" fullWidth value={form.customCountryName} onChange={set("customCountryName")} placeholder="e.g. USA, UK" />
                </Box>
              )}"""

content = content.replace(old_layout, new_layout)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 7")
