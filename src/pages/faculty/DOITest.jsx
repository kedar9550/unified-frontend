import { useState } from "react";

const ELSEVIER_API_KEY = "0436d4fe788649172354545ceca9e650";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let month = "", year = "";
  const yMatch = str.match(/\b(19|20)\d{2}\b/);
  if (yMatch) year = yMatch[0];
  for (let i = 0; i < 12; i++) {
    if (str.toLowerCase().includes(months[i].toLowerCase()) ||
      str.toLowerCase().includes(short[i].toLowerCase())) {
      month = months[i]; break;
    }
  }
  // ISO fallback: 2024-03-01
  if (!month) {
    const iso = str.match(/\d{4}-(\d{2})/);
    if (iso) month = months[parseInt(iso[1], 10) - 1] || "";
  }
  return [month, year].filter(Boolean).join(" ") || str;
}

function cleanISSN(raw) {
  if (!raw) return "";
  return raw.split(" ")[0].replace(/-/g, "");
}

function formatISSNWithHyphen(raw) {
  if (!raw) return "";
  const digits = raw.split(" ")[0].replace(/-/g, "");
  if (digits.length === 8) return digits.slice(0, 4) + "-" + digits.slice(4);
  return raw.split(" ")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepRow({ step, idx }) {
  const colors = { loading: "#f59e0b", success: "#10b981", error: "#ef4444", skip: "#64748b" };
  const icons = { success: "✓", error: "✗", skip: "–" };
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0",
      animation: "fadeIn 0.3s ease", borderBottom: "1px solid var(--border-color)"
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 11, flexShrink: 0, fontWeight: 700,
        background: step.status === "loading" ? "rgba(245, 158, 11, 0.1)"
          : step.status === "success" ? "rgba(16, 185, 129, 0.1)"
            : step.status === "skip" ? "rgba(100, 116, 139, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
        color: colors[step.status] || "#94a3b8",
        border: `1px solid ${colors[step.status] || "#334155"}`,
      }}>
        {step.status === "loading"
          ? <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            border: "2px solid #f59e0b", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite"
          }} />
          : (icons[step.status] || idx + 1)}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: colors[step.status] || "#cbd5e1", fontWeight: 600 }}>
          {step.label}
        </div>
        {step.note && (
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {step.note}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ field, value }) {
  const [copied, setCopied] = useState(false);

  const isNotFetched = !value || value === "Not fetched" || value === "—";
  const isUnavailable = value === "Not Available";

  // Dynamic premium styles based on state
  let cardBg = "rgba(15, 23, 42, 0.6)";
  let borderStyle = "1px solid rgba(59, 130, 246, 0.15)";
  let textColor = "#f8fafc";
  let textWeight = 600;
  let textStyle = "normal";

  if (isNotFetched) {
    cardBg = "rgba(15, 23, 42, 0.25)";
    borderStyle = "1px dashed var(--border-color)";
    textColor = "#475569";
    textWeight = 400;
  } else if (isUnavailable) {
    cardBg = "rgba(15, 23, 42, 0.4)";
    borderStyle = "1px solid rgba(239, 68, 68, 0.15)";
    textColor = "#64748b";
    textWeight = 500;
    textStyle = "italic";
  }

  return (
    <div style={{
      background: cardBg,
      border: borderStyle,
      borderRadius: 12, padding: "16px 20px", transition: "all 0.3s ease",
      position: "relative", overflow: "hidden",
      backdropFilter: "blur(8px)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)"
    }}>
      {!isNotFetched && !isUnavailable && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 4,
          height: "100%", background: "linear-gradient(180deg, #3b82f6, #1d4ed8)", borderRadius: "12px 0 0 12px"
        }} />
      )}
      {isUnavailable && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 4,
          height: "100%", background: "rgba(239, 68, 68, 0.4)", borderRadius: "12px 0 0 12px"
        }} />
      )}
      <div style={{
        fontSize: 10, color: "#94a3b8", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        {field}
      </div>
      <div style={{
        fontSize: 15, fontWeight: textWeight, color: textColor, fontStyle: textStyle,
        display: "flex", alignItems: "center", gap: 8, wordBreak: "break-word",
        lineHeight: 1.5
      }}>
        {isNotFetched ? "Not fetched" : value}
        {!isNotFetched && !isUnavailable && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "2px",
              color: copied ? "#10b981" : "#475569", fontSize: 13, flexShrink: 0,
              display: "flex", alignItems: "center", transition: "color 0.2s"
            }}
            title="Copy Value"
          >
            {copied ? "✓" : "⧉"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DOIFetcher() {
  const [doi, setDoi] = useState("");
  const [data, setData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // step helpers
  const pushStep = (label, status = "loading", note = "") =>
    setSteps(p => [...p, { label, status, note, id: Date.now() + Math.random() }]);

  const doneStep = (status, note = "") =>
    setSteps(p => {
      const a = [...p];
      if (a.length > 0) {
        a[a.length - 1] = { ...a[a.length - 1], status, note };
      }
      return a;
    });

  // ── Main fetch ──────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
    if (!cleanDoi) return;
    setBusy(true);
    setData(null);
    setSteps([]);
    setErrorMessage("");

    const R = {
      doi: cleanDoi,
      title: "Not Available",
      journalName: "Not Available",
      journalType: "Not Available",
      quartile: "Not Available",
      volume: "Not Available",
      issue: "Not Available",
      date: "Not Available",
      hIndex: "Not Available",
      jcrImpactFactor: "Not Available"
    };

    const ELS = { "X-ELS-APIKey": ELSEVIER_API_KEY, Accept: "application/json" };

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1 — Scopus Abstract API
    // ══════════════════════════════════════════════════════════════════════════
    pushStep("Step 1: Fetching Article details from Scopus Abstract API...");
    let extractedIssn = null;
    let extractedEissn = null;
    try {
      const res = await fetch(
        `https://api.elsevier.com/content/search/scopus?query=DOI(${encodeURIComponent(cleanDoi)})`,
        { headers: ELS }
      );
      if (res.ok) {
        const json = await res.json();
        const entry = json?.["search-results"]?.entry?.[0];

        if (!entry || entry.error || (!entry["dc:title"] && !entry["prism:publicationName"])) {
          doneStep("error", "DOI not found in Scopus search.");
          setErrorMessage(entry?.error ? `Scopus returned an error: ${entry.error}` : "This DOI was not found or lacks critical metadata in the Scopus registry. Please double-check it.");
          setBusy(false);
          setData(R);
          return;
        }

        R.title = entry["dc:title"] || "Not Available";
        R.journalName = entry["prism:publicationName"] || "Not Available";
        R.volume = entry["prism:volume"] || "Not Available";
        R.issue = entry["prism:issueIdentifier"] || "Not Available";
        R.date = parseDate(entry["prism:coverDisplayDate"] || entry["prism:coverDate"]) || "Not Available";

        const rawIssn = entry["prism:issn"] || "";
        const rawEissn = entry["prism:eIssn"] || "";
        if (rawIssn) extractedIssn = cleanISSN(rawIssn);
        if (rawEissn) extractedEissn = cleanISSN(rawEissn);

        doneStep("success", "Metadata loaded successfully.");
      } else {
        if (res.status === 429) {
          doneStep("error", `Elsevier/Scopus API rate limit exceeded: HTTP 429`);
          setErrorMessage("Elsevier/Scopus API rate limit exceeded (HTTP 429). Please try again later or check your API key quota.");
        } else if (res.status === 401) {
          doneStep("error", `Unauthorized: HTTP 401`);
          setErrorMessage("Invalid or unauthorized Elsevier API key. Please check your API key configuration.");
        } else {
          doneStep("error", `Scopus Search API error: HTTP ${res.status}`);
          setErrorMessage("Failed to fetch DOI details from Scopus. Please double-check the DOI.");
        }
        setBusy(false);
        setData(R);
        return;
      }
    } catch (e) {
      doneStep("error", `Scopus Abstract error: ${e.message}`);
      setErrorMessage("Network error connecting to Scopus. Please verify connection.");
      setBusy(false);
      setData(R);
      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2 — Scopus Serial API (ISSN / EISSN -> Journal Metrics)
    // ══════════════════════════════════════════════════════════════════════════
    const activeIssn = extractedIssn || extractedEissn;
    if (activeIssn) {
      pushStep(`Step 2: Fetching CiteScore, H-Index & Quartile from Scopus Serial API...`);
      try {
        let serialDataFetched = false;
        let entry = {};

        // Try with print ISSN first
        if (extractedIssn) {
          const res = await fetch(
            `https://api.elsevier.com/content/serial/title/issn/${extractedIssn}?view=CITESCORE`,
            { headers: ELS }
          );
          if (res.ok) {
            const json = await res.json();
            entry = json?.["serial-metadata-response"]?.entry?.[0] || {};
            serialDataFetched = true;
          }
        }

        // Try with EISSN if print ISSN failed or was empty
        if (!serialDataFetched && extractedEissn) {
          const res = await fetch(
            `https://api.elsevier.com/content/serial/title/issn/${extractedEissn}?view=CITESCORE`,
            { headers: ELS }
          );
          if (res.ok) {
            const json = await res.json();
            entry = json?.["serial-metadata-response"]?.entry?.[0] || {};
            serialDataFetched = true;
          }
        }

        if (serialDataFetched) {
          // Direct H-Index only (no SNIP fallback)
          if (entry["H-index"]) {
            R.hIndex = String(entry["H-index"]);
          }

          // CiteScore only (no SJR fallback)
          // Since JIF is different and unavailable, we keep R.jcrImpactFactor as "Not Available" per user decision.

          // Quartile Calculation based on existing CiteScore percentile quartile calculation logic
          const csYearInfo = entry?.citeScoreYearInfoList?.citeScoreYearInfo;
          let highestPercentile = null;

          if (Array.isArray(csYearInfo) && csYearInfo.length > 0) {
            const sortedYears = [...csYearInfo].sort((a, b) => parseInt(b["@year"] || 0) - parseInt(a["@year"] || 0));
            const latestYearInfo = sortedYears[0];
            const infoList = latestYearInfo.citeScoreInformationList || [];
            let percentiles = [];
            infoList.forEach(info => {
              const csInfo = info.citeScoreInfo || [];
              csInfo.forEach(cs => {
                const subjectRanks = cs.citeScoreSubjectRank || [];
                subjectRanks.forEach(sr => {
                  if (sr.percentile) {
                    const pVal = parseFloat(sr.percentile);
                    if (!isNaN(pVal)) percentiles.push(pVal);
                  }
                });
              });
            });
            if (percentiles.length > 0) {
              highestPercentile = Math.max(...percentiles);
            }
          }

          if (highestPercentile !== null) {
            if (highestPercentile >= 75) R.quartile = "Q1";
            else if (highestPercentile >= 50) R.quartile = "Q2";
            else if (highestPercentile >= 25) R.quartile = "Q3";
            else R.quartile = "Q4";
          }

          doneStep("success", "CiteScore, H-Index & Quartile calculated.");
        } else {
          doneStep("error", "Journal metrics not found in Scopus registry.");
        }
      } catch (e) {
        doneStep("error", `Scopus Serial error: ${e.message}`);
      }
    } else {
      pushStep("Step 2: Scopus Serial API - Skipped (No ISSN or EISSN found)", "skip");
      doneStep("skip");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3 — Clarivate rank-search API (via Consolidated Backend Proxy)
    // ══════════════════════════════════════════════════════════════════════════
    if (extractedIssn || extractedEissn) {
      pushStep("Step 3: Checking Journal Indexing in Clarivate WoS...");
      try {
        let clarivateSuccess = false;
        let responseJson = {};

        // Try with print ISSN first
        if (extractedIssn) {
          const wosIssn = formatISSNWithHyphen(extractedIssn);
          const res = await fetch(`${BACKEND_URL}/api/research/journal/wos-type`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issn: wosIssn })
          });
          if (res.ok) {
            responseJson = await res.json();
            if (responseJson.success && responseJson.journalType) {
              R.journalType = responseJson.journalType;
              clarivateSuccess = true;
            }
          }
        }

        // Try with EISSN if print ISSN failed or returned no JCR edition
        if (!clarivateSuccess && extractedEissn) {
          const wosEissn = formatISSNWithHyphen(extractedEissn);
          const res = await fetch(`${BACKEND_URL}/api/research/journal/wos-type`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ issn: wosEissn })
          });
          if (res.ok) {
            responseJson = await res.json();
            if (responseJson.success && responseJson.journalType) {
              R.journalType = responseJson.journalType;
              clarivateSuccess = true;
            }
          }
        }

        if (clarivateSuccess) {
          doneStep("success", `JCR Edition retrieved: ${R.journalType}`);
        } else {
          doneStep("success", "Not found in Clarivate index.");
        }
      } catch (e) {
        doneStep("error", `Clarivate API error: ${e.message}`);
      }
    } else {
      pushStep("Step 3: Clarivate WoS - Skipped (No ISSN or EISSN found)", "skip");
      doneStep("skip");
    }

    setData(R);
    setBusy(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const fields = [
    { key: "doi", label: "DOI", span: 2 },
    { key: "title", label: "Title of the Article", span: 2 },
    { key: "journalName", label: "Name of the Journal", span: 2 },
    { key: "journalType", label: "Type of Journal", span: 1 },
    { key: "quartile", label: "Journal Quartile", span: 1 },
    { key: "volume", label: "Volume", span: 1 },
    { key: "issue", label: "Issue", span: 1 },
    { key: "date", label: "Date of Publication", span: 2 },
    { key: "hIndex", label: "Journal H-Index", span: 1 },
    { key: "jcrImpactFactor", label: "Impact Factor of Journal", span: 1 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: "48px 24px", color: "#f8fafc"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .doi-input:focus   { outline:none; border-color:#3b82f6 !important; box-shadow:0 0 0 3px rgba(59,130,246,0.25); }
        .fetch-btn:hover:not(:disabled) { background:#2563eb !important; transform:translateY(-1px); box-shadow:0 4px 20px rgba(37,99,235,0.3); }
        .fetch-btn:active  { transform:translateY(0) !important; }
      `}</style>

      <div style={{ maxWidth: 840, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border-color)" }}>
          <div style={{
            fontSize: 11, color: "#3b82f6", fontWeight: 700,
            letterSpacing: "0.2em", marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif"
          }}>
            ADITYA UNIVERSITY · RESEARCH MANAGEMENT
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700, color: "#f8fafc",
            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em"
          }}>
            DOI → Journal Metadata Fetcher
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            3-source reliable pipeline: <span style={{ color: "#38bdf8", fontWeight: 600 }}>Scopus Abstract API</span> →{" "}
            <span style={{ color: "#60a5fa", fontWeight: 600 }}>Scopus Serial API</span> →{" "}
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>Clarivate WoS (JCR)</span>
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, color: "#94a3b8", fontWeight: 700,
            letterSpacing: "0.12em", marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif"
          }}>ENTER DIGITAL OBJECT IDENTIFIER (DOI)</div>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              className="doi-input"
              value={doi}
              onChange={e => setDoi(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !busy && fetchAll()}
              placeholder="e.g. 10.1038/s41598-026-37672-y"
              style={{
                flex: 1, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "14px 18px", color: "#f8fafc",
                fontSize: 14, transition: "all 0.2s ease"
              }}
            />
            <button
              className="fetch-btn"
              onClick={fetchAll}
              disabled={busy || !doi.trim()}
              style={{
                background: "#1d4ed8", border: "none", borderRadius: 10,
                padding: "14px 28px", color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: "pointer",
                transition: "all 0.2s ease", whiteSpace: "nowrap",
                opacity: (!doi.trim() || busy) ? 0.45 : 1
              }}
            >
              {busy ? "Fetching…" : "→ Fetch"}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 24,
            fontSize: 13,
            color: "#fca5a5"
          }}>
            ⚠ {errorMessage}
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div style={{
            background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12, padding: "18px 20px", marginBottom: 28, backdropFilter: "blur(12px)"
          }}>
            <div style={{
              fontSize: 10, color: "#94a3b8", fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif"
            }}>FETCH PROGRESS</div>
            {steps.map((s, i) => <StepRow key={s.id} step={s} idx={i} />)}
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            <div style={{
              fontSize: 10, color: "#94a3b8", fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: 16, display: "flex",
              justifyContent: "space-between", alignItems: "center", fontFamily: "'Space Grotesk', sans-serif"
            }}>
              <span>TRUSTED METADATA FIELDS</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {fields.filter(f => data[f.key] && data[f.key] !== "Not Available").length} / {fields.length} Verified
              </span>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, marginBottom: 28
            }}>
              {fields.map(f => (
                <div key={f.key} style={{ gridColumn: `span ${f.span}` }}>
                  <ResultCard
                    field={f.label}
                    value={data[f.key]}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {[
                {
                  label: "⧉ Copy JSON Results", fn: () => {
                    const out = {};
                    fields.forEach(f => { out[f.label] = data[f.key] || ""; });
                    navigator.clipboard?.writeText(JSON.stringify(out, null, 2));
                  }
                },
                {
                  label: "⧉ Copy Tab-Separated Text", fn: () => {
                    const rows = fields.map(f => `${f.label}\t${data[f.key] || ""}`).join("\n");
                    navigator.clipboard?.writeText(rows);
                  }
                },
              ].map(b => (
                <button key={b.label} onClick={b.fn} style={{
                  background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: 10,
                  padding: "10px 20px", color: "#60a5fa", fontSize: 12, cursor: "pointer",
                  fontWeight: 600, transition: "all 0.2s ease"
                }}>{b.label}</button>
              ))}
            </div>
          </>
        )}

        {/* How-it-works / Initial state card */}
        {!data && !busy && (
          <div style={{
            marginTop: 12, padding: "24px", background: "rgba(15, 23, 42, 0.3)",
            border: "1px solid var(--border-color)", borderRadius: 12
          }}>
            <div style={{
              fontSize: 11, color: "#3b82f6", fontWeight: 700,
              letterSpacing: "0.12em", marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif"
            }}>HOW RELIABLE METADATA IS EXTRACTED</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                {
                  step: "01",
                  title: "Scopus Abstract API Retrieval",
                  desc: "Extracts Title, Journal publication name, exact volume, issue, and display publication date directly from the publisher registry.",
                  color: "#38bdf8"
                },
                {
                  step: "02",
                  title: "Scopus Serial Metrics Extraction",
                  desc: "Fetches CiteScore for reliable journal impact, H-index, and executes quartile classification logic (Q1-Q4) based on subject percentiles.",
                  color: "#60a5fa"
                },
                {
                  step: "03",
                  title: "Clarivate Web of Science (WoS) Verification",
                  desc: "Hits the public rank-search service using the ISSN / EISSN. Directly parses JCR edition (SCIE, SSCI, ESCI, AHCI) to verify type.",
                  color: "#a78bfa"
                }
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: item.color,
                    fontFamily: "'Space Grotesk', sans-serif", width: 28, height: 28,
                    borderRadius: "50%", border: `1px solid ${item.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
