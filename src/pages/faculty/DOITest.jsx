import { useState } from "react";

const ELSEVIER_API_KEY = "0436d4fe788649172354545ceca9e650";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const short   = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"];
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
  // handle "2045-2322 2045-2322" or single — strip hyphen for Scopus
  return raw.split(" ")[0].replace(/-/g, "");
}

function formatISSNWithHyphen(raw) {
  if (!raw) return "";
  // Returns ISSN with hyphen for Clarivate: "20452322" → "2045-2322"
  const digits = raw.split(" ")[0].replace(/-/g, "");
  if (digits.length === 8) return digits.slice(0, 4) + "-" + digits.slice(4);
  return raw.split(" ")[0]; // already has hyphen or unusual format
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepRow({ step, idx }) {
  const colors = { loading:"#f59e0b", success:"#10b981", error:"#ef4444", skip:"#475569" };
  const icons  = { success:"✓", error:"✗", skip:"–" };
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"5px 0",
                  animation:"fadeIn 0.25s ease", borderBottom:"1px solid #0f2233" }}>
      <span style={{
        width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:10, flexShrink:0, fontWeight:700,
        background: step.status==="loading" ? "#1e3a5f"
                  : step.status==="success" ? "#064e3b"
                  : step.status==="skip"    ? "#1a1a2e"
                  : "#450a0a",
        color: colors[step.status] || "#94a3b8",
        border:`1px solid ${colors[step.status] || "#334155"}`,
      }}>
        {step.status==="loading"
          ? <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%",
              border:"2px solid #f59e0b", borderTopColor:"transparent",
              animation:"spin 0.7s linear infinite" }} />
          : (icons[step.status] || idx+1)}
      </span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color: colors[step.status] || "#94a3b8", fontWeight:600 }}>
          {step.label}
        </div>
        {step.note && (
          <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{step.note}</div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ field, value, source, warn }) {
  const [copied, setCopied] = useState(false);
  const empty = !value || value === "—";
  return (
    <div style={{
      background: empty ? "#111827" : warn ? "#1a1200" : "#0a1929",
      border:`1px solid ${empty ? "#1f2937" : warn ? "#854d0e" : "#1d4ed8"}`,
      borderRadius:10, padding:"13px 16px", transition:"all 0.3s",
      position:"relative", overflow:"hidden"
    }}>
      {!empty && !warn && (
        <div style={{ position:"absolute", top:0, left:0, width:3,
          height:"100%", background:"#1d4ed8", borderRadius:"10px 0 0 10px" }} />
      )}
      {warn && !empty && (
        <div style={{ position:"absolute", top:0, left:0, width:3,
          height:"100%", background:"#d97706", borderRadius:"10px 0 0 10px" }} />
      )}
      <div style={{ fontSize:10, color:"#4b5563", fontWeight:700,
                    letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5,
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>{field}</span>
        {source && !empty && (
          <span style={{ color:"#1e40af", fontWeight:500, fontSize:9,
                         background:"#0f172a", padding:"2px 6px", borderRadius:4 }}>
            {source}
          </span>
        )}
      </div>
      <div style={{ fontSize:14, fontWeight: empty ? 400 : 600,
                    color: empty ? "#374151" : warn ? "#fcd34d" : "#e2e8f0",
                    display:"flex", alignItems:"center", gap:6, wordBreak:"break-word" }}>
        {empty ? "Not fetched" : value}
        {!empty && (
          <button onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true); setTimeout(() => setCopied(false), 1500);
          }} style={{ background:"none", border:"none", cursor:"pointer", padding:"0 2px",
                      color: copied ? "#10b981":"#374151", fontSize:13, flexShrink:0 }}>
            {copied ? "✓" : "⧉"}
          </button>
        )}
      </div>
      {warn && !empty && (
        <div style={{ fontSize:10, color:"#92400e", marginTop:4 }}>⚠ {warn}</div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DOIFetcher() {
  const [doi,  setDoi]  = useState("");
  const [data, setData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [busy,  setBusy]  = useState(false);

  // step helpers
  const pushStep  = (label, status="loading", note="") =>
    setSteps(p => [...p, { label, status, note, id: Date.now()+Math.random() }]);
  const doneStep  = (status, note="") =>
    setSteps(p => { const a=[...p]; a[a.length-1]={...a[a.length-1], status, note}; return a; });

  // ── Main fetch ──────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
    if (!cleanDoi) return;
    setBusy(true); setData(null); setSteps([]);

    const R = {};   // result
    const ELS = { "X-ELS-APIKey": ELSEVIER_API_KEY, Accept:"application/json" };

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1 — Scopus Abstract API  →  article-level fields
    // ══════════════════════════════════════════════════════════════════════════
    pushStep("Scopus Abstract API — Title, Journal, Vol, Issue, Pages, Date");
    try {
      const res = await fetch(
        `https://api.elsevier.com/content/abstract/doi/${encodeURIComponent(cleanDoi)}`,
        { headers: ELS }
      );
      if (res.ok) {
        const json = await res.json();
        const core = json?.["abstracts-retrieval-response"]?.coredata || {};

        R.doi         = cleanDoi;
        R.title       = core["dc:title"]              || null;
        R.journalName = core["prism:publicationName"] || null;
        R.volume      = core["prism:volume"]          || null;
        R.issue       = core["prism:issueIdentifier"] || null;
        R.pageRange   = core["prism:pageRange"]       || null;
        R.date        = parseDate(core["prism:coverDisplayDate"] || core["prism:coverDate"]);

        // ISSN — try both print and electronic
        const rawIssn = core["prism:issn"] || core["prism:eIssn"] || "";
        R._issn    = cleanISSN(rawIssn);           // without hyphen → Scopus Serial
        R._issnWoS = formatISSNWithHyphen(rawIssn); // with hyphen  → Clarivate WoS

        // Source labels
        R._src = { title:"Scopus Abstract", journalName:"Scopus Abstract",
                   volume:"Scopus", issue:"Scopus", pageRange:"Scopus", date:"Scopus" };

        doneStep("success", `ISSN extracted: ${R._issn || "not found"}`);
      } else {
        const txt = await res.text();
        doneStep("error", `HTTP ${res.status} — ${txt.slice(0,80)}`);
      }
    } catch(e) {
      doneStep("error", e.message);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2 — Scopus Serial/Title API  →  H-Index, CiteScore, SJR, Quartile
    //
    //  CORRECT PATHS:
    //   H-Index   → entry["H-index"]
    //   CiteScore → entry.citeScoreYearInfoList.citeScoreYearInfo (latest year)
    //   Quartile  → entry.ranks.rank[] filtered by @type=="SJR", latest @year
    //               rank["@quartile"] = "Q1"|"Q2"|"Q3"|"Q4"
    // ══════════════════════════════════════════════════════════════════════════
    if (R._issn) {
      pushStep(`Scopus Serial API — H-Index, CiteScore, Quartile  (ISSN: ${R._issn})`);
      try {
        const res = await fetch(
          `https://api.elsevier.com/content/serial/title/issn/${R._issn}`,
          { headers: ELS }
        );
        if (res.ok) {
          const json = await res.json();
          const entry = json?.["serial-metadata-response"]?.entry?.[0] || {};

          // ── H-Index ──────────────────────────────────────────────────────────
          // NOT available in this Scopus API plan → comes from SCImago (Step 3)
          const hRaw = entry["H-index"] || entry["h-index"] || null;
          if (hRaw) {
            R.hIndex = String(hRaw);
            R._src.hIndex = "Scopus Serial";
          }

          // ── CiteScore ────────────────────────────────────────────────────────
          // ACTUAL PATH (from console log):
          //   entry.citeScoreYearInfoList → flat object with citeScoreCurrentMetric
          //   NOT entry.citeScoreYearInfoList.citeScoreYearInfo[]
          const csList = entry?.citeScoreYearInfoList;
          let citeScore = null;

          if (csList) {
            // Case A: flat object  { citeScoreCurrentMetric: "6.7", ... }
            if (csList.citeScoreCurrentMetric) {
              citeScore = csList.citeScoreCurrentMetric;
            }
            // Case B: nested array  { citeScoreYearInfo: [{...}, ...] }
            else if (Array.isArray(csList.citeScoreYearInfo)) {
              const latest = [...csList.citeScoreYearInfo].sort((a, b) =>
                parseInt(b["@year"] || 0) - parseInt(a["@year"] || 0)
              )[0];
              citeScore = latest?.citeScoreCurrentMetric || latest?.citeScore || null;
            }
            // Case C: single object  { citeScoreYearInfo: { citeScoreCurrentMetric: ... } }
            else if (csList.citeScoreYearInfo?.citeScoreCurrentMetric) {
              citeScore = csList.citeScoreYearInfo.citeScoreCurrentMetric;
            }
          }
          if (citeScore) {
            R.impactFactor = String(citeScore);
            R._src.impactFactor = "Scopus CiteScore";
          }

          // ── Quartile ─────────────────────────────────────────────────────────
          // ACTUAL PATH (from console log):
          //   entry.SJRList → { SJR: [ { "@year":"2024", "@quartile":"Q1", "$":"0.893" } ] }
          //   NOT entry.ranks.rank[]
          let quartile = null;

          // Primary: SJRList (confirmed in response)
          const sjrList = entry?.SJRList?.SJR;
          if (sjrList) {
            const sjrArr = Array.isArray(sjrList) ? sjrList : [sjrList];
            const latest = [...sjrArr].sort((a, b) =>
              parseInt(b["@year"] || 0) - parseInt(a["@year"] || 0)
            )[0];
            quartile = latest?.["@quartile"] || null;  // "Q1","Q2","Q3","Q4"
          }

          // Fallback: SNIPList or ranks (older API versions)
          if (!quartile) {
            const rawRanks = entry?.ranks?.rank;
            const ranks = !rawRanks ? []
                        : Array.isArray(rawRanks) ? rawRanks
                        : [rawRanks];
            const sjrRanks = ranks.filter(r => r["@type"] === "SJR");
            if (sjrRanks.length > 0) {
              const latest = [...sjrRanks].sort((a, b) =>
                parseInt(b["@year"] || 0) - parseInt(a["@year"] || 0)
              )[0];
              quartile = latest["@quartile"] || null;
            }
          }

          if (quartile) {
            R.quartile = quartile;
            R._src.quartile = "Scopus SJRList";
          }

          doneStep("success",
            `H-Index:${R.hIndex||"—"}  CiteScore:${R.impactFactor||"—"}  Quartile:${R.quartile||"—"}`
          );
        } else {
          doneStep("error", `HTTP ${res.status}`);
        }
      } catch(e) {
        doneStep("error", e.message);
      }
    } else {
      pushStep("Scopus Serial API — skipped (no ISSN)", "skip");
      doneStep("skip");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3 — SCImago scraping  →  H-Index fallback (if Scopus didn't give it)
    //
    //  Backend route:  POST /api/research/journal/scimago-hindex
    //  Body:           { issn: "20452322" }   ← without hyphen
    //  Response:       { success, hIndex, sid, detailUrl }
    //
    //  SCImago URL flow:
    //    1) scimagojr.com/journalsearch.php?q={issn}  → parse SID from first card
    //    2) scimagojr.com/journalsearch.php?q={sid}&tip=sid&clean=0  → parse H-Index
    // ══════════════════════════════════════════════════════════════════════════
    if (!R.hIndex && R._issn) {
      pushStep(`SCImago — H-Index scraping  (ISSN: ${R._issn})`);
      try {
        const res = await fetch(`/api/research/journal/scimago-hindex`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issn: R._issn })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.hIndex) {
            R.hIndex       = String(json.hIndex);
            R._src.hIndex  = "SCImago";
            doneStep("success", `H-Index: ${R.hIndex}  (SID: ${json.sid})`);
          } else {
            doneStep("skip", json.message || "H-Index not found on SCImago");
          }
        } else {
          doneStep("error", `HTTP ${res.status}`);
        }
      } catch(e) {
        doneStep("error", e.message);
      }
    } else if (R.hIndex) {
      pushStep("SCImago H-Index — skipped (already have from Scopus)", "skip");
      doneStep("skip");
    } else {
      pushStep("SCImago H-Index — skipped (no ISSN)", "skip");
      doneStep("skip");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 4 — Crossref fallback  →  fills any missing article-level fields
    // ══════════════════════════════════════════════════════════════════════════
    if (!R.title || !R.journalName || !R.volume) {
      pushStep("Crossref API — filling missing article fields (fallback)");
      try {
        const res = await fetch(
          `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`
        );
        if (res.ok) {
          const json = await res.json();
          const msg  = json?.message || {};
          const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN",
                                "JUL","AUG","SEP","OCT","NOV","DEC"];
          if (!R.title       && msg.title?.[0])               { R.title       = msg.title[0];               R._src.title       = "Crossref"; }
          if (!R.journalName && msg["container-title"]?.[0])  { R.journalName = msg["container-title"][0];  R._src.journalName = "Crossref"; }
          if (!R.volume      && msg.volume)                   { R.volume      = msg.volume;                 R._src.volume      = "Crossref"; }
          if (!R.issue       && msg.issue)                    { R.issue       = msg.issue;                  R._src.issue       = "Crossref"; }
          if (!R.pageRange   && msg.page)                     { R.pageRange   = msg.page;                   R._src.pageRange   = "Crossref"; }
          if (!R.date) {
            const dp = msg["published-print"]?.["date-parts"]?.[0]
                    || msg["published-online"]?.["date-parts"]?.[0];
            if (dp) {
              R.date = `${MONTHS_SHORT[(dp[1]||1)-1] || ""} ${dp[0]||""}`.trim();
              R._src.date = "Crossref";
            }
          }
          // ISSN fallback
          if (!R._issn && msg.ISSN?.[0]) {
            R._issn    = cleanISSN(msg.ISSN[0]);
            R._issnWoS = formatISSNWithHyphen(msg.ISSN[0]);
          }
          doneStep("success", "Missing fields filled from Crossref");
        } else {
          doneStep("error", `HTTP ${res.status}`);
        }
      } catch(e) {
        doneStep("error", e.message);
      }
    } else {
      pushStep("Crossref API — skipped (all article fields already filled)", "skip");
      doneStep("skip");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 5 — Clarivate WoS PUBLIC endpoint  →  SCI / SCIE / ESCI / WoS type
    //
    //  This is the PUBLIC rank-search endpoint from mjl.clarivate.com
    //  NO Bearer token needed — works without subscription
    //  Response: data[].editions[].edition.code  → "SCIE","SCI","ESCI","SSCI"
    // ══════════════════════════════════════════════════════════════════════════
    const issn4wos = R._issnWoS || R._issn;
    if (issn4wos) {
      pushStep(`Clarivate WoS — Journal Type: SCI/SCIE/ESCI  (ISSN: ${issn4wos})`);
      try {
        const res = await fetch(`/api/research/journal/wos-type`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ issn: issn4wos })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.inWoS && json.journalType) {
            R.journalType      = json.journalType;  // only jcrEdition: "SCIE" etc.
            R._src.journalType = "Clarivate WoS (proxy)";
            doneStep("success", `Type: ${R.journalType}`);
          } else {
            if (R.title) {
              R.journalType      = "SCOPUS";
              R._src.journalType = "Scopus (not in WoS)";
            }
            doneStep("success", "Not indexed in WoS — marked SCOPUS only");
          }
        } else {
          // If WoS fails, mark SCOPUS only if we got scopus data
          if (R.title) { R.journalType = "SCOPUS"; R._src.journalType = "Scopus"; }
          doneStep("error", `HTTP ${res.status}`);
        }
      } catch(e) {
        if (R.title) { R.journalType = "SCOPUS"; R._src.journalType = "Scopus"; }
        doneStep("error", e.message);
      }
    } else {
      pushStep("Clarivate WoS — skipped (no ISSN)", "skip");
      doneStep("skip");
    }

    setData(R);
    setBusy(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const fields = [
    { key:"doi",          label:"DOI",                          span:2 },
    { key:"title",        label:"Title of the Article",         span:2 },
    { key:"journalName",  label:"Name of the Journal",          span:2 },
    { key:"quartile",     label:"Journal Quartile",             span:1 },
    { key:"journalType",  label:"Type of Journal (SCI/SCIE/ESCI/WoS/SCOPUS)", span:1 },
    { key:"volume",       label:"Vol",                          span:1 },
    { key:"issue",        label:"Issue",                        span:1 },
    { key:"pageRange",    label:"Page No's",                    span:1 },
    { key:"hIndex",       label:"Journal H-Index",              span:1 },
    { key:"impactFactor", label:"Impact Factor (CiteScore)",    span:1,
      warn:"CiteScore — Clarivate JIF needs institutional subscription" },
    { key:"date",         label:"Date of Publication (MONTH YEAR)", span:2 },
  ];

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#020817 0%,#0a1628 60%,#020817 100%)",
      fontFamily:"'IBM Plex Mono','Fira Code',monospace",
      padding:"32px 20px", color:"#e2e8f0"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .doi-input:focus   { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,0.2); }
        .fetch-btn:hover:not(:disabled) { background:#2563eb !important; transform:translateY(-1px); box-shadow:0 4px 20px rgba(37,99,235,0.4); }
        .fetch-btn:active  { transform:translateY(0) !important; }
      `}</style>

      <div style={{ maxWidth:800, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:28, paddingBottom:18, borderBottom:"1px solid #0f2233" }}>
          <div style={{ fontSize:10, color:"#1d4ed8", fontWeight:700,
                        letterSpacing:"0.2em", marginBottom:8 }}>
            ADITYA UNIVERSITY · RESEARCH MANAGEMENT
          </div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700, color:"#f1f5f9",
                       fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"-0.02em" }}>
            DOI → Journal Metadata Fetcher
          </h1>
          <p style={{ margin:"6px 0 0", fontSize:12, color:"#4b5563", lineHeight:1.6 }}>
            5-source pipeline: <span style={{color:"#f97316"}}>Scopus Abstract</span> →{" "}
            <span style={{color:"#3b82f6"}}>Scopus Serial</span> →{" "}
            <span style={{color:"#22c55e"}}>SCImago</span> →{" "}
            <span style={{color:"#a78bfa"}}>Crossref</span> →{" "}
            <span style={{color:"#38bdf8"}}>Clarivate WoS</span>
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:10, color:"#374151", fontWeight:700,
                        letterSpacing:"0.12em", marginBottom:7 }}>ENTER DOI</div>
          <div style={{ display:"flex", gap:10 }}>
            <input
              className="doi-input"
              value={doi}
              onChange={e => setDoi(e.target.value)}
              onKeyDown={e => e.key==="Enter" && !busy && fetchAll()}
              placeholder="e.g.  10.1038/s41598-023-37672-y"
              style={{
                flex:1, background:"#0b1120", border:"1px solid #1f3a5f",
                borderRadius:8, padding:"11px 16px", color:"#e2e8f0",
                fontSize:14, fontFamily:"inherit", transition:"all 0.2s"
              }}
            />
            <button
              className="fetch-btn"
              onClick={fetchAll}
              disabled={busy || !doi.trim()}
              style={{
                background:"#1d4ed8", border:"none", borderRadius:8,
                padding:"11px 22px", color:"#fff", fontWeight:700,
                fontSize:13, cursor:"pointer", fontFamily:"inherit",
                transition:"all 0.2s", whiteSpace:"nowrap",
                opacity: (!doi.trim()||busy) ? 0.45 : 1
              }}
            >
              {busy ? "Fetching…" : "→ Fetch"}
            </button>
          </div>
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div style={{ background:"#060d18", border:"1px solid #0f2233",
                        borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
            <div style={{ fontSize:10, color:"#374151", fontWeight:700,
                          letterSpacing:"0.12em", marginBottom:10 }}>FETCH PROGRESS</div>
            {steps.map((s, i) => <StepRow key={s.id} step={s} idx={i} />)}
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            <div style={{ fontSize:10, color:"#374151", fontWeight:700,
                          letterSpacing:"0.12em", marginBottom:12, display:"flex",
                          justifyContent:"space-between", alignItems:"center" }}>
              <span>JOURNAL FIELDS</span>
              <span style={{ color:"#10b981" }}>
                {fields.filter(f => data[f.key]).length} / {fields.length} filled
              </span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                          gap:8, marginBottom:20 }}>
              {fields.map(f => (
                <div key={f.key} style={{ gridColumn:`span ${f.span}` }}>
                  <ResultCard
                    field={f.label}
                    value={data[f.key] || "—"}
                    source={data._src?.[f.key]}
                    warn={f.warn && data[f.key] ? f.warn : null}
                  />
                </div>
              ))}
            </div>

            {/* Source legend */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {[
                { name:"Scopus Abstract", color:"#f97316", info:"Title, Journal, Vol, Issue, Pages, Date, ISSN" },
                { name:"Scopus Serial",   color:"#3b82f6", info:"H-Index (entry[\"H-index\"]), CiteScore, Quartile (ranks[])" },
                { name:"SCImago",         color:"#22c55e", info:"H-Index fallback via web scraping (SID → detail page)" },
                { name:"Crossref",        color:"#a78bfa", info:"Fallback for missing article fields" },
                { name:"Clarivate WoS",   color:"#38bdf8", info:"SCI / SCIE / ESCI / WoS type (public endpoint)" },
              ].map(s => (
                <div key={s.name} style={{ fontSize:10, background:"#0b1120",
                  border:"1px solid #1f2937", borderRadius:6, padding:"5px 10px" }}>
                  <span style={{ color:s.color, fontWeight:700 }}>{s.name}</span>
                  <span style={{ color:"#374151", marginLeft:5 }}>{s.info}</span>
                </div>
              ))}
            </div>

            {/* Copy buttons */}
            <div style={{ display:"flex", gap:8 }}>
              {[
                { label:"⧉ Copy JSON", fn: () => {
                  const out = {};
                  fields.forEach(f => { out[f.label] = data[f.key] || ""; });
                  navigator.clipboard?.writeText(JSON.stringify(out, null, 2));
                }},
                { label:"⧉ Copy Tab-Separated", fn: () => {
                  const rows = fields.map(f => `${f.label}\t${data[f.key]||""}`).join("\n");
                  navigator.clipboard?.writeText(rows);
                }},
              ].map(b => (
                <button key={b.label} onClick={b.fn} style={{
                  background:"#0b1120", border:"1px solid #1f3a5f", borderRadius:7,
                  padding:"8px 16px", color:"#6b9eff", fontSize:12, cursor:"pointer",
                  fontFamily:"inherit", fontWeight:600, transition:"all 0.2s"
                }}>{b.label}</button>
              ))}
            </div>
          </>
        )}

        {/* How-it-works note */}
        {!data && !busy && (
          <div style={{ marginTop:32, padding:"16px 20px", background:"#060d18",
                        border:"1px solid #0f2233", borderRadius:10 }}>
            <div style={{ fontSize:10, color:"#1d4ed8", fontWeight:700,
                          letterSpacing:"0.12em", marginBottom:12 }}>HOW EACH FIELD IS FETCHED</div>
            {[
              { field:"Title, Journal, Vol, Issue, Pages, Date",
                src:"Scopus Abstract API",
                path:'coredata["dc:title"], ["prism:volume"], ["prism:coverDisplayDate"]…',
                color:"#f97316" },
              { field:"H-Index",
                src:"Scopus Serial API → SCImago (fallback scraping)",
                path:'Primary: entry["H-index"]  ← Scopus Serial (accurate)\nFallback: scimagojr.com/journalsearch.php?q={issn} → SID\n         → scimagojr.com/journalsearch.php?q={sid}&tip=sid&clean=0\n         → scrape <td>H-Index</td> next sibling value',
                color:"#3b82f6" },
              { field:"Impact Factor",
                src:"Scopus Serial API (CiteScore)",
                path:'entry.citeScoreYearInfoList → latest year → citeScore\n⚠ Real JIF is Clarivate-only; CiteScore is best available free metric',
                color:"#f59e0b" },
              { field:"Journal Quartile",
                src:"Scopus Serial API (ranks)",
                path:'entry.ranks.rank[] → filter @type=="SJR" → latest year → @quartile\n✓ Direct Q1/Q2/Q3/Q4 — NOT estimated from raw SJR number',
                color:"#3b82f6" },
              { field:"Type of Journal (SCI/SCIE/ESCI/WoS/SCOPUS)",
                src:"Clarivate WoS (public) + Scopus",
                path:'POST mjl.clarivate.com/api/mjl/jprof/public/rank-search\n→ data[].editions[].edition.code → "SCIE","ESCI","SCI"…',
                color:"#38bdf8" },
            ].map(r => (
              <div key={r.field} style={{ marginBottom:12, paddingBottom:12,
                                          borderBottom:"1px solid #0f2233" }}>
                <div style={{ fontSize:11, color:"#e2e8f0", fontWeight:700, marginBottom:3 }}>
                  <span style={{ color:r.color }}>■</span> {r.field}
                </div>
                <div style={{ fontSize:10, color:"#1d4ed8", marginBottom:3 }}>{r.src}</div>
                <div style={{ fontSize:10, color:"#374151", whiteSpace:"pre-line",
                              fontFamily:"monospace", lineHeight:1.6 }}>{r.path}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
