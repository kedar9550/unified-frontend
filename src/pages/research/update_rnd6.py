import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initialFormState
old_initial_state = """    applyingSeedGrant: "No",
    applyIncentive: "",
    otherInventors: [],
    appraisalEligible: "",
    approvedAmount: ""
  };"""

new_initial_state = """    applyingSeedGrant: "No",
    applyIncentive: "",
    otherInventors: [],
    appraisalEligible: "",
    approvedAmount: "",
    publisheddate: "",
    granteddate: ""
  };"""

content = content.replace(old_initial_state, new_initial_state)

# 2. Add files state update
old_files_state = """  const [files, setFiles] = useState({ cbr: null, form1: null });"""
new_files_state = """  const [files, setFiles] = useState({ cbr: null, form1: null, grantedCertificate: null });"""
content = content.replace(old_files_state, new_files_state)

old_reset_files = """      setFiles({ cbr: null, form1: null });"""
new_reset_files = """      setFiles({ cbr: null, form1: null, grantedCertificate: null });"""
content = content.replace(old_reset_files, new_reset_files)


# 3. Add conditionally rendered date fields
old_dates_ui = """              <Box>
                <Typography sx={labelStyle}>Date of Filing : <span style={{ color: 'red' }}>*</span></Typography>
                <TextField size="small" fullWidth type="date" value={form.dateOfFiling} onChange={set("dateOfFiling")} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Status of Patent Application :</Typography>
                <Select size="small" fullWidth displayEmpty value={form.status} onChange={set("status")}>
                  <MenuItem value="">--Select--</MenuItem>
                  {PATENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Box>"""

new_dates_ui = """              {form.status !== "Granted" && (
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
              )}"""

content = content.replace(old_dates_ui, new_dates_ui)

# 4. Add Granted Certificate upload
old_attachments_ui = """              <FileField label="Certificate of Basic Registration (CBR):" onChange={(e) => setFiles(p => ({ ...p, cbr: e.target.files[0] }))} />
              <FileField label="Form-1 Document:" onChange={(e) => setFiles(p => ({ ...p, form1: e.target.files[0] }))} />
              <Box>"""

new_attachments_ui = """              <FileField label="Certificate of Basic Registration (CBR):" onChange={(e) => setFiles(p => ({ ...p, cbr: e.target.files[0] }))} />
              <FileField label="Form-1 Document:" onChange={(e) => setFiles(p => ({ ...p, form1: e.target.files[0] }))} />
              {form.status === "Granted" && (
                <FileField label="Granted Certificate" onChange={(e) => setFiles(p => ({ ...p, grantedCertificate: e.target.files[0] }))} />
              )}
              <Box>"""

content = content.replace(old_attachments_ui, new_attachments_ui)

# 5. Append dates in handleSubmit
old_fd_appends_2 = """      fd.append("publishedstatus", form.status === "Published" ? "yes" : "no");
      fd.append("publishedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Published") ? expectedAmt : "");
      
      fd.append("grantedstatus", form.status === "Granted" ? "yes" : "no");
      fd.append("grantedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Granted") ? expectedAmt : "");
"""

new_fd_appends_2 = """      fd.append("publishedstatus", form.status === "Published" ? "yes" : "no");
      fd.append("publisheddate", form.publisheddate || "");
      fd.append("publishedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Published") ? expectedAmt : "");
      
      fd.append("grantedstatus", form.status === "Granted" ? "yes" : "no");
      fd.append("granteddate", form.granteddate || "");
      fd.append("grantedexpectedamount", (form.applyIncentive === "Yes" && form.status === "Granted") ? expectedAmt : "");
"""

content = content.replace(old_fd_appends_2, new_fd_appends_2)

# 6. Append Granted Certificate in handleSubmit
old_file_append = """      if (files.cbr) fd.append("cbr", files.cbr);
      if (files.form1) fd.append("form1", files.form1);"""

new_file_append = """      if (files.cbr) fd.append("cbr", files.cbr);
      if (files.form1) fd.append("form1", files.form1);
      if (files.grantedCertificate) fd.append("grantedCertificate", files.grantedCertificate);"""

content = content.replace(old_file_append, new_file_append)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 6")
