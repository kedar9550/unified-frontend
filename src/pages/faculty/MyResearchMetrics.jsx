import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Avatar,
  Divider,
  Tabs,
  Tab
} from "@mui/material";
import {
  TrendingUp,
  Assessment,
  Person
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";
import axiosInstance from "../../api/axios";
import { toast } from "sonner";
import PageHeader from "../../components/common/PageHeader";
import { PageContainer } from "../../components/common/design-system";
import Loader from "../../components/common/Loader";

const MyResearchMetrics = () => {
  const [tab, setTab] = useState("citations");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", designation: "", scopusId: "" });
  const [citationsData, setCitationsData] = useState({ history: [], latestValue: null, latestYear: null });
  const [hindexData, setHindexData] = useState({ history: [], latestValue: null, latestYear: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [citRes, hidxRes] = await Promise.all([
        axiosInstance.get("/api/author-citations/me/citations"),
        axiosInstance.get("/api/author-citations/me/hindex")
      ]);

      if (citRes.data?.success) {
        setProfile({
          name: citRes.data.data.employeeName,
          designation: citRes.data.data.designation,
          scopusId: citRes.data.data.scopusId
        });
        setCitationsData({
          history: citRes.data.data.history || [],
          latestValue: citRes.data.data.latestValue,
          latestYear: citRes.data.data.latestYear
        });
      }

      if (hidxRes.data?.success) {
        setHindexData({
          history: hidxRes.data.data.history || [],
          latestValue: hidxRes.data.data.latestValue,
          latestYear: hidxRes.data.data.latestYear
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load research metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderMetricCard = (title, data, color, icon) => {
    const chartData = data.history.map(h => ({ year: String(h.year), value: h.value }));

    return (
      <Card sx={{ p: 3, borderRadius: "20px", background: "var(--bg-panel)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, borderRadius: "10px", background: `${color}15`, color: color, display: "flex" }}>
              {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>{title}</Typography>
          </Stack>
          <Box sx={{ textAlign: "right" }}>
            <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: color, lineHeight: 1 }}>
              {data.latestValue ?? "—"}
            </Typography>
            {data.latestYear && (
              <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                Latest ({data.latestYear})
              </Typography>
            )}
          </Box>
        </Stack>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Left: Graph */}
          <Box sx={{ flex: { xs: "none", md: 1 }, height: 300, minWidth: 0, width: "100%" }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="year" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "var(--bg-paper)" }}
                    itemStyle={{ color: color, fontWeight: 700 }}
                  />
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 5, fill: color, strokeWidth: 2, stroke: "var(--bg-paper)" }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-color)", borderRadius: "10px" }}>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>No history data available.</Typography>
              </Box>
            )}
          </Box>

          {/* Right: Details List */}
          <Box sx={{ flex: { xs: "none", md: 1 }, height: 300, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: "var(--text-secondary)" }}>Year-wise Breakdown</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", pr: 1, width: "100%" }}>
              <Stack spacing={1} sx={{ width: "100%" }}>
                {data.history.length > 0 ? (
                  [...data.history].sort((a, b) => b.year - a.year).map((row) => (
                    <Box key={row.year} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: "10px", bgcolor: "rgba(0,0,0,0.02)", border: "1px solid var(--border-color)", width: "100%" }}>
                      <Typography sx={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.year}</Typography>
                      <Typography sx={{ fontWeight: 800, color: color }}>{row.value}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: "var(--text-secondary)", textAlign: "center", py: 2 }}>No records found</Typography>
                )}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Research Metrics"
        subtitle="View your Citations and H-Index history over time"
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <Loader color="primary" size={40} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              aria-label="research metrics tabs"
              sx={{
                borderBottom: "1px solid var(--border-color)",
                "& .MuiTab-root": {
                  fontWeight: 700,
                  textTransform: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  px: 3,
                  py: 1.5,
                  transition: "all 0.2s ease",
                  "&:hover": { color: "var(--text-primary)" },
                  "&.Mui-selected": { color: "var(--color-primary) !important" }
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "var(--color-primary)",
                  height: "3px",
                  borderRadius: "3px"
                }
              }}
            >
              <Tab label="Citations" value="citations" />
              <Tab label="H-Index" value="hindex" />
            </Tabs>
          </Box>

          <Box>
            {tab === "citations" && renderMetricCard("Citations", citationsData, "#059669", <Assessment />)}
            {tab === "hindex" && renderMetricCard("H-Index", hindexData, "#4f46e5", <TrendingUp />)}
          </Box>
        </Box>
      )}
    </PageContainer>
  );
};

export default MyResearchMetrics;
