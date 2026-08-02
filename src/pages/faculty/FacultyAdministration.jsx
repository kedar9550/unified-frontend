import Loader from "../../components/common/Loader";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Select,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Chip,
  Divider,
  Switch
} from "@mui/material";
import { toast } from "sonner";
import {
  Save
} from "@mui/icons-material";
import PageHeader from "../../components/common/PageHeader";
import SectionHeader from "../../components/common/SectionHeader";
import NoActiveYearDialog from "../../components/common/NoActiveYearDialog";
import API from "../../api/axios";
import { ADMIN_ROLE_CATALOG, ASSIGNED_BY_OPTIONS } from "../../constants/adminRoleCatalog";


export default function FacultyAdministration() {
  // ── States ────────────────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearLabel, setSelectedYearLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [noActiveYearAlertOpen, setNoActiveYearAlertOpen] = useState(false);

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const selectMenuProps = {
    disableAutoFocusItem: true,
    slotProps: {
      list: {
        onMouseDown: blurActiveElement
      }
    }
  };
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isAddingRole, setIsAddingRole] = useState(false);

  // Form representation
  const [rolesFormData, setRolesFormData] = useState({});

  const activeYear = academicYears.find((y) => y.isGlobalActive);

  // Helper to check if role is already submitted and active
  const isPreExistingActive = (roleId) => {
    if (!currentEntry) return false;
    const foundRole = (currentEntry.roles || []).find((x) => x.roleId === roleId);
    if (!foundRole || !foundRole.isResponsible) return false;
    return foundRole.status === "Approved" || foundRole.status === "Pending";
  };

  // 1. Fetch Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/academic-years");
        let years = [];
        if (Array.isArray(res.data)) years = res.data;
        else if (res.data.years) years = res.data.years;
        else if (res.data.data) years = res.data.data;

        setAcademicYears(years);

        if (years.length > 0 && (!selectedYearLabel || selectedYearLabel === "")) {
          const active = years.find(y => y.isGlobalActive);
          setSelectedYearLabel(active ? active.year : "all");
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
        toast.error("Failed to load academic years");
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch User declarations
  const fetchDeclarations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/faculty-administration/my-entries");
      if (res.data?.success) {
        setAllEntries(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, []);

  // 3. Sync form with selected year
  useEffect(() => {
    if (selectedYearLabel === "all") {
      setCurrentEntry(null);
      setIsAddingRole(false);
      setRolesFormData({});
      return;
    }

    const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);
    if (!selectedYear) return;

    const matched = allEntries.find(
      (entry) => entry.academicYear?._id === selectedYear._id || entry.academicYear === selectedYear._id
    );

    setCurrentEntry(matched || null);
    setIsAddingRole(false);

    // Populate rolesFormData
    const initialForm = {};
    ADMIN_ROLE_CATALOG.forEach((r) => {
      let matchedRole = null;
      if (matched && matched.roles) {
        matchedRole = matched.roles.find((x) => x.roleId === r.roleId);
      }

      initialForm[r.roleId] = {
        roleId: r.roleId,
        roleLabel: r.label,
        isResponsible: matchedRole ? matchedRole.isResponsible : false,
        level: matchedRole ? matchedRole.level : "",
        assignedByType: matchedRole?.assignedBy?.type || "",
        assignedByOtherText: matchedRole?.assignedBy?.otherText || "",
        details: matchedRole ? matchedRole.details : ""
      };
    });

    setRolesFormData(initialForm);
  }, [selectedYearLabel, allEntries, academicYears]);

  const handleToggleResponsibility = (id, checked) => {
    if (isPreExistingActive(id)) return;

    setRolesFormData((prev) => {
      const allowedLevels = ADMIN_ROLE_CATALOG.find(r => r.roleId === id)?.allowedLevels || [];
      const defaultLevel = checked ? (allowedLevels.length === 1 ? allowedLevels[0] : "Department") : "";
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          isResponsible: checked,
          level: defaultLevel,
          assignedByType: checked ? prev[id].assignedByType : "",
          assignedByOtherText: checked ? prev[id].assignedByOtherText : "",
          details: checked ? prev[id].details : ""
        }
      };
    });
  };

  const handleLevelChange = (id, level) => {
    if (isPreExistingActive(id)) return;

    setRolesFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        level
      }
    }));
  };

  const handleDetailsChange = (id, field, value) => {
    if (isPreExistingActive(id)) return;

    setRolesFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);
    if (!selectedYear?._id) {
      toast.error("Please select a valid Academic Year");
      return;
    }

    // Verify at least one responsibility is selected
    const hasSelectedRole = Object.values(rolesFormData).some((role) => role.isResponsible);
    if (!hasSelectedRole) {
      toast.error("Please select at least one administrative responsibility before submitting");
      return;
    }

    // Prepare payload
    try {
      const rolesPayload = Object.values(rolesFormData)
        .filter(role => role.isResponsible)
        .map((role) => {
        // Validate details for Role 14
        if (role.roleId === "other" && !role.details.trim()) {
          throw new Error("Please specify the name of the event/activity.");
        }
        if (role.assignedByType === "Others" && !role.assignedByOtherText.trim()) {
          throw new Error(`Please specify who assigned the role: ${role.roleLabel}`);
        }
        if (!role.assignedByType) {
          throw new Error(`Please select who assigned the role: ${role.roleLabel}`);
        }
        if (!role.level) {
          throw new Error(`Please select the responsibility level for: ${role.roleLabel}`);
        }

        return {
          roleId: role.roleId,
          roleLabel: role.roleLabel,
          isResponsible: role.isResponsible,
          level: role.level,
          assignedBy: {
            type: role.assignedByType,
            otherText: role.assignedByType === "Others" ? role.assignedByOtherText : ""
          },
          details: role.details
        };
      });

      setSaving(true);
      const res = await API.post("/api/faculty-administration", {
        academicYear: selectedYear._id,
        roles: rolesPayload
      });

      if (res.data?.success) {
        toast.success("Administrative roles saved successfully!");
        setIsAddingRole(false);
        fetchDeclarations();
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || err.response?.data?.message || "Failed to save administrative roles.");
    } finally {
      setSaving(false);
    }
  };


  const hasAnyActiveRoles = allEntries.some(entry => (entry.roles || []).some(r => r.isResponsible));
  const hasActiveRoles = selectedYearLabel === "all"
    ? hasAnyActiveRoles
    : !!(currentEntry && (currentEntry.roles || []).some(r => r.isResponsible));

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Administrative Responsibilities"
        subtitle="Declare your administrative roles at Institute and Department levels for HOD verification." />

      {/* Select Academic Year */}
      <Box
        sx={{
          display: "flex",
          gap: 2.5,
          mb: 4,
          alignItems: "center",
          flexWrap: "wrap",
          p: 2.5,
          background: "var(--bg-panel)",
          borderRadius: "20px",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-premium)"
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Academic Cycle:
        </Typography>
        <Select
          value={selectedYearLabel}
          onChange={(e) => {
            setSelectedYearLabel(e.target.value);
            blurActiveElement();
          }}
          onClose={blurActiveElement}
          MenuProps={selectMenuProps}
          disabled={loading || saving}
          size="small"
          sx={{
            minWidth: 160,
            borderRadius: "12px",
            background: "var(--bg-glass)",
            color: "var(--text-primary)",
            fontWeight: 700,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-color)" }
          }}
        >
          <MenuItem value="all" sx={{ fontWeight: 600 }}>
            All Academic Years
          </MenuItem>
          {academicYears.map((y) => (
            <MenuItem key={y._id} value={y.year} sx={{ fontWeight: 600 }}>
              {y.year}
            </MenuItem>
          ))}
        </Select>

      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Loader size={40} sx={{ color: "var(--color-primary)" }} />
        </Box>
      ) : (
        <Box>
          {/* Declared Roles Summary List at the Start */}
          {hasActiveRoles && (
            <Box sx={{ mb: 5 }}>
              <SectionHeader
                title="Current Administrative Roles Summary"
                action={
                  selectedYearLabel !== "all" && selectedYearLabel === activeYear?.year && !isAddingRole && hasActiveRoles && (
                    <Button
                      variant="contained"
                      onClick={() => setIsAddingRole(true)}
                      sx={{
 
 fontWeight: 700,
 fontSize: "0.85rem",
 background: "linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)",
 boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)",
 color: "#fff",
 "&:hover": {
 opacity: 0.95
 }
 }}
 >
                      Add Another Role
                    </Button>
                  )
                }
              />
              <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                {(() => {
                  const activeRoles = [];
                  if (selectedYearLabel === "all") {
                    allEntries.forEach(entry => {
                      const yrLabel = entry.academicYear?.year || "Unknown";
                      (entry.roles || []).forEach(r => {
                        if (r.isResponsible) {
                          activeRoles.push({
                            ...r,
                            academicYearLabel: yrLabel,
                            status: r.status || "Pending"
                          });
                        }
                      });
                    });
                  } else if (currentEntry) {
                    const yrLabel = currentEntry.academicYear?.year || selectedYearLabel;
                    (currentEntry.roles || []).forEach(r => {
                      if (r.isResponsible) {
                        activeRoles.push({
                          ...r,
                          academicYearLabel: yrLabel,
                          status: r.status || "Pending"
                        });
                      }
                    });
                  }

                  if (activeRoles.length === 0) {
                    return (
                      <Grid size={{ xs: 12 }}>
                        <Card
                          sx={{
                            p: 3,
                            textAlign: "center",
                            bgcolor: "var(--bg-panel)",
                            border: "1px dashed var(--border-color)",
                            borderRadius: "20px"
                          }}
                        >
                          <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.95rem" }}>
                            No administrative roles declared for this academic cycle.
                          </Typography>
                        </Card>
                      </Grid>
                    );
                  }
                  return activeRoles.map((role, idx) => {
                    const statusText = role.status === "Rejected" ? "Disapproved" : role.status;
                    const statusColor =
                      role.status === "Approved"
                        ? "#10B981"
                        : role.status === "Rejected"
                        ? "#EF4444"
                        : "#d97706";
                    const statusBg =
                      role.status === "Approved"
                        ? "rgba(16, 185, 129, 0.1)"
                        : role.status === "Rejected"
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(245, 158, 11, 0.1)";
                    const statusBorder =
                      role.status === "Approved"
                        ? "rgba(16, 185, 129, 0.25)"
                        : role.status === "Rejected"
                        ? "rgba(239, 68, 68, 0.25)"
                        : "rgba(245, 158, 11, 0.25)";

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                        <Card
                          sx={{
                            p: 2.5,
                            borderRadius: "20px",
                            bgcolor: "var(--bg-panel)",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            minHeight: 120,
                            position: "relative",
                            overflow: "hidden"
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                              {role.roleLabel || role.roleName}
                            </Typography>
                            <Chip
                              label={statusText}
                              size="small"
                              sx={{
                                bgcolor: statusBg,
                                color: statusColor,
                                border: `1px solid ${statusBorder}`,
                                fontWeight: 800,
                                borderRadius: "8px",
                                fontSize: "0.72rem",
                                flexShrink: 0
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: "auto" }}>
                            <Chip
                              label={role.academicYearLabel}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.7rem",
                                color: "var(--color-primary)",
                                border: "1px solid var(--color-primary-alpha)",
                                bgcolor: "rgba(59, 130, 246, 0.08)",
                                borderRadius: "8px"
                              }}
                            />
                            <Chip
                              label={role.level}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                color: "var(--text-secondary)",
                                borderColor: "var(--border-color)"
                              }}
                            />
                            {role.assignedBy && (role.assignedBy.type || role.assignedBy) && (
                              <Chip
                                label={`Assigned By: ${typeof role.assignedBy === 'object' ? (role.assignedBy.type === "Others" ? role.assignedBy.otherText : role.assignedBy.type) : role.assignedBy}`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.7rem",
                                  bgcolor: "rgba(139, 92, 246, 0.08)",
                                  color: "#8b5cf6",
                                  border: "1px solid rgba(139, 92, 246, 0.2)",
                                  borderRadius: "8px"
                                }}
                              />
                            )}
                            {role.details && (
                              <Typography sx={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500, width: "100%", mt: 0.5 }}>
                                Event/Activity: <strong>{role.details}</strong>
                              </Typography>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    );
                  });
                })()}
              </Grid>
            </Box>
          )}

          {selectedYearLabel === "all" && (
            <Card
              sx={{
                p: 4,
                textAlign: "center",
                background: "var(--bg-panel)",
                border: "1px dashed var(--border-color)",
                borderRadius: "20px",
                mt: 4,
                boxShadow: "var(--shadow-premium)"
              }}
            >
              <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "1rem", mb: 1 }}>
                Want to declare new roles or update existing ones?
              </Typography>
              <Typography sx={{ color: "var(--text-secondary)", fontSize: "0.88rem", opacity: 0.8, mb: 2 }}>
                Please select the active Academic Cycle or click below to declare roles for the active academic year directly.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  if (activeYear) {
                    setSelectedYearLabel(activeYear.year);
                    setIsAddingRole(true);
                  } else {
                    setNoActiveYearAlertOpen(true);
                  }
                }}
                sx={{
                  px: 3,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  background: "linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)",
                  color: "#fff",
                  "&:hover": {
                    opacity: 0.95
                  }
                }}
              >
                Declare / Update Roles
              </Button>
            </Card>
          )}

          {selectedYearLabel !== "all" && selectedYearLabel !== activeYear?.year && !hasActiveRoles && (
            <Card
              sx={{
                p: 4,
                textAlign: "center",
                background: "var(--bg-panel)",
                border: "1px dashed var(--border-color)",
                borderRadius: "20px",
                mt: 4,
                boxShadow: "var(--shadow-premium)"
              }}
            >
              <Typography sx={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "1rem" }}>
                No administrative roles declared for this academic cycle.
              </Typography>
            </Card>
          )}

          {selectedYearLabel !== "all" && selectedYearLabel === activeYear?.year && (!hasActiveRoles || isAddingRole) && (
            <form onSubmit={handleSubmit}>
              {hasActiveRoles && (
                <Divider sx={{ my: 4, borderColor: "var(--border-color)" }} />
              )}
              <SectionHeader title="Select Held Administrative Roles" />

              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {ADMIN_ROLE_CATALOG.map((role) => {
                  const formData = rolesFormData[role.roleId] || { isResponsible: false, level: "", assignedByType: "", assignedByOtherText: "", details: "" };
                  
                  const isCardDisabled = isPreExistingActive(role.roleId);

                  return (
                    <Grid size={{ xs: 12 }} key={role.roleId}>
                      <Card
                        sx={{
                          p: 3,
                          borderRadius: "20px",
                          background: formData.isResponsible
                            ? "linear-gradient(135deg, var(--bg-panel) 0%, rgba(91, 33, 182, 0.03) 100%)"
                            : "var(--bg-panel)",
                          border: formData.isResponsible
                            ? "1px solid rgba(139, 92, 246, 0.25)"
                            : "1px solid var(--border-color)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: formData.isResponsible
                            ? "0 4px 20px rgba(139, 92, 246, 0.05)"
                            : "none",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "var(--shadow-premium)",
                            borderColor: formData.isResponsible ? "rgba(139, 92, 246, 0.4)" : "var(--color-primary-alpha)"
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3 }}>
                          <Box sx={{ flexGrow: 1, minWidth: 280 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", color: "var(--text-primary)" }}>
                              {role.label}
                            </Typography>
                            {/* <Typography sx={{ fontSize: "0.78rem", color: "var(--text-secondary)", mt: 0.5, fontWeight: 500 }}>
                              Toggle the switch if you held this administrative charge.
                            </Typography> */}
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: formData.isResponsible ? "var(--color-primary)" : "var(--text-secondary)" }}>
                              {formData.isResponsible ? "YES" : "NO"}
                            </Typography>
                            <Switch
                              checked={formData.isResponsible}
                              disabled={isCardDisabled || saving}
                              onChange={(e) => handleToggleResponsibility(role.roleId, e.target.checked)}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: "var(--color-primary)",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  backgroundColor: "var(--color-primary)",
                                }
                              }}
                            />
                          </Box>
                        </Box>

                        {formData.isResponsible && !isCardDisabled && (
                          <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px dashed var(--border-color)" }}>
                            <FormControl component="fieldset" disabled={saving}>
                              <FormLabel
                                component="legend"
                                sx={{
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  color: "var(--text-secondary)",
                                  textTransform: "uppercase",
                                  mb: 1.5,
                                  letterSpacing: "0.5px"
                                }}
                              >
                                Select Responsibility Level:
                              </FormLabel>
                              <RadioGroup
                                row
                                value={formData.level}
                                onChange={(e) => handleLevelChange(role.roleId, e.target.value)}
                              >
                                {role.allowedLevels.includes("Central") && (
                                  <FormControlLabel
                                    value="Central"
                                    control={<Radio sx={{ color: "var(--border-color)", "&.Mui-checked": { color: "var(--color-primary)" } }} />}
                                    label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Central Level</Typography>}
                                    sx={{ mr: 4 }}
                                  />
                                )}
                                {role.allowedLevels.includes("Department") && (
                                  <FormControlLabel
                                    value="Department"
                                    control={<Radio sx={{ color: "var(--border-color)", "&.Mui-checked": { color: "var(--color-primary)" } }} />}
                                    label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Department Level</Typography>}
                                  />
                                )}
                              </RadioGroup>
                            </FormControl>

                            <Box sx={{ mt: 3 }}>
                              <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
                                <InputLabel>Assigned By</InputLabel>
                                <Select
                                  value={formData.assignedByType}
                                  label="Assigned By"
                                  disabled={saving}
                                  onChange={(e) => handleDetailsChange(role.roleId, "assignedByType", e.target.value)}
                                  MenuProps={selectMenuProps}
                                  sx={{
                                    borderRadius: "12px",
                                    bgcolor: "var(--bg-glass)"
                                  }}
                                >
                                  <MenuItem value=""><em>Select Authority</em></MenuItem>
                                  {ASSIGNED_BY_OPTIONS.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>

                            {formData.assignedByType === "Others" && (
                              <Box sx={{ mt: 2.5 }}>
                                <TextField
                                  fullWidth
                                  label="Specify Assigned By"
                                  variant="outlined"
                                  size="small"
                                  value={formData.assignedByOtherText}
                                  disabled={saving}
                                  required
                                  onChange={(e) => handleDetailsChange(role.roleId, "assignedByOtherText", e.target.value)}
                                  sx={{
                                    maxWidth: 600,
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: "12px",
                                      bgcolor: "var(--bg-glass)"
                                    }
                                  }}
                                />
                              </Box>
                            )}

                            {role.roleId === 'other' && (
                              <Box sx={{ mt: 2.5 }}>
                                <TextField
                                  fullWidth
                                  label="Name of the Event or Activity"
                                  variant="outlined"
                                  size="small"
                                  value={formData.details}
                                  disabled={saving}
                                  required
                                  onChange={(e) => handleDetailsChange(role.roleId, "details", e.target.value)}
                                  placeholder="e.g. Smart Interviews Bootcamp Coordinator, Technical Fest Coordinator..."
                                  sx={{
                                    maxWidth: 600,
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: "12px",
                                      bgcolor: "var(--bg-glass)"
                                    }
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Action Row */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  background: "var(--bg-panel)",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  boxShadow: "var(--shadow-premium)"
                }}
              >
                {hasActiveRoles && (
                  <Button
 variant="outlined"
 onClick={() => setIsAddingRole(false)}
 disabled={saving}
 sx={{
 
 px: 4,
 py: 1.5,
 textTransform: "none",
 fontWeight: 700,
 fontSize: "0.95rem",
 borderColor: "var(--border-color)",
 color: "var(--text-secondary)",
 "&:hover": {
 borderColor: "var(--text-primary)",
 color: "var(--text-primary)",
 background: "var(--bg-glass)"
 }
 }}
 >
                    Cancel
                  </Button>
                )}
                <Button
 type="submit"
 disabled={saving}
 startIcon={saving ? <Loader size={18} sx={{ color: "#fff" }} /> : <Save />}
 sx={{
 
 px: 4,
 py: 1.5,
 textTransform: "none",
 fontWeight: 700,
 fontSize: "0.95rem",
 background: "linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%)",
 boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)",
 color: "#fff",
 "&:hover": {
 opacity: 0.95
 }
 }}
 >
                  {saving ? "Saving Changes..." : "Submit to HOD for Approval"}
                </Button>
              </Box>
            </form>
          )}
        </Box>
      )}
      <NoActiveYearDialog
        open={noActiveYearAlertOpen}
        onClose={() => setNoActiveYearAlertOpen(false)}
      />
    </Box>
  );
}
