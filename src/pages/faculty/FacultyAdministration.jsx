import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
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
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const ADMINISTRATIVE_ROLES_LIST = [
  { id: "dean", label: "Deans / Assoc Deans / CoE" },
  { id: "hod", label: "HoD / Dy. CoE / Coordinator (Univ. Office)" },
  { id: "dy_hod", label: "Dy. HoD / Dept. Exam Cell Incharge" },
  { id: "timetable", label: "Time Table / Project Coordinator / Curriculum Coordinator" },
  { id: "placement", label: "Placement / Internship / Alumni Coordinator" },
  { id: "coursera", label: "Coursera / LinkedIn Coordinator / ALA" },
  { id: "edc", label: "EDC / IIC / IQAC Coordinator" },
  { id: "course_coord", label: "Course Coordinator" },
  { id: "website", label: "Website Coordinator" },
  { id: "nss", label: "NSS / Any Clubs / Professional Chapters Coordinator" },
  { id: "training", label: "Any Training Program Coordinator (Smart Interviews / GPP / Etc.)" },
  { id: "drc", label: "DRC / Research Coordinator" },
  { id: "antiragging", label: "Anti-Ragging Committee Coordinator" },
  { id: "other", label: "Any other remarkable event / activity coordinator", hasDetails: true }
];

export default function FacultyAdministration() {
  const { user } = useAuth();

  // ── States ────────────────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearLabel, setSelectedYearLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allEntries, setAllEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isAddingRole, setIsAddingRole] = useState(false);

  // Form representation
  const [rolesFormData, setRolesFormData] = useState({});

  // Helper to check if role is already submitted and active
  const isPreExistingActive = (roleLabel) => {
    return !!(
      currentEntry &&
      (currentEntry.status === "Approved" || currentEntry.status === "Pending") &&
      (currentEntry.roles || []).find((x) => x.roleName === roleLabel)?.isResponsible
    );
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

        if (years.length > 0 && !selectedYearLabel) {
          setSelectedYearLabel(years[0].year);
        }
      } catch (err) {
        console.error("Error fetching academic years:", err);
        toast.error("Failed to load academic years.");
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
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
    const selectedYear = academicYears.find((y) => y.year === selectedYearLabel);
    if (!selectedYear) return;

    const matched = allEntries.find(
      (entry) => entry.academicYear?._id === selectedYear._id || entry.academicYear === selectedYear._id
    );

    setCurrentEntry(matched || null);
    setIsAddingRole(false);

    // Populate rolesFormData
    const initialForm = {};
    ADMINISTRATIVE_ROLES_LIST.forEach((r) => {
      let matchedRole = null;
      if (matched && matched.roles) {
        matchedRole = matched.roles.find((x) => x.roleName === r.label);
      }

      initialForm[r.id] = {
        roleName: r.label,
        isResponsible: matchedRole ? matchedRole.isResponsible : false,
        level: matchedRole ? matchedRole.level : "",
        details: matchedRole ? matchedRole.details : ""
      };
    });

    setRolesFormData(initialForm);
  }, [selectedYearLabel, allEntries, academicYears]);

  const handleToggleResponsibility = (id, checked) => {
    const roleLabel = ADMINISTRATIVE_ROLES_LIST.find((r) => r.id === id)?.label;
    if (isPreExistingActive(roleLabel)) return;

    setRolesFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isResponsible: checked,
        // Reset level and details if set to false
        level: checked ? (prev[id].level || "Department level") : "",
        details: checked ? prev[id].details : ""
      }
    }));
  };

  const handleLevelChange = (id, level) => {
    const roleLabel = ADMINISTRATIVE_ROLES_LIST.find((r) => r.id === id)?.label;
    if (isPreExistingActive(roleLabel)) return;

    setRolesFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        level
      }
    }));
  };

  const handleDetailsChange = (id, details) => {
    const roleLabel = ADMINISTRATIVE_ROLES_LIST.find((r) => r.id === id)?.label;
    if (isPreExistingActive(roleLabel)) return;

    setRolesFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        details
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

    // Prepare payload
    const rolesPayload = Object.values(rolesFormData).map((role) => {
      // Validate details for Role 14
      if (role.roleName === "Any other remarkable event / activity coordinator" && role.isResponsible && !role.details.trim()) {
        throw new Error("Please specify the name of the event/activity.");
      }
      return {
        roleName: role.roleName,
        isResponsible: role.isResponsible,
        level: role.isResponsible ? role.level : "",
        details: role.isResponsible ? role.details : ""
      };
    });

    setSaving(true);
    try {
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


  const hasActiveRoles = currentEntry && (currentEntry.roles || []).some(r => r.isResponsible);

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      <PageHeader
        title="Administrative Responsibilities"
        subtitle="Declare your administrative roles at Institute and Department levels for HOD verification."
        breadcrumbs={["Home", "Faculty", "Administration"]}
      />

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
          onChange={(e) => setSelectedYearLabel(e.target.value)}
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
          {academicYears.map((y) => (
            <MenuItem key={y._id} value={y.year} sx={{ fontWeight: 600 }}>
              {y.year}
            </MenuItem>
          ))}
        </Select>

      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} sx={{ color: "var(--color-primary)" }} />
        </Box>
      ) : (
        <Box>
          {/* Declared Roles Summary List at the Start */}
          {currentEntry && (
            <Box sx={{ mb: 5 }}>
              <SectionHeader
                title="Current Administrative Roles Summary"
                action={
                  !isAddingRole && hasActiveRoles && (
                    <Button
                      variant="contained"
                      onClick={() => setIsAddingRole(true)}
                      sx={{
                        borderRadius: "12px",
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
                      Add Another Role
                    </Button>
                  )
                }
              />
              <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                {(() => {
                  const activeRoles = (currentEntry.roles || []).filter(r => r.isResponsible);
                  if (activeRoles.length === 0) {
                    return (
                      <Grid item xs={12}>
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
                    const statusText = currentEntry.status === "Rejected" ? "Disapproved" : currentEntry.status;
                    const statusColor =
                      currentEntry.status === "Approved"
                        ? "#10B981"
                        : currentEntry.status === "Rejected"
                        ? "#EF4444"
                        : "#d97706";
                    const statusBg =
                      currentEntry.status === "Approved"
                        ? "rgba(16, 185, 129, 0.1)"
                        : currentEntry.status === "Rejected"
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(245, 158, 11, 0.1)";
                    const statusBorder =
                      currentEntry.status === "Approved"
                        ? "rgba(16, 185, 129, 0.25)"
                        : currentEntry.status === "Rejected"
                        ? "rgba(239, 68, 68, 0.25)"
                        : "rgba(245, 158, 11, 0.25)";

                    return (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
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
                              {role.roleName}
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

          {(!hasActiveRoles || isAddingRole) && (
            <form onSubmit={handleSubmit}>
              {hasActiveRoles && (
                <Divider sx={{ my: 4, borderColor: "var(--border-color)" }} />
              )}
              <SectionHeader title="Select Held Administrative Roles" />

              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {ADMINISTRATIVE_ROLES_LIST.map((role) => {
                  const formData = rolesFormData[role.id] || { isResponsible: false, level: "", details: "" };
                  
                  const isPreExistingActive = currentEntry && 
                    (currentEntry.status === "Approved" || currentEntry.status === "Pending") &&
                    (currentEntry.roles || []).find(x => x.roleName === role.label)?.isResponsible;

                  const isCardDisabled = !!isPreExistingActive;

                  return (
                    <Grid item xs={12} key={role.id}>
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
                              onChange={(e) => handleToggleResponsibility(role.id, e.target.checked)}
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

                        {formData.isResponsible && !isPreExistingActive && (
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
                                onChange={(e) => handleLevelChange(role.id, e.target.value)}
                              >
                                <FormControlLabel
                                  value="Institute level"
                                  control={<Radio sx={{ color: "var(--border-color)", "&.Mui-checked": { color: "var(--color-primary)" } }} />}
                                  label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Institute Level</Typography>}
                                  sx={{ mr: 4 }}
                                />
                                <FormControlLabel
                                  value="Department level"
                                  control={<Radio sx={{ color: "var(--border-color)", "&.Mui-checked": { color: "var(--color-primary)" } }} />}
                                  label={<Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Department Level</Typography>}
                                />
                              </RadioGroup>
                            </FormControl>

                            {role.hasDetails && (
                              <Box sx={{ mt: 2.5 }}>
                                <TextField
                                  fullWidth
                                  label="Name of the Event or Activity"
                                  variant="outlined"
                                  size="small"
                                  value={formData.details}
                                  disabled={saving}
                                  required={formData.isResponsible}
                                  onChange={(e) => handleDetailsChange(role.id, e.target.value)}
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
              {true && (
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
                        borderRadius: "12px",
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
                          background: "rgba(255, 255, 255, 0.05)"
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <Save />}
                    sx={{
                      borderRadius: "12px",
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
              )}
            </form>
          )}
        </Box>
      )}
    </Box>
  );
}
