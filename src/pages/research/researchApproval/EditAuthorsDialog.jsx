import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, TextField, Select, MenuItem, IconButton, Divider,
  RadioGroup, FormControlLabel, Radio, Grid
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import API from "../../../api/axios";

const labelStyle = { fontSize: 11, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", mb: 1, letterSpacing: "0.5px" };

export default function EditAuthorsDialog({ open, onClose, coAuthors = [], totalAuthors = 1, userAuthorPosition = 1, correspondingAuthor = "No", isStudentsInvolved = "No", onSave }) {
  const [authors, setAuthors] = useState([]);
  const [total, setTotal] = useState(totalAuthors || 1);
  const [position, setPosition] = useState(userAuthorPosition || 1);
  const [corrAuthor, setCorrAuthor] = useState(correspondingAuthor || "No");
  const [studentsInvolved, setStudentsInvolved] = useState(isStudentsInvolved || "No");

  useEffect(() => {
    if (open) {
      setAuthors(coAuthors.length > 0 ? [...coAuthors] : []);
      setTotal(totalAuthors || 1);
      setPosition(userAuthorPosition || 1);
      setCorrAuthor(correspondingAuthor || "No");
      setStudentsInvolved(isStudentsInvolved || "No");
    }
  }, [open, coAuthors, totalAuthors, userAuthorPosition, correspondingAuthor, isStudentsInvolved]);

  useEffect(() => {
    // Generate derived authors array based on total and position
    if (!open) return;
    const applicantPos = parseInt(position) || 0;
    const totalNum = parseInt(total) || 1;
    let newAuthors = [];
    
    let currentIdx = 0;
    for (let i = 1; i <= totalNum; i++) {
        if (i === applicantPos) continue; // Skip applicant position
        
        let existingAuthor = authors[currentIdx];
        if (existingAuthor && existingAuthor.authorPosition === i) {
            newAuthors.push(existingAuthor);
            currentIdx++;
        } else {
            // Find if there's an author with this position
            let found = authors.find(a => a.authorPosition === i);
            if (found) {
                newAuthors.push(found);
                // Try to advance index if we matched
                if (authors[currentIdx] === found) currentIdx++;
            } else {
                newAuthors.push({
                    authorPosition: i,
                    name: "",
                    CoAuthorType: "faculty",
                    affiliationType: "Select Affiliation",
                    affiliation: "",
                    studentId: "",
                    studentQualification: "",
                    empId: ""
                });
            }
        }
    }
    
    // Check if the arrays are different before updating state to avoid infinite loops
    let isDifferent = newAuthors.length !== authors.length;
    if (!isDifferent) {
        for (let i = 0; i < newAuthors.length; i++) {
            if (newAuthors[i].authorPosition !== authors[i].authorPosition) {
                isDifferent = true;
                break;
            }
        }
    }
    
    if (isDifferent) {
        setAuthors(newAuthors);
    }
  }, [total, position, open]); // Removed authors to prevent infinite loop

  const handleStudentsInvolvedChange = (e) => {
    const val = e.target.value;
    setStudentsInvolved(val);
    if (val === "No") {
      setAuthors(authors.map(a => ({
        ...a,
        CoAuthorType: "faculty",
        studentId: "",
        studentQualification: "",
        empId: a.CoAuthorType === "student" ? "" : a.empId
      })));
    }
  };

  const fetchCoAuthorName = async (pos, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data?.success) {
        const fetchedName = res.data.data?.employeename || res.data.data?.EmployeeName || "";
        setAuthors(prev => prev.map(a => 
          a.authorPosition === pos ? { ...a, name: fetchedName, affiliation: "Aditya University" } : a
        ));
      }
    } catch (error) {
      // ignore
    }
  };

  const handleAuthorChange = (pos, field, value) => {
    setAuthors(prev => prev.map(a => {
      if (a.authorPosition !== pos) return a;
      const newA = { ...a, [field]: value };
      if (field === "CoAuthorType" && value === "student") {
        newA.affiliationType = "Aditya University";
        newA.affiliation = "Aditya University";
      }
      return newA;
    }));

    if (field === "employeeId" && value.length >= 3) {
      const author = authors.find(a => a.authorPosition === pos);
      if (author?.affiliationType === "Aditya University") fetchCoAuthorName(pos, value);
    }
  };

  const handleSave = () => {
    onSave({ coAuthors: authors, totalAuthors: total, userAuthorPosition: position, correspondingAuthor: corrAuthor, isStudentsInvolved: studentsInvolved });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Author Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 4, bgcolor: "var(--bg-panel)" }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ ...labelStyle, mb: 0 }}>Are students involved in this work as co-authors? *</Typography>
          <RadioGroup row value={studentsInvolved} onChange={handleStudentsInvolvedChange}>
            <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
            <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
          </RadioGroup>
        </Box>

        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ ...labelStyle, mb: 0 }}>Corresponding Author : *</Typography>
          <RadioGroup row value={corrAuthor} onChange={(e) => setCorrAuthor(e.target.value)}>
            <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
            <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
          </RadioGroup>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography sx={labelStyle}>Total Number of Authors :</Typography>
            <TextField size="small" fullWidth type="number" value={total} onChange={(e) => setTotal(e.target.value)} inputProps={{ min: 1 }} />
          </Grid>
          {parseInt(total) > 1 && (
            <Grid item xs={12} sm={6}>
              <Typography sx={labelStyle}>Applicant Author Position :</Typography>
              <Select size="small" fullWidth value={position} onChange={(e) => setPosition(e.target.value)}>
                {Array.from({ length: parseInt(total) || 1 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </Grid>
          )}
        </Grid>

        {parseInt(total) > 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ ...labelStyle, mb: 1 }}>Name & Affiliation of Co-Author(s) :</Typography>
            {authors.map((ca) => (
              <Box
                key={ca.authorPosition}
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}
              >
                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                  {/* Position badge */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, fontSize: 14 }}>
                    {ca.authorPosition}
                  </Box>

                  {/* Co-Author Type */}
                  {studentsInvolved === "Yes" && (
                    <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "130px" } }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Co-Author Type</Typography>
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={ca.CoAuthorType || "faculty"}
                        onChange={(e) => handleAuthorChange(ca.authorPosition, "CoAuthorType", e.target.value)}
                      >
                        <MenuItem value="faculty">Faculty</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                      </Select>
                    </Box>
                  )}

                  {/* Affiliation Type */}
                  <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "150px" } }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Affiliation Type</Typography>
                    <Select
                      size="small"
                      fullWidth
                      displayEmpty
                      value={ca.CoAuthorType === "student" ? "Aditya University" : (ca.affiliationType || "Select Affiliation")}
                      onChange={(e) => handleAuthorChange(ca.authorPosition, "affiliationType", e.target.value)}
                    >
                      <MenuItem value="Select Affiliation" disabled>Select Affiliation</MenuItem>
                      <MenuItem value="Aditya University">Aditya University</MenuItem>
                      {ca.CoAuthorType !== "student" && (
                        <MenuItem value="Others">Others</MenuItem>
                      )}
                    </Select>
                  </Box>

                  {/* Dynamic Fields Based on Affiliation Type */}
                  {ca.affiliationType === "Aditya University" ? (
                    ca.CoAuthorType === "student" ? (
                      <>
                        <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "110px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Student Roll No</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.studentId || ""}
                            onChange={(e) => handleAuthorChange(ca.authorPosition, "studentId", e.target.value)}
                            placeholder="e.g. 21A91A0501"
                          />
                        </Box>
                        <Box sx={{ flex: 1.5, minWidth: { xs: "100%", sm: "160px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Student Name</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.name || ca.authorName || ""}
                            onChange={(e) => handleAuthorChange(ca.authorPosition, "name", e.target.value)}
                            placeholder="Full Name"
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "110px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Qualification</Typography>
                          <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={ca.studentQualification || ""}
                            onChange={(e) => handleAuthorChange(ca.authorPosition, "studentQualification", e.target.value)}
                          >
                            <MenuItem value="" disabled>Select</MenuItem>
                            <MenuItem value="UG">UG</MenuItem>
                            <MenuItem value="PG">PG</MenuItem>
                            <MenuItem value="Ph.D">Ph.D</MenuItem>
                          </Select>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Employee ID</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.empId || ca.employeeId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) handleAuthorChange(ca.authorPosition, "employeeId", val);
                            }}
                            placeholder="e.g. 5741"
                          />
                        </Box>
                        <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Co-Author Name</Typography>
                          <TextField
                            size="small"
                            fullWidth
                            value={ca.name || ca.authorName || ""}
                            onChange={(e) => handleAuthorChange(ca.authorPosition, "name", e.target.value)}
                            placeholder="Fetched from eCap"
                            disabled
                          />
                        </Box>
                      </>
                    )
                  ) : (
                    <>
                      <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "180px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Co-Author Name</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.name || ca.authorName || ""}
                          onChange={(e) => handleAuthorChange(ca.authorPosition, "name", e.target.value)}
                          placeholder="Full Name"
                        />
                      </Box>
                      <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>Affiliation</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={ca.affiliation || ca.affiliationName || ""}
                          onChange={(e) => handleAuthorChange(ca.authorPosition, "affiliation", e.target.value)}
                          placeholder="College / Organization"
                        />
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ textTransform: 'none', borderRadius: '8px' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ textTransform: 'none', borderRadius: '8px' }}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
