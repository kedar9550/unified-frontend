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

export default function DataTable({ columns, rows, toolbarLeft, nonSortableColumns = [], alignments = [], defaultRowsPerPage = 10 }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
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
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      {/*  TOOLBAR: Filters on left, Search on right */}
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 1, flexWrap: "wrap" }}>
        {/* Left slot: Filters */}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap", flex: 1 }}>
          {toolbarLeft || null}
        </Box>

        {/* Right slot: Search */}
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
              background: "var(--bg-glass)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              "& fieldset": { border: "1px solid var(--border-color)" },
              "&:hover fieldset": { borderColor: "var(--color-primary)" },
              "&.Mui-focused fieldset": { borderColor: "var(--color-primary)", borderWidth: "1px" },
            },
            "& .MuiInputBase-input": { color: "var(--text-primary)", fontSize: "0.875rem" },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "var(--text-secondary)", fontSize: "1.2rem" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/*  TABLE */}
      <Box 
        sx={{ 
          overflowX: "auto", 
          borderRadius: "12px", 
          width: "100%",
          "&::-webkit-scrollbar": {
            height: "8px",
            display: "block !important",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.05)",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--color-primary, #2563eb)",
            opacity: 0.5,
            borderRadius: "10px",
            "&:hover": {
              background: "var(--color-primary-dark, #1d4ed8)",
            }
          },
          scrollbarWidth: "auto !important",
        }}
      >
        <Table
          sx={{
            minWidth: "100%",
            width: "auto",
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
                py: 2,
                px: 3,
                userSelect: "none",
                transition: "all 0.3s ease",
                cursor: "pointer",
                borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                "&:last-of-type": {
                  borderRight: "none",
                },
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.05)",
                },
              },
            }}
          >
            <TableRow
              sx={{
                background: "var(--gradient-primary)",
                borderRadius: "12px 12px 0 0",
              }}
            >
              {columns.map((col, index) => {
                const isSortable = !nonSortableColumns.includes(index);
                return (
                  <TableCell
                    key={index}
                    onClick={() => isSortable && handleSort(index)}
                    align={alignments[index] || "center"}
                    sx={{
                      textAlign: alignments[index] || "center",
                      cursor: isSortable ? "pointer" : "default",
                      "&:first-of-type": {
                        borderTopLeftRadius: "12px",
                        bgcolor: "rgba(0,0,0,0.1)", // Slightly darker first column header
                      },
                      "&:last-of-type": {
                        borderTopRightRadius: "12px",
                      },
                      "&:hover": {
                        background: isSortable ? "rgba(255, 255, 255, 0.05)" : "transparent",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: alignments[index] === "left" || alignments[index] === "start" ? "flex-start" : "center", gap: 0.5 }}>
                      {col}
                      {isSortable && (
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
                      )}
                    </Box>
                  </TableCell>
                );
              })}
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
                        ? "var(--bg-glass)"
                        : "var(--bg-panel)",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: "var(--bg-accent-1)",
                    },
                    "& td": { border: "none" },
                  }}
                >
                  {row.map((cell, j) => (
                    <TableCell
                      key={j}
                      align={alignments[j] || "center"}
                      sx={{
                        textAlign: alignments[j] || "center",
                        py: 2,
                        px: 3,
                        color: "var(--text-primary)",
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
                  sx={{ py: 6, color: "var(--text-secondary)", border: "none", background: "var(--bg-glass)" }}
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
          color: "var(--text-primary)",
          borderBottom: "none",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "0.875rem",
          },
          "& .MuiSelect-select": {
            fontSize: "0.875rem",
          },
          "& .MuiTablePagination-actions button": {
            background: "var(--bg-panel)",
            margin: "0 4px",
            color: "var(--text-primary)",
            backdropFilter: "blur(4px)",
            "&:hover": { background: "var(--bg-accent-1)" },
            "&.Mui-disabled": { opacity: 0.3, color: "var(--text-secondary)" }
          }
        }}
      />
    </Box>
  );
}
