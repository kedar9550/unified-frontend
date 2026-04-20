import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import { useState } from "react";

export default function PerformanceTable({ title }) {
  const [rows, setRows] = useState([
    {
      course: "Data Structures",
      section: "3-CSE-A",
      appeared: 65,
      passed: 62,
    },
    {
      course: "Operating Systems",
      section: "5-CSE-B",
      appeared: 58,
      passed: 54,
    },
    {
      course: "Computer Networks",
      section: "5-CSE-A",
      appeared: 60,
      passed: 55,
    },
    {
      course: "DBMS",
      section: "3-CSE-C",
      appeared: 70,
      passed: 68,
    },
  ]);

  const getPercentage = (a, b) => {
    if (!a) return 0;
    return ((b / a) * 100).toFixed(1);
  };

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = Number(value);
    setRows(updated);
  };

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      {/* TITLE */}
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ mb: 2, color: "#0D233B" }}
      >
        {title}
      </Typography>

      <Paper
        sx={{
          borderRadius: "18px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        <Table sx={{ minWidth: 900 }}>
          {/* HEADER */}
          <TableHead
            sx={{
              background: "linear-gradient(135deg, #0b5299, #1c6ed5)",
            }}
          >
            <TableRow>
              {[
                "S.NO",
                "COURSE NAME",
                "SEM-BRANCH-SEC",
                "NO. OF STUDENTS APPEARED (A)",
                "NO. OF STUDENTS PASSED (B)",
                "PASS PERCENTAGE (B/A*100)",
              ].map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {rows.map((row, i) => {
              const percent = getPercentage(row.appeared, row.passed);

              return (
                <TableRow
                  key={i}
                  sx={{
                    background: i % 2 === 0 ? "#f8fbff" : "#ffffff",
                    height: 70,
                  }}
                >
                  <TableCell>{i + 1}</TableCell>

                  <TableCell>
                    <Typography fontWeight={500}>{row.course}</Typography>
                  </TableCell>

                  <TableCell>{row.section}</TableCell>

                  {/* APPEARED */}
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.appeared}
                      onChange={(e) =>
                        handleChange(i, "appeared", e.target.value)
                      }
                      sx={{
                        width: 80,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px",
                          background: "#eef3f9",
                        },
                      }}
                    />
                  </TableCell>

                  {/* PASSED */}
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.passed}
                      onChange={(e) =>
                        handleChange(i, "passed", e.target.value)
                      }
                      sx={{
                        width: 80,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px",
                          background: "#eef3f9",
                        },
                      }}
                    />
                  </TableCell>

                  {/* % BADGE */}
                  <TableCell>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: "20px",
                        background: "#e3edf9",
                        color: "#0b5299",
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      {percent}%
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* FOOTER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 2,
            borderTop: "1px solid #e0e6ef",
          }}
        >
          <Button
            variant="contained"
            sx={{
              borderRadius: "30px",
              px: 4,
              background: "linear-gradient(135deg, #0b5299, #1c6ed5)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            ✓ Save Section
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
