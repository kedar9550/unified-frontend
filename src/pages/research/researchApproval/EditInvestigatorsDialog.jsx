import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, TextField, Select, MenuItem, IconButton, Divider,
  Chip
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import API from "../../../api/axios";

const labelStyle = { fontSize: 11, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", mb: 1, letterSpacing: "0.5px" };

export default function EditInvestigatorsDialog({
  open,
  onClose,
  coInvestigators = [],
  totalInvestigators = 1,
  investigatorType = "Principal Investigator (PI)",
  onSave
}) {
  const [total, setTotal] = useState(totalInvestigators || 1);
  const [role, setRole] = useState(investigatorType || "Principal Investigator (PI)");
  const [investigators, setInvestigators] = useState([]);

  useEffect(() => {
    if (open) {
      setTotal(totalInvestigators || 1);
      setRole(investigatorType || "Principal Investigator (PI)");
      setInvestigators(coInvestigators && coInvestigators.length > 0 ? [...coInvestigators] : []);
    }
  }, [open, totalInvestigators, investigatorType, coInvestigators]);

  useEffect(() => {
    if (!open) return;
    const totalNum = parseInt(total) || 1;
    if (totalNum <= 1) {
      setInvestigators([]);
      return;
    }

    const needed = totalNum - 1;
    let newInvList = [];

    for (let i = 0; i < needed; i++) {
      const expectedRole = role === "Principal Investigator (PI)"
        ? "Co-Investigator"
        : (i === 0 ? "Principal Investigator" : "Co-Investigator");

      const existing = investigators[i];
      if (existing) {
        newInvList.push({
          ...existing,
          investigatorPosition: i + 2,
          role: expectedRole,
          principalInvestigator: expectedRole === "Principal Investigator" ? "Yes" : "No",
          coPrincipalInvestigator: expectedRole === "Principal Investigator" ? "No" : "Yes",
          affiliationType: existing.affiliationType || (existing.employeeId || existing.affiliation === "Aditya University" ? "Aditya University" : (existing.affiliation ? "Others" : "Aditya University")),
          employeeId: existing.employeeId || existing.empId || "",
          empId: existing.employeeId || existing.empId || "",
          name: existing.name || "",
          affiliation: existing.affiliation || (existing.affiliationType === "Others" ? "" : "Aditya University"),
          department: existing.department || "",
          designation: existing.designation || ""
        });
      } else {
        newInvList.push({
          investigatorPosition: i + 2,
          role: expectedRole,
          principalInvestigator: expectedRole === "Principal Investigator" ? "Yes" : "No",
          coPrincipalInvestigator: expectedRole === "Principal Investigator" ? "No" : "Yes",
          affiliationType: "Aditya University",
          employeeId: "",
          empId: "",
          name: "",
          affiliation: "Aditya University",
          department: "",
          designation: ""
        });
      }
    }

    if (newInvList.length !== investigators.length || newInvList.some((inv, idx) => inv.role !== investigators[idx]?.role)) {
      setInvestigators(newInvList);
    }
  }, [total, role, open]);

  const fetchStaffDetails = async (index, empId) => {
    try {
      const res = await API.get(`/api/employees/staff/${empId}`);
      if (res.data?.success) {
        const staff = res.data.data;
        const fetchedName = staff.employeename || staff.EmployeeName || staff.employeeName || staff.name || "";
        const fetchedDept = staff.departmentname || staff.DepartmentName || staff.departmentName || staff.department || "";
        const fetchedDesig = staff.designation || staff.Designation || "";
        setInvestigators(prev => prev.map((inv, idx) =>
          idx === index ? {
            ...inv,
            name: fetchedName,
            department: fetchedDept,
            designation: fetchedDesig,
            affiliation: "Aditya University"
          } : inv
        ));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleInvestigatorChange = (index, field, value) => {
    setInvestigators(prev => prev.map((inv, idx) => {
      if (idx !== index) return inv;
      const updated = { ...inv, [field]: value };
      if (field === "affiliationType") {
        if (value === "Aditya University") {
          updated.affiliation = "Aditya University";
        } else {
          updated.affiliation = "";
          updated.employeeId = "";
          updated.empId = "";
        }
      }
      if (field === "employeeId") {
        updated.empId = value;
        updated.employeeId = value;
      }
      return updated;
    }));

    if (field === "employeeId" && value.length >= 3) {
      const current = investigators[index];
      if (current?.affiliationType === "Aditya University" || !current?.affiliationType) {
        fetchStaffDetails(index, value);
      }
    }
  };

  const handleSave = () => {
    const isPI = role === "Principal Investigator (PI)" || role === "Principal Investigator";
    onSave({
      totalInvestigators: parseInt(total) || 1,
      investigatorType: role,
      principalInvestigator: isPI ? "Yes" : "No",
      coPrincipalInvestigator: isPI ? "No" : "Yes",
      coInvestigators: investigators
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Investigator Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: "var(--bg-panel)" }}>
        <Box sx={{ display: "flex", gap: 3, mb: 3, width: "100%", flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "200px" } }}>
            <Typography sx={labelStyle}>Total Number of Investigators :</Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "240px" } }}>
            <Typography sx={labelStyle}>Applicant Role in Consultancy :</Typography>
            <Select
              size="small"
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="Principal Investigator (PI)">Principal Investigator (PI)</MenuItem>
              <MenuItem value="Co-Principal Investigator (Co-PI)">Co-Principal Investigator (Co-PI)</MenuItem>
            </Select>
          </Box>
        </Box>

        {parseInt(total) > 1 && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <Typography sx={{ ...labelStyle, mb: 2, fontSize: 13 }}>Name & Affiliation of Co-Investigator(s) :</Typography>
            {investigators.map((inv, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mb: 2.5,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: "14px",
                  border: "1px dashed var(--border-color)",
                  background: "rgba(190, 147, 55, 0.03)",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", pb: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 800, fontSize: "0.85rem" }}>
                      {index + 1}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      Investigator #{index + 1}
                    </Typography>
                  </Box>
                  <Chip
                    label={inv.role}
                    size="small"
                    color={inv.role === "Principal Investigator" ? "primary" : "secondary"}
                    sx={{ fontWeight: 700, borderRadius: "6px", fontSize: "0.75rem" }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2, width: "100%", flexWrap: { xs: "wrap", md: "nowrap" }, alignItems: "flex-start", mt: 0.5 }}>
                  {/* Affiliation Type */}
                  <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 180px", md: "1.2" }, minWidth: { xs: "100%", sm: "160px" } }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>AFFILIATION TYPE</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={inv.affiliationType || "Aditya University"}
                      onChange={(e) => handleInvestigatorChange(index, "affiliationType", e.target.value)}
                    >
                      <MenuItem value="Aditya University">Aditya University</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </Box>

                  {inv.affiliationType === "Aditya University" ? (
                    <>
                      {/* Employee ID */}
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "0 0 160px", md: "1.2" }, minWidth: { xs: "100%", sm: "140px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>EMPLOYEE ID / STAFF CODE *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={inv.employeeId || inv.empId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) handleInvestigatorChange(index, "employeeId", val);
                          }}
                          placeholder="e.g. 5910"
                        />
                      </Box>

                      {/* Name - flex 2.5 for ample room */}
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px", md: "2.6" }, minWidth: { xs: "100%", sm: "200px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>NAME</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={inv.name || ""}
                          onChange={(e) => handleInvestigatorChange(index, "name", e.target.value)}
                          placeholder="Staff Name"
                        />
                      </Box>

                      {/* Department - flex 2 */}
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px", md: "2.2" }, minWidth: { xs: "100%", sm: "180px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>DEPARTMENT</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={inv.department || ""}
                          onChange={(e) => handleInvestigatorChange(index, "department", e.target.value)}
                          placeholder="Department"
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Name for Others - flex 2.5 */}
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 220px", md: "2.5" }, minWidth: { xs: "100%", sm: "200px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>NAME *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={inv.name || ""}
                          onChange={(e) => handleInvestigatorChange(index, "name", e.target.value)}
                          placeholder="Full Name"
                        />
                      </Box>

                      {/* Affiliation for Others - flex 3.5 */}
                      <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 260px", md: "3.5" }, minWidth: { xs: "100%", sm: "240px" } }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary", textTransform: "uppercase" }}>AFFILIATION *</Typography>
                        <TextField
                          size="small"
                          fullWidth
                          value={inv.affiliation || ""}
                          onChange={(e) => handleInvestigatorChange(index, "affiliation", e.target.value)}
                          placeholder="Organization / College / University"
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
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ textTransform: "none", borderRadius: "8px" }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ textTransform: "none", borderRadius: "8px" }}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
