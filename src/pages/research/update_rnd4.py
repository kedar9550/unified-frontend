import sys

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 8. Remove isStudentsInvolved RadioGroup UI
old_students_radio_ui = """              <Box sx={{ gridColumn: { sm: "1 / -1" }, mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography sx={{ ...labelStyle, mb: 0 }}>Are students involved in this work as co-inventors? *</Typography>
                <RadioGroup row value={form.isStudentsInvolved || "No"} onChange={handleStudentsInvolvedChange}>
                  <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                  <FormControlLabel value="No" control={<Radio size="small" sx={{ color: "var(--color-primary)", "&.Mui-checked": { color: "var(--color-primary)" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
                </RadioGroup>
              </Box>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography sx={labelStyle}>Total Number of Inventors :</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={form.totalInventors}
                  onChange={set("totalInventors")}
                  slotProps={{ htmlInput: { min: 1 } }}
                  sx={{ maxWidth: 250 }}
                />
              </Box>
              {parseInt(form.totalInventors) > 1 && ("""

new_inventors_ui = """              <Box sx={{ gridColumn: { sm: "1 / -1" }, display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 0, fontSize: 14 }}>Co-Inventor(s) Details (if any):</Typography>
                {form.otherInventors.length === 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddInventor}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
                  >
                    + Add inventor / co-inventor details
                  </Button>
                )}
              </Box>

              {form.otherInventors.length > 0 && ("""

content = content.replace(old_students_radio_ui, new_inventors_ui)

# 9. Update the mapped inventors UI
old_inventors_map = """                  <Typography sx={{ ...labelStyle, mb: 1, fontWeight: 700 }}>Name & Affiliation of Co-Inventor(s) :</Typography>
                  {form.otherInventors.map((ca) => (
                    <Box key={ca.inventorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
                          {ca.inventorPosition}
                        </Box>

                        {/* Co-Inventor Type (if students are involved) */}
                        {form.isStudentsInvolved === "Yes" && (
                          <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "130px" } }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR TYPE</Typography>
                            <Select
                              size="small"
                              fullWidth
                              displayEmpty
                              value={ca.CoInventorType || "faculty"}
                              onChange={(e) => handleCoInventorChange(ca.inventorPosition, "CoInventorType", e.target.value)}
                              MenuProps={{ disableScrollLock: true, disableRestoreFocus: true }}
                            >
                              <MenuItem value="faculty">Faculty</MenuItem>
                              <MenuItem value="student">Student</MenuItem>
                            </Select>
                          </Box>
                        )}

                        <Box sx={{ flex: 1, minWidth: "150px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                          <Select
                            size="small"
                            fullWidth
                            value={ca.CoInventorType === "student" ? "Aditya University" : ca.affiliationType}
                            onChange={(e) => handleCoInventorChange(ca.inventorPosition, "affiliationType", e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>Select Affiliation</MenuItem>
                            <MenuItem value="Aditya University">Aditya University</MenuItem>
                            {ca.CoInventorType !== "student" && (
                              <MenuItem value="Others">Others</MenuItem>
                            )}
                          </Select>
                        </Box>

                        {ca.affiliationType === "Aditya University" ? (
                          ca.CoInventorType === "student" ? (
                            <>
                              <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "120px" } }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>STUDENT ROLL NO</Typography>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={ca.studentId || ""}
                                  onChange={(e) => handleCoInventorChange(ca.inventorPosition, "studentId", e.target.value)}
                                  placeholder="e.g. 21A91A0501"
                                />
                              </Box>
                              <Box sx={{ flex: 2, minWidth: { xs: "100%", sm: "200px" } }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={ca.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (!/\d/.test(val)) handleCoInventorChange(ca.inventorPosition, "name", val);
                                  }}
                                  placeholder="Student Name"
                                />
                              </Box>
                            </>
                          ) : (
                            <>
                              <Box sx={{ flex: 1, minWidth: "120px" }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={ca.empId}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) handleCoInventorChange(ca.inventorPosition, "empId", val);
                                  }}
                                  placeholder="e.g. 5741"
                                />
                              </Box>
                              <Box sx={{ flex: 2, minWidth: "200px" }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={ca.name}
                                  disabled
                                  placeholder="Auto-fetched"
                                  sx={{ background: "rgba(0,0,0,0.02)" }}
                                />
                              </Box>
                            </>
                          )
                        ) : (
                          <>
                            <Box sx={{ flex: 1, minWidth: "180px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.name}
                                onChange={(e) => handleCoInventorChange(ca.inventorPosition, "name", e.target.value)}
                                placeholder="Full Name"
                              />
                            </Box>
                            <Box sx={{ flex: 2, minWidth: "200px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.affiliation}
                                onChange={(e) => handleCoInventorChange(ca.inventorPosition, "affiliation", e.target.value)}
                                placeholder="Organization / College"
                              />
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}"""

new_inventors_map = """                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                    <Typography sx={{ ...labelStyle, mb: 0, fontWeight: 700 }}>Name & Affiliation of Co-Inventor(s) :</Typography>
                    <Button variant="outlined" size="small" onClick={handleAddInventor} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}>
                      + Add More
                    </Button>
                  </Box>
                  {form.otherInventors.map((ca) => (
                    <Box key={ca.inventorPosition} sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2, p: 2, borderRadius: "12px", border: "1px dashed var(--border-color)", background: "var(--bg-accent-1)" }}>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" }, alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", background: "var(--color-primary)", color: "#fff", borderRadius: "50%", fontWeight: 700, flexShrink: 0 }}>
                          {ca.inventorPosition}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: "150px" }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION TYPE</Typography>
                          <Select
                            size="small"
                            fullWidth
                            value={ca.affiliationType}
                            onChange={(e) => handleCoInventorChange(ca.inventorPosition, "affiliationType", e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>Select Affiliation</MenuItem>
                            <MenuItem value="Aditya University">Aditya University</MenuItem>
                            <MenuItem value="Others">Others</MenuItem>
                          </Select>
                        </Box>

                        {ca.affiliationType === "Aditya University" ? (
                          <>
                            <Box sx={{ flex: 1, minWidth: "120px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>EMPLOYEE ID</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.empId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val)) handleCoInventorChange(ca.inventorPosition, "empId", val);
                                }}
                                placeholder="e.g. 5741"
                              />
                            </Box>
                            <Box sx={{ flex: 2, minWidth: "200px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.name}
                                disabled
                                placeholder="Auto-fetched"
                                sx={{ background: "rgba(0,0,0,0.02)" }}
                              />
                            </Box>
                          </>
                        ) : ca.affiliationType === "Others" ? (
                          <>
                            <Box sx={{ flex: 1, minWidth: "180px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>CO-INVENTOR NAME</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.name}
                                onChange={(e) => handleCoInventorChange(ca.inventorPosition, "name", e.target.value)}
                                placeholder="Full Name"
                              />
                            </Box>
                            <Box sx={{ flex: 2, minWidth: "200px" }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>AFFILIATION</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={ca.affiliation}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!/\d/.test(val)) handleCoInventorChange(ca.inventorPosition, "affiliation", val);
                                }}
                                placeholder="Organization / College"
                              />
                            </Box>
                          </>
                        ) : null}

                        <import { Close } from "@mui/icons-material";
                        import { IconButton } from "@mui/material";
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveInventor(ca.inventorPosition)}
                          sx={{ mt: { sm: 2 } }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}"""

content = content.replace(old_inventors_map, new_inventors_map)

# Fix the import for Close icon (since I put it inside the template above incorrectly)
content = content.replace('<import { Close } from "@mui/icons-material";', '')
content = content.replace('import { IconButton } from "@mui/material";', '')
if "Close" not in content[:500]:
    content = content.replace('Visibility, Close }', 'Visibility, Close }').replace('Visibility }', 'Visibility, Close }')

# 10. Change eFilingReceipt label
content = content.replace('label="e-Filing Receipt Document:"', 'label="Certificate of Basic Registration (CBR):"')

# 11. Add Estimated Amount Block + remove disabled logic for applyIncentive
old_apply_incentive = """              <Box>
                <Typography sx={labelStyle}>Apply Incentive? : *</Typography>
                <Select
                  size="small" fullWidth displayEmpty
                  value={form.applyIncentive}
                  onChange={set("applyIncentive")}
                  disabled={form.isInstitutionRecord === "Yes" || form.isStudentsInvolved === "Yes"}
                  sx={(form.isInstitutionRecord === "Yes" || form.isStudentsInvolved === "Yes") ? { opacity: 0.6 } : {}}
                >
                  <MenuItem value="" disabled>Select Option</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>
              {form.applyIncentive === "Yes" && (
                <Box>
                  <Typography sx={labelStyle}>Approved Incentive Amount (₹) : *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="Enter approved amount"
                    value={form.approvedAmount}
                    onChange={set("approvedAmount")}
                  />
                </Box>
              )}"""

new_apply_incentive = """              <Box>
                <Typography sx={labelStyle}>Apply Incentive? : *</Typography>
                <Select
                  size="small" fullWidth displayEmpty
                  value={form.applyIncentive}
                  onChange={set("applyIncentive")}
                  disabled={form.isInstitutionRecord === "Yes"}
                  sx={form.isInstitutionRecord === "Yes" ? { opacity: 0.6 } : {}}
                >
                  <MenuItem value="" disabled>Select Option</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </Box>

              {(() => {
                const amount = form.status === "Published" ? 5000 : (form.status === "Granted" ? 15000 : 0);
                let expectedAmt = amount;
                if (form.applyingSeedGrant === "Yes") expectedAmt = expectedAmt / 2;
                
                if (form.applyIncentive === "Yes" && form.status) {
                  return (
                    <Box sx={{
                      gridColumn: { sm: "1 / -1" },
                      p: 2.5,
                      borderRadius: "12px",
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px dashed rgba(16, 185, 129, 0.3)",
                      mb: 2
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#059669" }}>
                            Estimated Research Incentive Amount
                          </Typography>
                          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#047857", mt: 0.5 }}>
                            ₹{expectedAmt.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }
                return null;
              })()}

              {form.applyIncentive === "Yes" && (
                <Box>
                  <Typography sx={labelStyle}>Approved Incentive Amount (₹) : *</Typography>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="Enter approved amount"
                    value={form.approvedAmount}
                    onChange={set("approvedAmount")}
                  />
                </Box>
              )}"""

content = content.replace(old_apply_incentive, new_apply_incentive)

with open(r'd:\W\Unified\unified-frontend\src\pages\research\RndPatentDataEntry.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Part 4")
