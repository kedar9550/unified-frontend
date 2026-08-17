import React, { forwardRef } from 'react';
import ausLogo from '../../assets/AUS Long Logo.png';
import { ADMIN_ROLE_CATALOG } from '../../constants/adminRoleCatalog';

const AppraisalPDFReport = forwardRef(({ data, hideInterpersonal, eligibilityDetails, isEligible }, ref) => {
  if (!data) return null;

  const styles = {
    container: {
      padding: '20px',
      fontFamily: '"Times New Roman", Times, serif',
      color: '#000',
      background: '#fff',
      width: '100%',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    logo: {
      width: '400px',
      marginBottom: '10px',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textDecoration: 'underline',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      backgroundColor: '#f0f0f0',
      padding: '8px',
      border: '1px solid #000',
      marginTop: '20px',
      marginBottom: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate', borderSpacing: 0,
      marginBottom: '15px',
      pageBreakInside: 'auto',
    },
    th: {
      border: '1px solid #000',
      padding: '6px',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: 'bold',
      backgroundColor: '#fafafa',
    },
    td: {
      border: '1px solid #000',
      padding: '6px',
      fontSize: '13px',
      textAlign: 'center'
    },
    tdLeft: {
      border: '1px solid #000',
      padding: '6px',
      fontSize: '13px',
      textAlign: 'left'
    },
    tr: {
      pageBreakInside: 'avoid',
      pageBreakAfter: 'auto',
    },
    rowLabel: {
      fontWeight: 'bold',
      width: '25%',
      backgroundColor: '#fafafa',
      textAlign: 'left'
    }
  };

  const pInfo = data.personalInfoSnapshot || {};
  const year = data.academicYearId?.year || "2025-26";

  const getSemBranchSec = (e) => {
    if (e.secBranchSem) return e.secBranchSem;
    const isYearProg = e.yearNumber !== null && e.yearNumber !== undefined && e.yearNumber !== 0;
    return isYearProg
      ? `YEAR-${e.yearNumber} ${e.branchCode || "—"} - SEC ${e.section || ""}`
      : `SEM-${e.semesterNumber} ${e.branchCode || "—"} - SEC ${e.section || ""}`;
  };

  // 1. Teaching summary variables (Pre-calculated from backend/detail page)
  const teaching = data.teaching || {};
  const { t1, t2, t3, t4, teachingTotal } = teaching;

  // 2. Research summary variables (Pre-calculated from backend/detail page)
  const rData = data.research || {};
  const { r21, r22, r23, r24, r25, r26, r27, r28, researchTotal } = rData;

  // 3. Value addition
  const vData = data.valueAddition || {};

  // 4. Administration
  const adminData = data.administrativeResponsibilities || {};

  return (
    <div ref={ref} style={styles.container}>
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 15mm 15mm; 
          }
          /* Ensures background colors are printed */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `}
      </style>
      <div style={styles.header}>
        <img src={ausLogo} alt="Aditya University" style={styles.logo} />
        <div style={styles.title}>Faculty Appraisal Report ({year})</div>
      </div>

      <div style={styles.sectionTitle}>PART A: PERSONAL INFORMATION</div>
      <table style={styles.table}>
        <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
          <tr style={styles.tr}>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Name of the Faculty</td>
            <td style={styles.tdLeft}>{pInfo.name || 'N/A'}</td>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Employee ID</td>
            <td style={styles.tdLeft}>{pInfo.institutionId || 'N/A'}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Designation</td>
            <td style={styles.tdLeft}>{pInfo.designation || 'N/A'}</td>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Department</td>
            <td style={styles.tdLeft}>{pInfo.departmentName || 'N/A'}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Highest Qualification</td>
            <td style={styles.tdLeft}>{pInfo.qualification || 'N/A'}</td>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Scopus ID</td>
            <td style={styles.tdLeft}>{pInfo.scopusId || 'N/A'}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Web of Science ID</td>
            <td style={styles.tdLeft}>{pInfo.wosId || 'N/A'}</td>
            <td style={{ ...styles.td, ...styles.rowLabel }}>ORCID ID</td>
            <td style={styles.tdLeft}>{pInfo.orcidId || 'N/A'}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={{ ...styles.td, ...styles.rowLabel }}>Date of Joining</td>
            <td style={styles.tdLeft} colSpan={3}>
              {pInfo.dateOfJoining ? new Date(pInfo.dateOfJoining).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>

      {eligibilityDetails && (
        <>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', color: '#002060' }}>Eligibility Status</div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, width: '10%' }}>S.No</th>
                <th style={{ ...styles.th, width: '70%' }}>Eligibility Criteria</th>
                <th style={{ ...styles.th, width: '20%' }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              <tr style={styles.tr}>
                <td style={styles.td}>1</td>
                <td style={styles.tdLeft}>
                  Attending an FDP of at least 5 days, organised by UGC / AICTE / IITs / IIMs / NITs / MHRD R&D labs / NITTTR / NIPER / ICMR / NIRF-ranked Institutes (below 200) / Govt. Universities / NPTEL / completing Coursera course (Min. 40 Hrs).
                </td>
                <td style={styles.td}>{eligibilityDetails.fdpCourseraPassed ? "Fulfilled" : "Unfulfilled"}</td>
              </tr>
              <tr style={styles.tr}>
                <td style={styles.td}>2</td>
                <td style={styles.tdLeft}>
                  Acquisition of the minimum required points in Metric 2.1 (Papers Published). (Min {eligibilityDetails.metric21Threshold} points)
                </td>
                <td style={styles.td}>{eligibilityDetails.metric21Passed ? "Fulfilled" : "Unfulfilled"}</td>
              </tr>
              {eligibilityDetails.showInterpersonal && (
                <tr style={styles.tr}>
                  <td style={styles.td}>3</td>
                  <td style={styles.tdLeft}>
                    A minimum of 30 points in the Interpersonal Skills category.
                  </td>
                  <td style={styles.td}>{eligibilityDetails.interpersonalPassed ? "Fulfilled" : "Unfulfilled"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <div style={styles.sectionTitle}>PART B: PERFORMANCE ATTRIBUTES</div>

      {/* 1. TEACHING SUMMARY */}
      <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
        1. Teaching
      </div>
      <table style={styles.table}>
        <thead style={{ display: 'table-header-group' }}>
          <tr style={styles.tr}>
            <th style={styles.th}>Metric</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Average points claimed</th>
          </tr>
        </thead>
        <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
          <tr style={styles.tr}>
            <td style={styles.td}>1.1</td>
            <td style={styles.tdLeft}>Course average pass percentage</td>
            <td style={styles.td}>{t1}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={styles.td}>1.2</td>
            <td style={styles.tdLeft}>Course feedback</td>
            <td style={styles.td}>{t2}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={styles.td}>1.3</td>
            <td style={styles.tdLeft}>Proctoring Students' average Pass Percentage</td>
            <td style={styles.td}>{t3}</td>
          </tr>
          <tr style={styles.tr}>
            <td style={styles.td}>1.4</td>
            <td style={styles.tdLeft}>CO attainment</td>
            <td style={styles.td}>{t4}</td>
          </tr>
          <tr style={styles.tr}>
            <td colSpan="2" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
            <td style={{ ...styles.td, fontWeight: 'bold' }}>{teachingTotal}</td>
          </tr>
        </tbody>
      </table>

      {/* 1.1 Course Average Pass Percentage */}
      {teaching?.passPercentage?.courses?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            1.1 Course Average Pass Percentage :
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Course Name</th>
                <th style={styles.th}>Sem- Branch- Sec</th>
                <th style={styles.th}>No. of students appeared (A)</th>
                <th style={styles.th}>No. of students Passed (B)</th>
                <th style={styles.th}>Pass Percentage (B/A*100)</th>
                <th style={styles.th}>Points claimed</th>
                <th style={styles.th}>Average points</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {teaching.passPercentage.courses.map((t, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{t.courseName}</td>
                  <td style={styles.td}>{getSemBranchSec(t)}</td>
                  <td style={styles.td}>{t.appeared}</td>
                  <td style={styles.td}>{t.passed}</td>
                  <td style={styles.td}>{t.percentage}%</td>
                  <td style={styles.td}>{t.pointsClaimed || ''}</td>
                  {i === 0 && (
                    <td style={{ ...styles.td, verticalAlign: 'middle' }} rowSpan={teaching.passPercentage.courses.length}>
                      {t1}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1.2 Course feedback */}
      {teaching?.courseFeedback?.courses?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            1.2 Course feedback:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Course Name</th>
                <th style={styles.th}>Sem- Branch- Sec</th>
                <th style={styles.th}>Total Students</th>
                <th style={styles.th}>Given Students</th>
                <th style={styles.th}>Feedback %</th>
                <th style={styles.th}>Points claimed</th>
                <th style={styles.th}>Average points</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {teaching.courseFeedback.courses.map((t, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{t.courseName}</td>
                  <td style={styles.td}>{getSemBranchSec(t)}</td>
                  <td style={styles.td}>{t.totalStudents || t.students || ''}</td>
                  <td style={styles.td}>{t.givenStudents || ''}</td>
                  <td style={styles.td}>{t.feedbackPercentage || ''}%</td>
                  <td style={styles.td}>{t.pointsClaimed || ''}</td>
                  {i === 0 && (
                    <td style={{ ...styles.td, verticalAlign: 'middle' }} rowSpan={teaching.courseFeedback.courses.length}>
                      {t2}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1.3 Proctoring Students Average pass percentage */}
      {teaching?.proctoring?.entries?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            1.3 Proctoring Students Average pass percentage:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>No. of students allotted for proctoring</th>
                <th style={styles.th}>Sem- Branch-Sec</th>
                <th style={styles.th}>No. of students eligible for end exams (A)</th>
                <th style={styles.th}>No. of students passed (B)</th>
                <th style={styles.th}>Pass percentage (B/A) * 100</th>
                <th style={styles.th}>Points claimed</th>
                <th style={styles.th}>Average points</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {teaching.proctoring.entries.map((e, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{e.totalStudents}</td>
                  <td style={styles.td}>{getSemBranchSec(e)}</td>
                  <td style={styles.td}>{e.appeared || e.eligible || ''}</td>
                  <td style={styles.td}>{e.passed || ''}</td>
                  <td style={styles.td}>{e.percentage}%</td>
                  <td style={styles.td}>{e.pointsClaimed || ''}</td>
                  {i === 0 && (
                    <td style={{ ...styles.td, verticalAlign: 'middle' }} rowSpan={teaching.proctoring.entries.length}>
                      {t3}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 1.4 CO attainment */}
      {teaching?.coAttainment?.courses?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            1.4 CO attainment:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Course Name</th>
                <th style={styles.th}>Sem- Branch- Sec</th>
                <th style={styles.th}>No. of CO’s</th>
                <th style={styles.th}>No. of CO’s attainment target reached</th>
                <th style={styles.th}>Points claimed</th>
                <th style={styles.th}>Average points</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {teaching.coAttainment.courses.map((t, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{t.courseName}</td>
                  <td style={styles.td}>{getSemBranchSec(t)}</td>
                  <td style={styles.td}>{t.noOfCos || ''}</td>
                  <td style={styles.td}>{t.noOfCosAttained || ''}</td>
                  <td style={styles.td}>{t.pointsClaimed || ''}</td>
                  {i === 0 && (
                    <td style={{ ...styles.td, verticalAlign: 'middle' }} rowSpan={teaching.coAttainment.courses.length}>
                      {t4}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. RESEARCH SUMMARY */}
      <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
        2. Research Contributions:
      </div>
      <table style={styles.table}>
        <thead style={{ display: 'table-header-group' }}>
          <tr style={styles.tr}>
            <th style={styles.th}>Metric</th>
            <th style={styles.th}>Research Item</th>
            <th style={styles.th}>Points claimed</th>
          </tr>
        </thead>
        <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
          {[
            { m: '2.1', label: 'Papers publication', val: r21 },
            { m: '2.2', label: 'Guiding Ph.D. scholars', val: r22 },
            { m: '2.3', label: 'Books / Chapters / Scopus Conference proceedings (Maximum 10 points)', val: r23 },
            { m: '2.4', label: 'Patents (Published / Granted)', val: r24 },
            { m: '2.5', label: 'Novel products / Technology (Developed / Implemented)', val: r25 },
            { m: '2.6', label: 'Funding projects / Consultancy (Shortlisted / Sanctioned)', val: r26 },
            { m: '2.7', label: 'Scopus citations score', val: r27 },
            { m: '2.8', label: 'Scopus h-Index score', val: r28 }
          ].map(row => (
            <tr key={row.m} style={styles.tr}>
              <td style={styles.td}>{row.m}</td>
              <td style={styles.tdLeft}>{row.label}</td>
              <td style={styles.td}>{row.val || 0}</td>
            </tr>
          ))}
          <tr style={styles.tr}>
            <td colSpan="2" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
            <td style={{ ...styles.td, fontWeight: 'bold' }}>{researchTotal}</td>
          </tr>
        </tbody>
      </table>

      {/* 2.1 Paper publication */}
      {rData?.papers?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.1 Paper publication: (only for one Aditya author)
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Article details in IEEE format</th>
                <th style={styles.th}>Category of the Journal</th>
                <th style={styles.th}>JCR Impact Factor</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.papers.items.map((j, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{j.title}</td>
                  <td style={styles.td}>{j.scope || j.category || j.journalName || ''}</td>
                  <td style={styles.td}>{j.impactFactor || ''}</td>
                  <td style={styles.td}>{j.pointsClaimed || ''}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="4" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r21}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2.2 Guiding Ph.D Scholars */}
      {rData?.phdGuidance?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.2 Guiding Ph. D Scholars:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Name of the Research Scholar (FT/PT)</th>
                <th style={styles.th}>University</th>
                <th style={styles.th}>Month & Year of Admission / Award</th>
                <th style={styles.th}>Pursuing / Awarded</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.phdGuidance.items.map((p, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{p.name} {p.scholarType ? '(' + p.scholarType + ')' : ''}</td>
                  <td style={styles.td}>{p.university}</td>
                  <td style={styles.td}>{p.admissionOrAwardDate ? new Date(p.admissionOrAwardDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}</td>
                  <td style={styles.td}>{p.status}</td>
                  <td style={styles.td}>{p.pointsClaimed}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="5" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r22}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2.3 Books/Chapters */}
      {rData?.booksChapters?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.3 Books/Chapters/Scopus Conference proceedings:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of Books/Chapter/conference Proceedings published along with ISBN/ISSN number</th>
                <th style={styles.th}>Category (Book/chapter/ Proceedings)</th>
                <th style={styles.th}>Publisher</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.booksChapters.items.map((b, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{b.title} {b.isbnIssn ? `(ISBN/ISSN: ${b.isbnIssn})` : ''}</td>
                  <td style={styles.td}>{b.itemType || b.category || ''}</td>
                  <td style={styles.td}>{b.publisher || ''}</td>
                  <td style={styles.td}>{b.pointsClaimed || ''}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="4" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points (Max:10)</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r23}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2.4 Patents */}
      {rData?.patents?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.4 Patents Published/Granted:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Patent Title along with Number and date</th>
                <th style={styles.th}>Patent filed Country</th>
                <th style={styles.th}>Published/Granted</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.patents.items.map((p, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{p.title} {p.filingNo || p.patentNumber ? `(${p.filingNo || p.patentNumber})` : ''} {p.dateOfFiling || p.date ? `[${new Date(p.dateOfFiling || p.date).toLocaleDateString("en-GB")}]` : ''}</td>
                  <td style={styles.td}>{p.country || ''}</td>
                  <td style={styles.td}>{p.status || ''}</td>
                  <td style={styles.td}>{p.pointsClaimed || ''}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="4" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r24}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2.5 Novel products */}
      {rData?.novelProducts?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.5 Novel products/Technology:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of the Novel Product/Technology</th>
                <th style={styles.th}>Name of the Implemented organization</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.novelProducts.items.map((n, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{n.title || n.details || ''}</td>
                  <td style={styles.td}>{n.productId?.implementedOrganization || n.productId?.developedOrganization || n.organizationName || n.organization || n.implementedOrganization || ''}</td>
                  <td style={styles.td}>{n.pointsClaimed || ''}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="3" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r25}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2.6 Project/Consultancy Proposals */}
      {rData?.projectsConsultancies?.items?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            2.6 Project/Consultancy Proposals:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of the Research Project/Consultancy</th>
                <th style={styles.th}>Funding Agency/Industry</th>
                <th style={styles.th}>Total worth (in lakhs)</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {rData.projectsConsultancies.items.map((fp, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{fp.title || fp.details || ''}</td>
                  <td style={styles.td}>{fp.agency || fp.fundingAgency || ''}</td>
                  <td style={styles.td}>{fp.amountInLakhs || fp.amount || fp.worth || ''}</td>
                  <td style={styles.td}>{fp.pointsClaimed ?? ''}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td colSpan="4" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{r26}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3.1 Faculty resource utilization */}
      {vData?.resourceUtilization?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid', fontWeight: 'bold' }}>
            3. Extension/Value addition:
          </div>
          <div style={{ fontSize: '14px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            3.1 Faculty resource utilization
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of the Event along with dates</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {vData.resourceUtilization.map((r, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>
                    {r.courseFdpName || r.event || r.organizationName || r.eventName || r.topic}{" "}
                    {(() => {
                      const fromDate = r.fromDate || r.eventStartDate;
                      const toDate = r.toDate || r.eventEndDate;
                      if (fromDate) {
                        return '(' + new Date(fromDate).toLocaleDateString('en-GB') + (toDate ? ' to ' + new Date(toDate).toLocaleDateString('en-GB') : '') + ')';
                      } else if (r.date) {
                        return '(' + r.date + ')';
                      }
                      return '';
                    })()}
                  </td>
                  <td style={styles.td}>
                    {(() => {
                      const role = (r.activityType || '').toLowerCase();
                      if (role.includes('resource person') || role.includes('resourceperson')) {
                        const num = r.numberOfSessions || r.sessionsConducted || 0;
                        return num ? `${num} session${num === 1 ? '' : 's'}` : '';
                      } else if (role.includes('participant') || role.includes('participated')) {
                        const num = r.numberOfDaysParticipated || r.daysParticipated || r.duration || 0;
                        return num ? `${num} day${num === 1 ? '' : 's'}` : '';
                      } else {
                        const num = r.numberOfDaysOrganized || r.duration || 0;
                        return num ? `${num} day${num === 1 ? '' : 's'}` : '';
                      }
                    })()}
                  </td>
                  <td style={styles.td}>{(r.activityCategory || r.natureOfEvent || '') + ' - ' + (r.activityType || r.roleOfFaculty || r.activityRole || '')}</td>
                  <td style={styles.td}>{r.pointsClaimed || ''}</td>
                </tr>
              ))}
              {/* Max capped points are already calculated and can be added if needed separately */}
              <tr style={styles.tr}>
                <td colSpan="4" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points (Max:10)</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{vData.resourceUtilizationTotal !== undefined ? vData.resourceUtilizationTotal : (Math.min(10, vData.resourceUtilization.reduce((sum, r) => sum + (Number(r.pointsClaimed) || 0), 0)) || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3.2 Faculty Expertise */}
      {vData?.contributions?.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', marginTop: '15px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            3.2 Faculty Expertise/Recognition/Contribution
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of the Faculty Expertise/Recognition/Contribution</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {vData.contributions.map((c, i) => {
                const getDesc = () => {
                  switch (c.category) {
                    case 1: return `Member of BOG/GB/AC/BOS: ${c.organizationName || ''}`;
                    case 2: case 3: return `Editorial Board: ${c.journalName || c.journalConferenceName || ''}`;
                    case 4: case 5: return `Awarded as ${c.awardName || 'N/A'} by ${c.awardingAgency || 'N/A'} on ${c.awardDate ? new Date(c.awardDate).toLocaleDateString('en-GB') : 'N/A'}`;
                    case 6: return `Developed e-content for the course ${c.courseName || 'N/A'}${c.url ? ` • View Resource (${c.url})` : ''}`;
                    case 7: {
                      const fDate = c.fromDate ? new Date(c.fromDate).toLocaleDateString('en-GB') : "";
                      const tDate = c.toDate ? new Date(c.toDate).toLocaleDateString('en-GB') : "";
                      return `Completed the certification ${c.certificationName || 'N/A'} from ${fDate} to ${tDate} (${c.courseHours || 'N/A'} hours).`;
                    }
                    case 8: return `Trained student(s) ${c.studentNames || 'N/A'} shortlisted for the finals of the ${c.eventType || 'N/A'} "${c.eventName || 'N/A'}" on ${c.eventDate ? new Date(c.eventDate).toLocaleDateString('en-GB') : 'N/A'}.`;
                    case 9: return `Published the article "${c.articleTitle || 'N/A'}" in ${c.publicationName || 'N/A'} on ${c.publicationDate ? new Date(c.publicationDate).toLocaleDateString('en-GB') : 'N/A'}.`;
                    case 10: {
                      const fDate = c.fromDate ? new Date(c.fromDate).toLocaleDateString('en-GB') : "";
                      const tDate = c.toDate ? new Date(c.toDate).toLocaleDateString('en-GB') : "";
                      return c.contributionType === "Establishment" ? `Established the research facility ${c.facilityName || 'N/A'} on ${fDate}.` : `Maintained the research facility ${c.facilityName || 'N/A'} from ${fDate} to ${tDate}.`;
                    }
                    case 11: return `Completed the NPTEL course ${c.courseName || 'N/A'} with a duration of ${c.duration || 'N/A'}.`;
                    case 12: {
                      const fDate = c.fromDate ? new Date(c.fromDate).toLocaleDateString('en-GB') : "";
                      const tDate = c.toDate ? new Date(c.toDate).toLocaleDateString('en-GB') : "";
                      return `Completed the Coursera course ${c.courseName || 'N/A'} from ${fDate} to ${tDate} (${c.courseHours || 'N/A'} hours).`;
                    }
                    case 13: return `Received a ${c.grantType?.toLowerCase() || 'grant'} of ₹${c.grantAmount || 0} from ${c.fundingAgency || 'N/A'} for "${c.grantTitle || 'N/A'}" on ${c.sanctionDate ? new Date(c.sanctionDate).toLocaleDateString('en-GB') : 'N/A'}.`;
                    default: return c.details || "Detail";
                  }
                };
                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.tdLeft}>{getDesc()}</td>
                    <td style={styles.td}>{c.pointsClaimed || ''}</td>
                  </tr>
                )
              })}
              <tr style={styles.tr}>
                <td colSpan="2" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment Points (Max:10)</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>{vData.contributionsTotal !== undefined ? vData.contributionsTotal : (Math.min(10, vData.contributions.reduce((sum, c) => sum + (Number(c.pointsClaimed) || 0), 0)) || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3 Total Row (Removed as per user request to show max 10 in sub-tables) */}

      {/* 4. ADMINISTRATION */}
      {adminData?.roles?.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            4. Administrative Responsibilities:
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>Details of the Administrative Responsibility</th>
                <th style={styles.th}>Assigned by</th>
                <th style={styles.th}>Points claimed</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {adminData.roles.map((r, i) => {
                const assignedByType = typeof r.assignedBy === 'object' ? r.assignedBy.type : (r.assignedBy || "");
                const assignedByOtherText = typeof r.assignedBy === 'object' ? r.assignedBy.otherText : "";
                let assignedByText = "";
                if (assignedByType) {
                  assignedByText = assignedByType === "Others" && assignedByOtherText ? assignedByOtherText : assignedByType;
                }

                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.tdLeft}>
                      {(() => {
                        const catalogEntry = ADMIN_ROLE_CATALOG.find(c => c.roleId === r.roleId);
                        return (catalogEntry && !['other', 'other_coord', 'training_coord'].includes(r.roleId)) 
                          ? catalogEntry.label 
                          : (r.roleLabel || r.roleName);
                      })()} {!['dean', 'assoc_dean', 'coe', 'hod', 'dy_coe', 'univ_office_coord', 'dy_hod', 'dept_exam_cell'].includes(r.roleId) && r.level ? `(${r.level})` : ''} {r.details ? `[${r.details}]` : ""}
                    </td>
                    <td style={styles.td}>{assignedByText || 'HOD / Principal'}</td>
                    <td style={styles.td}>{r.pointsClaimed || ''}</td>
                  </tr>
                );
              })}
              <tr style={styles.tr}>
                <td colSpan="3" style={{ ...styles.td, fontWeight: 'bold', textAlign: 'right' }}>Self-Assessment points (Max: 20)</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                  {adminData.adminTotal || 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px', fontWeight: 'bold' }}>
            Signature of Faculty
          </div>
        </div>
      </div>

      {/* 5. INTERPERSONAL SKILLS */}
      {!hideInterpersonal && data.hodEvaluation?.interpersonalRatings?.length > 0 && (
        <div style={{ pageBreakBefore: 'always' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            5. Interpersonal Skills
          </div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                <th style={styles.th}>PARAMETER</th>
                <th style={styles.th}>HoD Score</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              {data.hodEvaluation.interpersonalRatings.map((r, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdLeft}>{r.parameterText || r.parameterName || `Parameter ${r.parameterId || i + 1}`}</td>
                  <td style={styles.td}>{r.rating}</td>
                </tr>
              ))}
              <tr style={styles.tr}>
                <td style={{ ...styles.td, fontWeight: 'bold' }} colSpan="2" align="right">Total points</td>
                <td style={{ ...styles.td, fontWeight: 'bold' }}>
                  {data.hodEvaluation.interpersonalRatings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 6. MINIMUM POINTS SUMMARY TABLE */}
      {!hideInterpersonal && (() => {
        const facultyCategory = data.facultyCategory || "Non-Doctorate Faculty";
        const minPoints = data.minimumPoints?.[facultyCategory] || {};

        const minTeaching = minPoints.teaching || 0;
        const minResearch21 = minPoints.research21 || 0;
        const minResearch22_28 = minPoints.research22_28 || 0;
        const minValAdd = minPoints.valueAddition || 0;
        const minAdmin = minPoints.administration || 0;
        const minTotal1to4 = minTeaching + minResearch21 + minResearch22_28 + minValAdd + minAdmin;
        const minInterpersonal = minPoints.interpersonalSkills || 0;
        const minGrandTotal = minTotal1to4 + minInterpersonal;

        const awdTeaching = teachingTotal || 0;
        const awdResearch21 = r21 || 0;
        const awdResearch22_28 = (researchTotal || 0) - awdResearch21;
        const awdValAdd = vData.valueAdditionTotal || 0;
        const awdAdmin = adminData.adminTotal || 0;
        const rawTotal1to4 = awdTeaching + awdResearch21 + awdResearch22_28 + awdValAdd + awdAdmin;
        const awdTotal1to4 = Math.min(200, rawTotal1to4);
        const awdInterpersonal = data.hodEvaluation?.interpersonalRatings?.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) || 0;
        const awdGrandTotal = awdTotal1to4 + awdInterpersonal;

        return (
          <div style={{ pageBreakInside: 'avoid', marginTop: '30px', pageBreakBefore: 'always' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '10px' }}>
              6. Minimum Points Summary
            </div>
            <table style={styles.table}>
              <thead style={{ display: 'table-header-group' }}>
                <tr style={{ ...styles.tr, backgroundColor: '#f0f0f0' }}>
                  <th style={{ ...styles.th, whiteSpace: 'nowrap', width: '50px' }}>S. No</th>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Metrics</th>
                  <th style={styles.th}>Max Score</th>
                  <th style={styles.th}>Minimum points for {facultyCategory}</th>
                  <th style={styles.th}>Points Awarded</th>
                </tr>
              </thead>
              <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
                <tr style={styles.tr}>
                  <td style={styles.td}>1</td>
                  <td style={styles.tdLeft}>Teaching</td>
                  <td style={styles.td}>80</td>
                  <td style={styles.td}>{minTeaching}</td>
                  <td style={styles.td}>{awdTeaching.toFixed(2)}</td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.td} rowSpan={3}>2</td>
                  <td style={styles.tdLeft} colSpan={4}>Research</td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdLeft}>2.1 Paper publication</td>
                  <td style={styles.td} rowSpan={2}>80*</td>
                  <td style={styles.td}>{minResearch21}</td>
                  <td style={styles.td}>{awdResearch21.toFixed(2)}</td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.tdLeft}>2.2 to 2.8</td>
                  <td style={styles.td}>{minResearch22_28}</td>
                  <td style={styles.td}>{awdResearch22_28.toFixed(2)}</td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.td}>3</td>
                  <td style={styles.tdLeft}>Value addition</td>
                  <td style={styles.td}>20</td>
                  <td style={styles.td}>{minValAdd}</td>
                  <td style={styles.td}>{awdValAdd.toFixed(2)}</td>
                </tr>
                <tr style={styles.tr}>
                  <td style={styles.td}>4</td>
                  <td style={styles.tdLeft}>Administration</td>
                  <td style={styles.td}>20</td>
                  <td style={styles.td}>{minAdmin}</td>
                  <td style={styles.td}>{awdAdmin.toFixed(2)}</td>
                </tr>
                <tr style={{ ...styles.tr, fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                  <td style={styles.td} colSpan={2}>Total</td>
                  <td style={styles.td}>200</td>
                  <td style={styles.td}>{minTotal1to4}</td>
                  <td style={styles.td}>{awdTotal1to4.toFixed(2)}</td>
                </tr>
                {!hideInterpersonal && (
                  <>
                    <tr style={styles.tr}>
                      <td style={styles.td}>5</td>
                      <td style={styles.tdLeft}>Interpersonal skills</td>
                      <td style={styles.td}>50</td>
                      <td style={styles.td}>{minInterpersonal}</td>
                      <td style={styles.td}>{awdInterpersonal.toFixed(2)}</td>
                    </tr>
                    <tr style={{ ...styles.tr, fontWeight: 'bold', backgroundColor: '#e5e7eb' }}>
                      <td style={styles.td} colSpan={2}>Grand Total</td>
                      <td style={styles.td}>250</td>
                      <td style={styles.td}>{minGrandTotal}</td>
                      <td style={styles.td}>{awdGrandTotal.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* EVALUATION & STATUS */}
      {!hideInterpersonal && data.status !== "Submitted to HOD" && (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px', marginBottom: '5px', pageBreakAfter: 'avoid' }}>
            EVALUATION & STATUS
          </div>
          <table style={styles.table}>
            <tbody style={{ display: 'table-row-group', pageBreakInside: 'auto' }}>
              <tr style={styles.tr}>
                <td style={{ ...styles.td, ...styles.rowLabel, width: '30%' }}>Final Status</td>
                <td style={{ ...styles.tdLeft, fontWeight: 'bold' }}>{data.status}</td>
              </tr>
              {data.hodEvaluation?.comments && (
                <tr style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.rowLabel }}>Primary Evaluator / HOD Comments</td>
                  <td style={styles.tdLeft}>{data.hodEvaluation.comments}</td>
                </tr>
              )}
              {data.status?.startsWith('Approved by') && (
                <tr style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.rowLabel }}>{data.status.replace('Approved by ', '')} Comments</td>
                  <td style={styles.tdLeft}>{data.managementEvaluation?.comments || 'No remarks'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

AppraisalPDFReport.displayName = 'AppraisalPDFReport';
export default AppraisalPDFReport;
