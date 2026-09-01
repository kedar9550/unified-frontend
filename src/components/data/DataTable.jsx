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
  IconButton,
  Typography,
} from "@mui/material";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import GridViewIcon from "@mui/icons-material/GridView";

export default function DataTable({ columns, rows, toolbarLeft, nonSortableColumns = [], alignments = [], columnWidths = [], defaultRowsPerPage = 10 }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [search, setSearch] = useState("");
  const [sortIndex, setSortIndex] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // View Mode: "table" (list) or "grid" (card)
  const [viewMode, setViewMode] = useState("table");

  // Horizontal Scroll & Overflow States
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const tableContainerRef = useRef(null);
  const tableRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);

  const isMouseDownRef = useRef(false);
  const isDraggingTableRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

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

  // OVERFLOW & SCROLL POSITION METRICS CHECK
  const checkScrollMetrics = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

    setHasOverflow(hasHorizontalOverflow);
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    setScrollMetrics({ scrollLeft, scrollWidth, clientWidth });
  }, []);

  // RESIZE OBSERVER & SCROLL EVENT LISTENERS
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || viewMode !== "table") return;

    checkScrollMetrics();

    const handleScroll = () => {
      checkScrollMetrics();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScrollMetrics();
      });
      resizeObserver.observe(container);
      if (tableRef.current) {
        resizeObserver.observe(tableRef.current);
      }
    } else {
      window.addEventListener("resize", checkScrollMetrics);
    }

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", checkScrollMetrics);
      }
    };
  }, [checkScrollMetrics, paginatedRows, columns, viewMode]);

  // RE-CHECK METRICS ON DATA / PAGE / VIEW MODE CHANGES
  useEffect(() => {
    if (viewMode === "table") {
      checkScrollMetrics();
    }
  }, [paginatedRows, columns, rows, checkScrollMetrics, viewMode]);

  // BUTTON SCROLL HANDLERS (SMOOTH 300px STEP)
  const SCROLL_STEP = 300;

  const handleScrollLeft = () => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({
      left: -SCROLL_STEP,
      behavior: "smooth",
    });
  };

  const handleScrollRight = () => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({
      left: SCROLL_STEP,
      behavior: "smooth",
    });
  };

  // CLICKABLE SCROLLBAR TRACK JUMP
  const handleTrackClick = (e) => {
    if (!trackRef.current || !tableContainerRef.current) return;
    if (thumbRef.current && (e.target === thumbRef.current || thumbRef.current.contains(e.target))) {
      return;
    }
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const scrollableDistance = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
    const targetScroll = clickRatio * scrollableDistance;
    tableContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  // TRACK KEYBOARD ACCESSIBILITY
  const handleTrackKeyDown = (e) => {
    if (!tableContainerRef.current) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      tableContainerRef.current.scrollBy({ left: -100, behavior: "smooth" });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      tableContainerRef.current.scrollBy({ left: 100, behavior: "smooth" });
    }
  };

  // THUMB DRAG HANDLER (MOUSE & TOUCH)
  const handleThumbMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingThumb(true);

    const startX = e.clientX;
    const container = tableContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const initialScrollLeft = container.scrollLeft;
    const scrollableDistance = container.scrollWidth - container.clientWidth;
    const trackWidth = track.getBoundingClientRect().width;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaScroll = (deltaX / trackWidth) * container.scrollWidth;
      container.scrollLeft = Math.max(0, Math.min(scrollableDistance, initialScrollLeft + deltaScroll));
    };

    const handleMouseUp = () => {
      setIsDraggingThumb(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleThumbTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    setIsDraggingThumb(true);

    const startX = e.touches[0].clientX;
    const container = tableContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const initialScrollLeft = container.scrollLeft;
    const scrollableDistance = container.scrollWidth - container.clientWidth;
    const trackWidth = track.getBoundingClientRect().width;

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const deltaX = moveEvent.touches[0].clientX - startX;
      const deltaScroll = (deltaX / trackWidth) * container.scrollWidth;
      container.scrollLeft = Math.max(0, Math.min(scrollableDistance, initialScrollLeft + deltaScroll));
    };

    const handleTouchEnd = () => {
      setIsDraggingThumb(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
  };

  // TABLE CONTENT MOUSE DRAG-TO-SCROLL
  const handleTableMouseDown = (e) => {
    if (e.button !== 0) return;

    // Ignore interactive elements
    const target = e.target;
    if (
      target.closest(
        'button, a, input, select, textarea, [role="button"], .MuiIconButton-root, .MuiButton-root, .MuiSelect-select, .MuiCheckbox-root, .MuiRadio-root, [data-no-drag="true"]'
      )
    ) {
      return;
    }

    isMouseDownRef.current = true;
    isDraggingTableRef.current = false;
    dragStartXRef.current = e.clientX;
    if (tableContainerRef.current) {
      dragStartScrollLeftRef.current = tableContainerRef.current.scrollLeft;
    }

    const handleMouseMove = (moveEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = moveEvent.clientX - dragStartXRef.current;

      // Threshold check to avoid interfering with click or text selection
      if (!isDraggingTableRef.current && Math.abs(deltaX) > 5) {
        isDraggingTableRef.current = true;
        setIsDraggingTable(true);
        document.body.style.userSelect = "none";
        if (tableContainerRef.current) {
          tableContainerRef.current.style.cursor = "grabbing";
        }
      }

      if (isDraggingTableRef.current && tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
      }
    };

    const handleMouseUp = () => {
      if (isMouseDownRef.current) {
        if (isDraggingTableRef.current) {
          const captureClick = (clickEvent) => {
            clickEvent.stopPropagation();
            clickEvent.preventDefault();
            window.removeEventListener("click", captureClick, true);
          };
          window.addEventListener("click", captureClick, true);
          setTimeout(() => {
            window.removeEventListener("click", captureClick, true);
          }, 100);
        }

        isMouseDownRef.current = false;
        isDraggingTableRef.current = false;
        setIsDraggingTable(false);
        document.body.style.userSelect = "";
        if (tableContainerRef.current) {
          tableContainerRef.current.style.cursor = "";
        }
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // CALCULATE THUMB METRICS
  const scrollableDistance = scrollMetrics.scrollWidth - scrollMetrics.clientWidth;
  const ratio = scrollMetrics.scrollWidth > 0 ? scrollMetrics.clientWidth / scrollMetrics.scrollWidth : 1;
  const thumbWidthPercent = scrollMetrics.scrollWidth > 0 ? Math.max(12, Math.min(80, ratio * 100)) : 100;
  const thumbLeftPercent =
    scrollableDistance > 0
      ? Math.max(0, Math.min(100 - thumbWidthPercent, (scrollMetrics.scrollLeft / scrollableDistance) * (100 - thumbWidthPercent)))
      : 0;

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1, minWidth: 0, fontFamily: "'Stem', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/*  TOOLBAR: Filters on left, Search & View Toggles on right */}
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 1, flexWrap: "wrap" }}>
        {/* Left slot: Filters */}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap", flex: 1, width: { xs: "100%", sm: "auto" } }}>
          {toolbarLeft || null}
        </Box>

        {/* Right slot: Search & View Mode Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" }, justifyContent: "flex-end", flexWrap: "nowrap" }}>
          <TextField
            placeholder="Search"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: { xs: 1, sm: "initial" },
              width: { xs: "auto", sm: "260px" },
              minWidth: 0,
              height: "40px",
              flexShrink: { xs: 1, sm: 0 },
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "99px",
                background: "var(--bg-glass)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "& fieldset": { border: "1px solid var(--border-color)" },
                "&:hover fieldset": { borderColor: "var(--color-primary)" },
                "&.Mui-focused fieldset": { borderColor: "var(--color-primary)", borderWidth: "1px" },
              },
              "& .MuiInputBase-input": {
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontFamily: "'Stem', sans-serif",
                py: 0,
                height: "100%",
              },
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

          {/* View Mode Switcher Buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              height: "40px",
              background: "var(--bg-glass)",
              p: "3px",
              borderRadius: "99px",
              border: "1px solid var(--border-color)",
              backdropFilter: "blur(10px)",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Table / List View Button */}
            <IconButton
              aria-label="Table View"
              onClick={() => setViewMode("table")}
              size="small"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "99px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                background: viewMode === "table" ? "var(--gradient-primary)" : "transparent",
                color: viewMode === "table" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: viewMode === "table" ? "0 4px 14px rgba(190, 147, 55, 0.35)" : "none",
                "& .MuiSvgIcon-root": {
                  color: viewMode === "table" ? "#ffffff !important" : "inherit",
                },
                "&:hover": {
                  background: viewMode === "table" ? "var(--gradient-primary)" : "var(--bg-accent-1)",
                  color: viewMode === "table" ? "#ffffff" : "var(--text-primary)",
                },
              }}
            >
              <FormatListBulletedIcon sx={{ fontSize: "1.15rem", color: viewMode === "table" ? "#ffffff !important" : "inherit" }} />
            </IconButton>

            {/* Grid / Card View Button */}
            <IconButton
              aria-label="Grid View"
              onClick={() => setViewMode("grid")}
              size="small"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "99px",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                background: viewMode === "grid" ? "var(--gradient-primary)" : "transparent",
                color: viewMode === "grid" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: viewMode === "grid" ? "0 4px 14px rgba(190, 147, 55, 0.35)" : "none",
                "& .MuiSvgIcon-root": {
                  color: viewMode === "grid" ? "#ffffff !important" : "inherit",
                },
                "&:hover": {
                  background: viewMode === "grid" ? "var(--gradient-primary)" : "var(--bg-accent-1)",
                  color: viewMode === "grid" ? "#ffffff" : "var(--text-primary)",
                },
              }}
            >
              <GridViewIcon sx={{ fontSize: "1.15rem", color: viewMode === "grid" ? "#ffffff !important" : "inherit" }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/*  TABLE VIEW */}
      {viewMode === "table" && (
        <>
          <Box
            ref={tableContainerRef}
            onMouseDown={handleTableMouseDown}
            sx={{
              overflowX: "auto",
              borderRadius: "12px",
              width: "100%",
              touchAction: "pan-x pan-y",
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "var(--border-color)",
                borderRadius: "3px",
                "&:hover": {
                  background: "var(--color-primary)",
                },
              },
            }}
          >
            <Table
              ref={tableRef}
              sx={{
                minWidth: "100%",
                width: "auto",
                borderCollapse: "collapse",
                "& th, & td": { whiteSpace: "nowrap", fontFamily: "'Stem', sans-serif" },
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
                    fontFamily: "'Stem', sans-serif",
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
                          width: columnWidths[index] || "auto",
                          textAlign: alignments[index] || "center",
                          cursor: isSortable ? "pointer" : "default",
                          fontFamily: "'Stem', sans-serif",
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
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: alignments[index] === "left" || alignments[index] === "start" ? "flex-start" : "center", gap: 0.5, fontFamily: "'Stem', sans-serif" }}>
                          {col}
                          {isSortable && (
                            <Box
                              component="span"
                              sx={{
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                color: sortIndex === index ? "#ffffff" : "rgba(255,255,255,0.3)",
                                fontFamily: "'Stem', sans-serif",
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
                        "& td": { border: "none", fontFamily: "'Stem', sans-serif" },
                      }}
                    >
                      {row.map((cell, j) => (
                        <TableCell
                          key={j}
                          align={alignments[j] || "center"}
                          sx={{
                            width: columnWidths[j] || "auto",
                            textAlign: alignments[j] || "center",
                            py: 2,
                            px: 3,
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                            fontFamily: "'Stem', sans-serif",
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
                      sx={{ py: 6, color: "var(--text-secondary)", border: "none", background: "var(--bg-glass)", fontFamily: "'Stem', sans-serif" }}
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {/* HORIZONTAL SCROLL NAVIGATION BAR */}
          {hasOverflow && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                mt: 0.5,
                borderRadius: "12px",
                background: "var(--bg-glass)",
                backdropFilter: "blur(10px)",
                border: "1px solid var(--border-color)",
                width: "100%",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
              }}
            >
              {/* LEFT SCROLL BUTTON */}
              <IconButton
                aria-label="Scroll table left"
                disabled={!canScrollLeft}
                onClick={handleScrollLeft}
                size="small"
                sx={{
                  background: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  backdropFilter: "blur(4px)",
                  p: "4px",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "var(--bg-accent-1)",
                    borderColor: "var(--color-primary)",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.3,
                    color: "var(--text-secondary)",
                    borderColor: "transparent",
                    cursor: "not-allowed",
                  },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: "1.25rem" }} />
              </IconButton>

              {/* SCROLLBAR TRACK & THUMB */}
              <Box
                ref={trackRef}
                onClick={handleTrackClick}
                tabIndex={0}
                role="scrollbar"
                aria-orientation="horizontal"
                aria-label="Table horizontal scrollbar"
                aria-valuenow={Math.round(thumbLeftPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={handleTrackKeyDown}
                sx={{
                  flex: 1,
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                  outline: "none",
                  touchAction: "none",
                  "&:focus-visible > div": {
                    boxShadow: "0 0 0 2px var(--color-primary)",
                  },
                }}
              >
                {/* Track Groove */}
                <Box
                  sx={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "3px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid var(--border-color)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Thumb Handle */}
                  <Box
                    ref={thumbRef}
                    onMouseDown={handleThumbMouseDown}
                    onTouchStart={handleThumbTouchStart}
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: `${thumbWidthPercent}%`,
                      left: `${thumbLeftPercent}%`,
                      borderRadius: "3px",
                      background: isDraggingThumb
                        ? "var(--color-primary)"
                        : "var(--gradient-primary)",
                      boxShadow: "0 0 8px var(--color-primary-alpha)",
                      transition: isDraggingThumb ? "none" : "left 0.1s ease, width 0.1s ease",
                      cursor: "grab",
                      "&:active": {
                        cursor: "grabbing",
                      },
                      "&:hover": {
                        filter: "brightness(1.15)",
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* RIGHT SCROLL BUTTON */}
              <IconButton
                aria-label="Scroll table right"
                disabled={!canScrollRight}
                onClick={handleScrollRight}
                size="small"
                sx={{
                  background: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                  backdropFilter: "blur(4px)",
                  p: "4px",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "var(--bg-accent-1)",
                    borderColor: "var(--color-primary)",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.3,
                    color: "var(--text-secondary)",
                    borderColor: "transparent",
                    cursor: "not-allowed",
                  },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: "1.25rem" }} />
              </IconButton>
            </Box>
          )}
        </>
      )}

      {/* GRID / CARD VIEW */}
      {viewMode === "grid" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fill, minmax(320px, 1fr))",
            },
            gap: 2.5,
            width: "100%",
            fontFamily: "'Stem', sans-serif",
          }}
        >
          {paginatedRows.length > 0 ? (
            paginatedRows.map((row, rowIndex) => {
              // Separate remaining columns into top fields and bottom fields (below divider)
              const remainingCols = columns.slice(1);
              const isBottomCol = (colName) => {
                const lower = String(colName).toLowerCase();
                return (
                  lower.includes("academic year") ||
                  lower.includes("year") ||
                  lower.includes("status") ||
                  lower.includes("co-author") ||
                  lower.includes("co-inventor") ||
                  lower.includes("co-developer") ||
                  lower.includes("co-investigator") ||
                  lower.includes("created") ||
                  lower.includes("updated") ||
                  lower.includes("action")
                );
              };

              let bottomIndices = [];
              remainingCols.forEach((col, idx) => {
                if (isBottomCol(col)) {
                  bottomIndices.push(idx + 1);
                }
              });

              // Fallback if no matching metadata columns and enough columns exist
              if (bottomIndices.length === 0 && remainingCols.length > 4) {
                bottomIndices = [columns.length - 3, columns.length - 2, columns.length - 1];
              }

              const topCols = columns.map((col, idx) => ({ col, idx })).slice(1).filter((item) => !bottomIndices.includes(item.idx));
              const bottomCols = columns.map((col, idx) => ({ col, idx })).filter((item) => bottomIndices.includes(item.idx));

              return (
                <Box
                  key={rowIndex}
                  sx={{
                    background: "var(--bg-panel)",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                    backdropFilter: "blur(12px)",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                    fontFamily: "'Stem', sans-serif",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
                    "&:hover": {
                      borderColor: "var(--color-primary)",
                      boxShadow: "0 10px 28px rgba(0, 0, 0, 0.25)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {/* Top Header Title: S.No: X */}
                  <Typography
                    sx={{
                      fontWeight: 800,
                      background: "var(--gradient-primary)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontSize: "1.05rem",
                      letterSpacing: "0.02em",
                      fontFamily: "'Stem', sans-serif",
                      mb: 0.5,
                    }}
                  >
                    {columns[0] ? `${columns[0]}: ` : ""}
                    {row[0]?.display ?? row[0]?.value ?? row[0]}
                  </Typography>

                  {/* Top Key-Value Pair Fields */}
                  {topCols.map(({ col, idx }) => {
                    const cell = row[idx];
                    const cellValue = cell?.display ?? cell?.value ?? cell;
                    return (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1, fontSize: "0.875rem", fontFamily: "'Stem', sans-serif" }}>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            width: "125px",
                            flexShrink: 0,
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          {col}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            flexShrink: 0,
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          :
                        </Typography>
                        <Box
                          sx={{
                            fontWeight: 400,
                            color: "var(--text-primary)",
                            flex: 1,
                            wordBreak: "break-word",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          {cellValue}
                        </Box>
                      </Box>
                    );
                  })}

                  {/* Spacer to push HR line and bottom metadata fields to bottom of card */}
                  <Box sx={{ flexGrow: 1, minHeight: "8px" }} />

                  {/* Horizontal Divider Line */}
                  {bottomCols.length > 0 && (
                    <Box
                      sx={{
                        height: "1px",
                        background: "rgba(100, 116, 139, 0.35)",
                        my: 1.25,
                        width: "100%",
                      }}
                    />
                  )}

                  {/* Bottom Key-Value Pair Metadata Fields */}
                  {bottomCols.map(({ col, idx }) => {
                    const cell = row[idx];
                    const cellValue = cell?.display ?? cell?.value ?? cell;
                    return (
                      <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1, fontSize: "0.875rem", fontFamily: "'Stem', sans-serif" }}>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            width: "125px",
                            flexShrink: 0,
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          {col}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            flexShrink: 0,
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          :
                        </Typography>
                        <Box
                          sx={{
                            fontWeight: 400,
                            color: "var(--text-primary)",
                            flex: 1,
                            wordBreak: "break-word",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "'Stem', sans-serif",
                          }}
                        >
                          {cellValue}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                gridColumn: "1 / -1",
                py: 6,
                textAlign: "center",
                color: "var(--text-secondary)",
                background: "var(--bg-glass)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                fontFamily: "'Stem', sans-serif",
              }}
            >
              No data found
            </Box>
          )}
        </Box>
      )}

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
          overflowX: "auto",
          maxWidth: "100%",
          width: "100%",
          fontFamily: "'Stem', sans-serif",
          "& *": {
            fontFamily: "'Stem', sans-serif",
          },
          "& .MuiTablePagination-toolbar": {
            paddingLeft: { xs: 1, sm: 2 },
            paddingRight: { xs: 1, sm: 2 },
            flexWrap: { xs: "wrap", sm: "nowrap" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
            gap: { xs: 0.5, sm: 1 },
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: { xs: "0.725rem", sm: "0.875rem" },
            margin: 0,
            fontFamily: "'Stem', sans-serif",
          },
          "& .MuiSelect-select": {
            fontSize: { xs: "0.725rem", sm: "0.875rem" },
            paddingLeft: { xs: "4px", sm: "8px" },
            paddingRight: { xs: "20px !important", sm: "24px !important" },
            fontFamily: "'Stem', sans-serif",
          },
          "& .MuiTablePagination-actions": {
            marginLeft: { xs: "auto", sm: 2 },
          },
          "& .MuiTablePagination-actions button": {
            background: "var(--bg-panel)",
            margin: { xs: "0 2px", sm: "0 4px" },
            padding: { xs: "4px", sm: "8px" },
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


