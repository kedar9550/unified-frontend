import React, { forwardRef } from 'react';
import ausLogo from '../../assets/AUS Long Logo.png';

const AppraisalBriefPDFReport = forwardRef(({ data, hideInterpersonal, eligibilityDetails }, ref) => {
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
      marginBottom: '10px',
    },
    logo: {
      width: '350px',
      marginBottom: '5px',
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textDecoration: 'underline',
      marginBottom: '15px',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: 'bold',
      backgroundColor: '#f0f0f0',
      padding: '6px',
      border: '1px solid #000',
      marginTop: '15px',
      marginBottom: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse', // use collapse for tighter borders
      marginBottom: '15px',
      pageBreakInside: 'avoid',
    },
    th: {
      border: '1px solid #000',
      padding: '4px 6px',
      textAlign: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: '#fafafa',
    },
    td: {
      border: '1px solid #000',
      padding: '4px 6px',
      fontSize: '12px',
      textAlign: 'center'
    },
    tdLeft: {
      border: '1px solid #000',
      padding: '4px 6px',
      fontSize: '12px',
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

  const teaching = data.teaching || {};
  const { teachingTotal } = teaching;
  const rData = data.research || {};
  const { r21, researchTotal } = rData;
  const vData = data.valueAddition || {};
  const adminData = data.administrativeResponsibilities || {};

  return (
    <div ref={ref} style={styles.container}>
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 5mm 15mm 10mm 15mm; 
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `}
      </style>
      <div style={styles.header}>
        <img src={ausLogo} alt="Aditya University" style={styles.logo} />
        <div style={styles.title}>FACULTY APPRAISAL REPORT ({year})</div>
      </div>

      <div style={styles.sectionTitle}>PART A: PERSONAL INFORMATION</div>
      <table style={styles.table}>
        <tbody style={{ display: 'table-row-group' }}>
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
          <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '10px', marginBottom: '8px', color: '#002060' }}>Eligibility Status</div>
          <table style={styles.table}>
            <thead style={{ display: 'table-header-group' }}>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, width: '10%' }}>S.No</th>
                <th style={{ ...styles.th, width: '70%' }}>Eligibility Criteria</th>
                <th style={{ ...styles.th, width: '20%' }}>Status</th>
              </tr>
            </thead>
            <tbody style={{ display: 'table-row-group' }}>
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
          <div style={{ pageBreakInside: 'avoid', marginTop: '15px' }}>
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
              <tbody style={{ display: 'table-row-group' }}>
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
              </tbody>
            </table>
          </div>
        );
      })()}

      {!hideInterpersonal && data.status !== "Submitted to HOD" && (
        <div style={{ pageBreakInside: 'avoid', marginTop: '15px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>
            EVALUATION & STATUS
          </div>
          <table style={styles.table}>
            <tbody style={{ display: 'table-row-group' }}>
              <tr style={styles.tr}>
                <td style={{ ...styles.td, ...styles.rowLabel, width: '30%' }}>Final Status</td>
                <td style={{ ...styles.tdLeft, fontWeight: 'bold' }}>{data.status}</td>
              </tr>
              {data.hodEvaluation?.comments && (
                <tr style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.rowLabel }}>HOD Comments</td>
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
          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                {data.status?.startsWith('Approved by') ? `Signature of ${data.status.replace('Approved by ', '')}` : 'Signature of Final Evaluator'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AppraisalBriefPDFReport.displayName = 'AppraisalBriefPDFReport';
export default AppraisalBriefPDFReport;
