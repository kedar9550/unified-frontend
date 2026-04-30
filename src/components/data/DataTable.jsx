import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Box,
} from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import { InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function DataTable({ columns, rows, toolbarLeft }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortIndex, setSortIndex] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  //  FILTER
  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      row.some((cell) =>
        String(cell?.value ?? cell)
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  }, [rows, search]);

  // SORT
  const sortedRows = useMemo(() => {
    if (sortIndex === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valA = a[sortIndex]?.value ?? a[sortIndex];
      const valB = b[sortIndex]?.value ?? b[sortIndex];

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortIndex, sortDirection]);

  // PAGINATION
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  // RESET PAGE ON SEARCH
  useEffect(() => {
    setPage(0);
  }, [search]);

  // SORT HANDLER
  const handleSort = (index) => {
    if (sortIndex === index) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortIndex(index);
      setSortDirection("asc");
    }
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
      {/*  TOOLBAR: filters left, search right */}
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 1, flexWrap: "wrap" }}>
        {/* Left slot: any filter content passed from parent */}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap", flex: 1 }}>
          {toolbarLeft || null}
        </Box>

        {/* Right: search */}
        <TextField
          placeholder="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: "100%", sm: "260px" },
            flexShrink: 0,
            "& .MuiOutlinedInput-root": {
              borderRadius: "99px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "& fieldset": { border: "1px solid rgba(255, 255, 255, 0.5)" },
              "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.9)" },
              "&.Mui-focused fieldset": { borderColor: "#8da5d8", borderWidth: "1px" },
            },
            "& .MuiInputBase-input": { color: "#334155", fontSize: "0.875rem" },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748b", fontSize: "1.2rem" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/*  TABLE */}
      <Box sx={{ overflowX: "auto", borderRadius: "12px" }}>
        <Table
          sx={{
            minWidth: 600,
            borderCollapse: "collapse",
            "& th, & td": { whiteSpace: "nowrap" }
          }}
        >
          {/* HEADER */}
          <TableHead
            sx={{
              "& th": {
                borderBottom: "none",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                py: 1.8,
                px: 3,
                userSelect: "none",
                transition: "all 0.3s ease",
                background: "transparent", // Make individual cells transparent
                cursor: "pointer",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.15)", // Brighter highlight on hover
                },
              },
            }}
          >
            <TableRow
              sx={{
                background: "linear-gradient(90deg, #004e92, #000428)", // Premium dark blue gradient
                borderRadius: "12px 12px 0 0",
              }}
            >
              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  onClick={() => handleSort(index)}
                  sx={{
                    "&:first-of-type": {
                      borderTopLeftRadius: "12px",
                    },
                    "&:last-of-type": {
                      borderTopRightRadius: "12px",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {col}
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        color: sortIndex === index ? "#ffffff" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {sortIndex === index
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, i) => (
                <TableRow
                  key={i}
                  sx={{
                    background:
                      i % 2 === 0
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.8)",
                    },
                    "& td": { border: "none" },
                  }}
                >
                  {row.map((cell, j) => (
                    <TableCell
                      key={j}
                      sx={{
                        py: 2,
                        px: 3,
                        color: "#334155",
                        fontSize: "0.875rem",
                      }}
                    >
                      {cell?.display ?? cell?.value ?? cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 6, color: "#64748b", border: "none", background: "rgba(255, 255, 255, 0.4)" }}
                >
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* PAGINATION */}
      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50, 100, 250]}
        sx={{
          color: "#475569",
          borderBottom: "none",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "0.875rem",
          },
          "& .MuiSelect-select": {
            fontSize: "0.875rem",
          },
          "& .MuiTablePagination-actions button": {
            background: "rgba(255, 255, 255, 0.4)",
            margin: "0 4px",
            backdropFilter: "blur(4px)",
            "&:hover": { background: "rgba(255, 255, 255, 0.8)" }
          }
        }}
      />
    </Box>
  );
}
