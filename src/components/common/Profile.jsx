import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Divider,
  Chip,
  Button,
  LinearProgress,
  Snackbar,
  Alert
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import {
  Person,
  Email,
  Phone,
  CalendarToday,
  LocationOn,
  Badge as BadgeIcon,
  Security,
  Edit,
  Lock,
  AccessTime,
  CreditCard,
  Business,
  Save,
  Science,
  School,
  Fingerprint,
  Public,
  AccountCircle,
  ContactMail,
  LocalPhone,
  AutoStories,
  VerifiedUser,
  Link as LinkIcon,
  AccountBalance
} from "@mui/icons-material";
import { MenuItem, Select, TextField } from "@mui/material";
import API from "../../api/axios";

// ─── Stable sub-components defined OUTSIDE Profile ───────────────────────────
// (Defining them inside Profile causes re-mount on every keystroke → focus loss)

const InfoCard = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <Box sx={{
      p: 1,
      borderRadius: "10px",
      background: "var(--bg-accent-1)",
      color: "var(--color-primary)",
      display: "flex",
      minWidth: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Icon sx={{ fontSize: 18 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
        {value || "N/A"}
      </Typography>
    </Box>
  </Box>
);

const EditableField = ({
  icon: Icon, label, fieldKey, value, children,
  isEditing, fieldValue, fieldError, onFieldChange, maxLength
}) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
    <Box sx={{
      p: 1,
      borderRadius: "10px",
      background: "var(--bg-accent-1)",
      color: "var(--color-primary)",
      display: "flex",
      minWidth: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }}>
      <Icon sx={{ fontSize: 18 }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500, mb: 0.5, textTransform: "uppercase" }}>
        {label}
      </Typography>
      {children || (
        isEditing
          ? <TextField
              size="small"
              fullWidth
              value={fieldValue ?? ""}
              onChange={onFieldChange}
              error={!!fieldError}
              helperText={fieldError || ""}
              inputProps={{ maxLength }}
              sx={{ background: "var(--bg-accent-1)", borderRadius: "8px" }}
            />
          : <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{value || "N/A"}</Typography>
      )}
    </Box>
  </Box>
);
// ──────────────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, activeRole } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [profileData, setProfileData] = React.useState(null);
  const [form, setForm] = React.useState({
    email: "",
    phone: "",
    scopusId: "",
    wosId: "",
    orcidId: "",
    googleScholarId: "",
    panNumber: "",
    college: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [snack, setSnack] = React.useState({ open: false, msg: "", severity: "success" });

  // Validation rules for each field (pattern + maxLength)
  const validationRules = {
    orcidId:        { pattern: /^\d{4}-\d{4}-\d{4}-\d{4}$/,   maxLength: 19, msg: "Format: 0000-0002-1825-0097 (19 chars)" },
    scopusId:       { pattern: /^\d{8,11}$/,                  maxLength: 11, msg: "8 to 11 digits only" },
    wosId:          { pattern: /^[A-Za-z0-9-]{8,15}$/,        maxLength: 15, msg: "Alphanumeric + hyphens, 8–15 chars (e.g. A-1234-2019)" },
    googleScholarId:{ pattern: /^[A-Za-z0-9]{10,12}$/,        maxLength: 12, msg: "Alphanumeric only, 10–12 chars" },
    panNumber:      { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, maxLength: 10, msg: "Format: ABCDE1234F (10 chars, uppercase)" },
  };

  const validateField = (fieldKey, value) => {
    if (!value) return ""; // empty is allowed (optional fields)
    const rule = validationRules[fieldKey];
    if (rule && !rule.pattern.test(value)) return rule.msg;
    return "";
  };

  // Fetch fresh data from backend on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/api/employees/me");
        const fresh = res.data.user;
        setProfileData(fresh);
        setForm({
          email: fresh.email || "",
          phone: fresh.phone || "",
          scopusId: fresh.scopusId || "",
          wosId: fresh.wosId || "",
          orcidId: fresh.orcidId || "",
          googleScholarId: fresh.googleScholarId || "",
          panNumber: fresh.panNumber || "",
          college: fresh.college || ""
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        // Fallback to localStorage user
        setProfileData(user);
        setForm({
          email: profile?.email || "",
          phone: profile?.phone || "",
          scopusId: profile?.scopusId || "",
          wosId: profile?.wosId || "",
          orcidId: profile?.orcidId || "",
          googleScholarId: profile?.googleScholarId || "",
          panNumber: profile?.panNumber || "",
          college: profile?.college || ""
        });
      }
    };
    fetchProfile();
  }, []);

  // Use fresh DB data where available, fall back to localStorage
  const profile = profileData || user;

  const handleSave = async () => {
    setLoading(true);
    // Validate all fields before saving
    const newErrors = {};
    Object.keys(validationRules).forEach(key => {
      const msg = validateField(key, form[key]);
      if (msg) newErrors[key] = msg;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnack({ open: true, msg: "Please fix validation errors before saving", severity: "error" });
      setLoading(false);
      return;
    }
    try {
      await API.put("/api/employees/me/update", form);
      // Re-fetch latest data from backend
      const res = await API.get("/api/employees/me");
      setProfileData(res.data.user);
      setSnack({ open: true, msg: "Profile updated successfully!", severity: "success" });
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed", err);
      setSnack({ open: true, msg: "Failed to update profile", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: validateField(field, value) });
  };

  // Auto-format ORCID: insert hyphens after every 4 digits (0000-0002-1825-0097)
  const handleOrcidChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join('-') ?? '';
    setForm(prev => ({ ...prev, orcidId: formatted }));
    setErrors(prev => ({ ...prev, orcidId: validateField('orcidId', formatted) }));
  };

  const getEcapImage = () => {
    if (!user || user.profileImage) return null;
    if (user.userType === "Employee") {
      return `https://info.aec.edu.in/aus/employeephotos/${user.institutionId}.jpg`;
    } else if (user.userType === "Student") {
      return `https://info.aec.edu.in/adityacentral/StudentPhotos/${user.institutionId}.jpg`;
    }
    return null;
  };

  const imageSrc = profile?.profileImage || getEcapImage();
  const initials = profile?.name ? user.name.charAt(0).toUpperCase() : "U";


  return (
    <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: "1500px", margin: "0 auto", width: "100%" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: "var(--text-primary)" }}>
        Account Profile
      </Typography>

      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
        alignItems: "flex-start",
        width: "100%"
      }}>
        {/* LEFT COLUMN: Profile Card */}
        <Box sx={{
          width: { xs: "100%", md: "320px", lg: "350px" },
          flexShrink: 0
        }}>
          <Paper sx={{
            p: 4,
            borderRadius: "24px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)",
            textAlign: "center"
          }}>
            <Box sx={{ position: "relative", display: "inline-block", mb: 3 }}>
              <Avatar
                src={imageSrc}
                sx={{
                  width: 130,
                  height: 130,
                  border: "6px solid var(--bg-accent-1)",
                  fontSize: "3rem",
                  fontWeight: 800,
                  background: "var(--gradient-primary)"
                }}
              >
                {initials}
              </Avatar>
              <Chip
                label="Active"
                size="small"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: -10,
                  bgcolor: "#dcfce7",
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: "0.7rem"
                }}
              />
            </Box>

            <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", mb: 0.5 }}>
              {profile?.name}
            </Typography>

            <Chip
              label={profile?.designation || activeRole}
              size="small"
              sx={{
                bgcolor: "var(--bg-accent-1)",
                color: "var(--color-primary)",
                fontWeight: 700,
                px: 1,
                mb: 1
              }}
            />

            <Typography sx={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500, mb: 3 }}>
              {profile?.department || "N/A"}
            </Typography>

            {/* <Box sx={{ textAlign: "left", mb: 4, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Person sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
                <Typography sx={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Employee ID: {profile?.institutionId} */}
            {/* </Typography>
              </Box>
            </Box> */}

            {/* <Button
              fullWidth
              variant="outlined"
              startIcon={<Edit />}
              sx={{
                borderRadius: "12px",
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                "&:hover": { bgcolor: "var(--bg-accent-1)", borderColor: "var(--color-primary)" }
              }}
            >
              Edit Profile
            </Button> */}
          </Paper>
        </Box>

        {/* RIGHT COLUMN: Details */}
        <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          {/* Personal Information */}
          <Paper sx={{
            p: 3,
            borderRadius: "24px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)"
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Person sx={{ color: "var(--color-primary)" }} />
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Personal Information
                </Typography>
              </Box>
              <Button
                startIcon={isEditing ? <Save /> : <Edit />}
                variant="outlined"
                size="small"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={loading}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "var(--border-color)",
                  color: "var(--color-primary)",
                  "&:hover": { borderColor: "var(--color-primary)", background: "rgba(2, 132, 199, 0.05)" }
                }}
              >
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Edit Info"}
              </Button>
            </Box>

            {/* All fields in a single responsive 3-column grid */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 3
            }}>
              {/* Read-only */}
              <InfoCard icon={BadgeIcon} label="Institution ID" value={profile?.institutionId} />
              <InfoCard icon={Person} label="Full Name" value={profile?.name} />
              <EditableField
                icon={ContactMail} label="Email Address" fieldKey="email" value={profile?.email}
                isEditing={isEditing} fieldValue={form.email} fieldError={errors.email}
                onFieldChange={handleChange("email")}
              />

              <EditableField
                icon={LocalPhone} label="Phone Number" fieldKey="phone" value={profile?.phone}
                isEditing={isEditing} fieldValue={form.phone} fieldError={errors.phone}
                onFieldChange={handleChange("phone")}
              />
              <EditableField icon={AccountBalance} label="College Name" fieldKey="college" value={profile?.college} isEditing={isEditing}>
                {isEditing ? (
                  <Select
                    size="small"
                    fullWidth
                    value={form.college}
                    onChange={handleChange("college")}
                    sx={{ borderRadius: "8px", height: "35px", fontSize: "0.85rem", background: "var(--bg-accent-1)" }}
                  >
                    <MenuItem value="">Select College</MenuItem>
                    <MenuItem value="Aditya University">Aditya University</MenuItem>
                    <MenuItem value="Aditya college of engineering and technology">Aditya college of engineering and technology</MenuItem>
                    <MenuItem value="Aditya College of Pharmacy">Aditya College of Pharmacy</MenuItem>
                  </Select>
                ) : (
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{profile?.college || "N/A"}</Typography>
                )}
              </EditableField>
              <EditableField
                icon={CreditCard} label="PAN Number" fieldKey="panNumber" value={profile?.panNumber}
                isEditing={isEditing} fieldValue={form.panNumber} fieldError={errors.panNumber}
                onFieldChange={handleChange("panNumber")} maxLength={validationRules.panNumber.maxLength}
              />

              <EditableField
                icon={Science} label="Scopus ID" fieldKey="scopusId" value={profile?.scopusId}
                isEditing={isEditing} fieldValue={form.scopusId} fieldError={errors.scopusId}
                onFieldChange={handleChange("scopusId")} maxLength={validationRules.scopusId.maxLength}
              />
              <EditableField
                icon={Public} label="Web of Science ID" fieldKey="wosId" value={profile?.wosId}
                isEditing={isEditing} fieldValue={form.wosId} fieldError={errors.wosId}
                onFieldChange={handleChange("wosId")} maxLength={validationRules.wosId.maxLength}
              />
              <EditableField
                icon={Fingerprint} label="ORC ID" fieldKey="orcidId" value={profile?.orcidId}
                isEditing={isEditing} fieldValue={form.orcidId} fieldError={errors.orcidId}
                onFieldChange={handleOrcidChange} maxLength={validationRules.orcidId.maxLength}
              />

              <EditableField
                icon={School} label="Google Scholar ID" fieldKey="googleScholarId" value={profile?.googleScholarId}
                isEditing={isEditing} fieldValue={form.googleScholarId} fieldError={errors.googleScholarId}
                onFieldChange={handleChange("googleScholarId")} maxLength={validationRules.googleScholarId.maxLength}
              />
            </Box>
          </Paper>

          {/* Account & Security */}
          <Paper sx={{
            p: 3,
            borderRadius: "24px",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Security sx={{ color: "var(--color-primary)" }} />
              <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Account & Security
              </Typography>
            </Box>

            <Box sx={{
              p: 2,
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              gap: 2
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{
                  p: 1.2,
                  borderRadius: "12px",
                  background: "var(--bg-accent-1)",
                  color: "var(--color-primary)",
                  display: "flex"
                }}>
                  <Lock />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Change Password
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Update your account password
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  px: 3,
                  py: 0.8,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                  "&:hover": { bgcolor: "var(--bg-accent-1)", borderColor: "var(--color-primary)" }
                }}
              >
                Change
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
