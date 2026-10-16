import React, { useMemo } from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  CalendarToday
} from "@mui/icons-material";

/**
 * Robust helper to check if a publication belongs to a target academic year.
 * Handles populated objects ({ _id, year }), string IDs, year strings,
 * and multi-stage models (Patent published/granted, PhD pursuing/awarded).
 */
export const matchesAcademicYear = (pub, filterYear, academicYears = []) => {
  if (!filterYear || filterYear === "ALL" || filterYear === "all") {
    return true;
  }
  if (!pub) return false;

  const targetYearDoc = academicYears.find(
    (ay) => String(ay._id) === String(filterYear) || ay.year === filterYear
  );
  const targetId = targetYearDoc ? String(targetYearDoc._id) : String(filterYear);
  const targetYearStr = targetYearDoc ? targetYearDoc.year : String(filterYear);

  const checkField = (val) => {
    if (!val) return false;
    if (typeof val === "object") {
      if (val._id && String(val._id) === targetId) return true;
      if (val.year && (val.year === targetYearStr || String(val.year) === targetId)) return true;
    }
    const str = String(val);
    return str === targetId || str === targetYearStr;
  };

  // 1. Direct root academicYear
  if (checkField(pub.academicYear)) return true;

  // 2. Patent stages
  if (pub.published && checkField(pub.published.academicYear)) return true;
  if (pub.granted && checkField(pub.granted.academicYear)) return true;

  // 3. PhD Scholar stages
  if (pub.pursuingDetails && checkField(pub.pursuingDetails.academicYear)) return true;
  if (pub.awardedDetails && checkField(pub.awardedDetails.academicYear)) return true;

  return false;
};

export default function AcademicYearFilter({
  academicYears = [],
  selectedYear = "ALL",
  onChange,
  publications = null,
  sx = {}
}) {
  // Deduplicate and sort academic years descending (e.g. 2025-2026, 2024-2025, ...)
  const sortedYears = useMemo(() => {
    const map = new Map();
    academicYears.forEach((ay) => {
      if (ay && ay.year && !map.has(ay.year)) {
        map.set(ay.year, ay);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const aStart = parseInt(a.year?.split("-")[0] || "0", 10);
      const bStart = parseInt(b.year?.split("-")[0] || "0", 10);
      return bStart - aStart;
    });
  }, [academicYears]);

  // Pre-calculate publication counts per academic year
  const countsByYear = useMemo(() => {
    if (!Array.isArray(publications)) return null;
    const counts = { ALL: publications.length };
    sortedYears.forEach((ay) => {
      const yearKey = String(ay._id || ay.year);
      const c = publications.filter((p) =>
        matchesAcademicYear(p, ay._id || ay.year, academicYears)
      ).length;
      counts[yearKey] = c;
      if (ay.year) counts[String(ay.year)] = c;
      if (ay._id) counts[String(ay._id)] = c;
    });
    return counts;
  }, [publications, sortedYears, academicYears]);

  const selectedYearDoc = sortedYears.find(
    (y) => String(y._id) === String(selectedYear) || y.year === selectedYear
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ...sx }}>
      <FormControl size="small" sx={{ minWidth: { xs: 160, sm: 200 } }}>
        <Select
          id="academic-year-filter"
          value={selectedYear || "ALL"}
          onChange={(e) => onChange && onChange(e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            if (!selected || selected === "ALL") {
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarMonth sx={{ fontSize: 18, color: "var(--color-primary, #2563eb)" }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    All Academic Years
                  </Typography>
                  {countsByYear && (
                    <Chip
                      label={countsByYear.ALL}
                      size="small"
                      sx={{
                        height: 18,
                        minWidth: 20,
                        px: 0.5,
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        bgcolor: "var(--bg-accent-1, rgba(0,0,0,0.06))",
                        color: "var(--text-secondary)"
                      }}
                    />
                  )}
                </Box>
              );
            }
            const label = selectedYearDoc ? selectedYearDoc.year : selected;
            const isActive = selectedYearDoc?.active;
            const count = countsByYear ? countsByYear[String(selected)] ?? 0 : null;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <CalendarToday sx={{ fontSize: 16, color: "var(--color-primary, #2563eb)" }} />
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {label}
                </Typography>
                {isActive && (
                  <Chip
                    label="Current"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      bgcolor: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)"
                    }}
                  />
                )}
                {count !== null && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 18,
                      minWidth: 20,
                      px: 0.5,
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      bgcolor: "var(--bg-accent-1, rgba(0,0,0,0.06))",
                      color: "var(--text-secondary)"
                    }}
                  />
                )}
              </Box>
            );
          }}
          sx={{
            height: 38,
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            background: "var(--bg-panel, #ffffff)",
            color: "var(--text-primary, #1e293b)",
            border: "1px solid var(--border-color, #e2e8f0)",
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&:hover": {
              borderColor: "var(--color-primary, #2563eb)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            },
            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              py: 0.6,
              pr: 3.5
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: "12px",
                mt: 0.5,
                background: "var(--bg-panel, #ffffff)",
                border: "1px solid var(--border-color, #e2e8f0)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                maxHeight: 320
              }
            }
          }}
        >
          <MenuItem
            value="ALL"
            sx={{
              fontSize: "0.85rem",
              fontWeight: 700,
              py: 1.2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 18, color: "var(--color-primary, #2563eb)" }} />
              <span>All Academic Years</span>
            </Box>
            {countsByYear && (
              <Chip
                label={countsByYear.ALL}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  bgcolor: "var(--bg-accent-1, rgba(0,0,0,0.06))",
                  color: "var(--text-secondary)"
                }}
              />
            )}
          </MenuItem>
          {sortedYears.map((ay) => {
            const yearVal = ay._id || ay.year;
            const count = countsByYear ? countsByYear[String(yearVal)] : null;
            return (
              <MenuItem
                key={ay._id || ay.year}
                value={yearVal}
                sx={{
                  fontSize: "0.85rem",
                  py: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, color: "var(--text-secondary)" }} />
                  <span style={{ fontWeight: 600 }}>{ay.year}</span>
                  {ay.active && (
                    <Chip
                      label="Current"
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        bgcolor: "rgba(16, 185, 129, 0.12)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)"
                      }}
                    />
                  )}
                </Box>
                {count !== null && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      bgcolor: count > 0 ? "rgba(37, 99, 235, 0.1)" : "var(--bg-accent-1, rgba(0,0,0,0.04))",
                      color: count > 0 ? "var(--color-primary, #2563eb)" : "var(--text-secondary)"
                    }}
                  />
                )}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
