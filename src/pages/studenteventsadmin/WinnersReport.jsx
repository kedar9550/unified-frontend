import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Divider,
  Paper,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  WorkspacePremium as PremiumIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  QrCode as QrCodeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/data/DataTable';
import { PageContainer, EmptyState } from '../../components/common/design-system';
import StatCard from '../../components/common/StatCard';
import StatCardGrid from '../../components/common/StatCardGrid';
import API from '../../api/axios';
import { fetchEventDepartments } from '../../api/eventDepartmentApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import EventPassCard from '../../components/EventPass/EventPassCard';

const WinnersReport = () => {
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPassParticipant, setSelectedPassParticipant] = useState(null);
  const [passDialogOpen, setPassDialogOpen] = useState(false);

  const [allEvents, setAllEvents] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsToView, setDepartmentsToView] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [prizeFilter, setPrizeFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [branchMap, setBranchMap] = useState({});

  const fetchWinners = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, deptsRes] = await Promise.all([
        API.get('/api/events'),
        fetchEventDepartments().catch(() => ({ data: { departments: [] } })),
      ]);
      const fetchedEvents = eventsRes.data?.events || [];
      const fetchedDepts = deptsRes.data?.departments || [];
      setAllEvents(fetchedEvents);
      setAllDepartments(fetchedDepts);

      let allowedEventNames = null;
      if (activeRole === 'FACULTY_COORDINATOR' && user) {
        const userEvents = fetchedEvents.filter(e => {
          const coords = e.facultyCoordinators || (e.facultyCoordinator ? [e.facultyCoordinator] : []);
          return coords.some(c =>
            c.employeeId === user.institutionId ||
            c.employeeId === user.employeeId ||
            c.employeeId === user.employeeCode
          );
        });
        allowedEventNames = userEvents.map(e => e.eventName);
      }

      // Query razorpay registrations with winnersOnly filter
      const response = await API.get('/api/razorpay/registrations?winnersOnly=true');
      let fetchedPayments = response.data?.payments || [];

      fetchedPayments = fetchedPayments.filter(p => {
        const isPaid = p.paymentStatus === 'PAID' || p.verified === true;
        const isWinner = p.isFirstWinner || p.isSecondWinner || p.isThirdWinner;
        return isPaid && isWinner;
      });

      if (allowedEventNames) {
        fetchedPayments = fetchedPayments.filter(p => allowedEventNames.includes(p.eventName || p.category));
      }

      fetchedPayments = fetchedPayments.map(p => {
        const eventMatch = fetchedEvents.find(e => e.eventName === (p.eventName || p.category));
        return {
          ...p,
          venue: eventMatch ? (
            eventMatch.venueType === 'Indoor' && eventMatch.building && eventMatch.floor
              ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.building.name || eventMatch.building} - ${eventMatch.floor.name || eventMatch.floor}`
              : eventMatch.venueType === 'Outdoor' && eventMatch.ground
                ? `${eventMatch.roomNo ? `Room No: ${eventMatch.roomNo}, ` : ''}${eventMatch.ground.name || eventMatch.ground}`
                : eventMatch.venue
          ) : null,
          eventGroup: eventMatch?.group?.name || eventMatch?.group || '-',
          eventCategory: eventMatch?.category?.name || eventMatch?.category || p.category || '-',
          eventSchool: eventMatch?.eventSchool?.name || p.category || p.schoolId || '-'
        };
      });

      setPayments(fetchedPayments);

      // Branch resolution for rolls missing branch
      const missingRolls = new Set();
      fetchedPayments.forEach(pay => {
        if (Array.isArray(pay.participants)) {
          pay.participants.forEach(p => {
            if (!p.branch && p.roll && p.roll.length > 5 && (!p.college || p.college.toLowerCase().includes('aditya'))) {
              missingRolls.add(p.roll.toUpperCase());
            }
          });
        }
      });

      if (missingRolls.size > 0) {
        const rollsToFetch = Array.from(missingRolls);
        rollsToFetch.forEach(async (roll) => {
          try {
            const res = await API.get(`/api/razorpay/registrations/branch/${roll}`);
            const data = res.data;
            let branch = null;
            const studentObj = Array.isArray(data) && data.length > 0 ? data[0] : (data?.value && Array.isArray(data.value) && data.value.length > 0 ? data.value[0] : (data && typeof data === 'object' ? data : null));
            if (studentObj) {
              branch = studentObj.branch || studentObj.branch_name || studentObj.branchName || studentObj.BRANCH;
            }
            if (branch) {
              setBranchMap(prev => ({ ...prev, [roll]: String(branch).trim() }));
            }
          } catch (err) {
            console.error(`Failed to fetch branch for ${roll}`, err);
          }
        });
      }

    } catch (error) {
      console.error('Error fetching winners report:', error);
      toast.error(error.response?.data?.message || 'Failed to load winners report');
    } finally {
      setLoading(false);
    }
  }, [activeRole, user]);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  const deptLookupMap = useMemo(() => {
    const map = {};
    allDepartments.forEach(d => {
      if (d && d.name) {
        const canonical = d.name.trim();
        map[canonical.toUpperCase()] = canonical;
        if (d.alternativeNames) {
          d.alternativeNames.split(',').forEach(alt => {
            const cleanAlt = alt.trim().toUpperCase();
            if (cleanAlt) {
              map[cleanAlt] = canonical;
            }
          });
        }
      }
    });
    return map;
  }, [allDepartments]);

  const resolveStudentDepartment = useCallback((p) => {
    if (!p) return '';
    const rawDept = String(p.department || '').trim();
    if (rawDept && deptLookupMap[rawDept.toUpperCase()]) {
      return deptLookupMap[rawDept.toUpperCase()];
    }
    if (rawDept) return rawDept;

    const rawBranch = String(p.computedBranch || p.branch || '').trim();
    if (rawBranch && deptLookupMap[rawBranch.toUpperCase()]) {
      return deptLookupMap[rawBranch.toUpperCase()];
    }
    return rawBranch || '';
  }, [deptLookupMap]);

  // Transform each payment into a winning team record
  const winningTeams = useMemo(() => {
    return payments.map(payment => {
      const participants = Array.isArray(payment.participants) ? payment.participants.map((p, idx) => ({
        ...p,
        id: `${payment._id || payment.receipt}-${idx}`,
        computedBranch: p.branch || branchMap[p.roll?.toUpperCase()] || '',
        resolvedDept: resolveStudentDepartment({ ...p, computedBranch: p.branch || branchMap[p.roll?.toUpperCase()] || '' })
      })) : [];

      let prizeType = 'None';
      let prizeRank = 99;
      if (payment.isFirstWinner) {
        prizeType = 'First Prize';
        prizeRank = 1;
      } else if (payment.isSecondWinner) {
        prizeType = 'Second Prize';
        prizeRank = 2;
      } else if (payment.isThirdWinner) {
        prizeType = 'Third Prize';
        prizeRank = 3;
      }

      const attendedCount = participants.filter(p => p.attended).length;

      return {
        ...payment,
        prizeType,
        prizeRank,
        participants,
        attendedCount,
        totalMembers: participants.length || payment.teamSize || 1,
      };
    }).sort((a, b) => {
      // Sort by Prize Rank (1st, then 2nd, then 3rd) then eventName
      if (a.prizeRank !== b.prizeRank) return a.prizeRank - b.prizeRank;
      return (a.eventName || '').localeCompare(b.eventName || '');
    });
  }, [payments, branchMap, resolveStudentDepartment]);

  const uniqueEvents = useMemo(() => {
    const eventsSet = new Set();
    winningTeams.forEach(t => {
      if (t.eventName) eventsSet.add(t.eventName);
    });
    return Array.from(eventsSet).sort();
  }, [winningTeams]);

  const uniqueSchools = useMemo(() => {
    const set = new Set();
    winningTeams.forEach(t => {
      const school = t.eventSchool || t.category || t.schoolId;
      if (school && school !== '-') set.add(school);
    });
    return Array.from(set).sort();
  }, [winningTeams]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    allDepartments.forEach(d => {
      if (d?.name) set.add(d.name.trim());
    });
    winningTeams.forEach(t => {
      t.participants.forEach(p => {
        if (p.resolvedDept) set.add(p.resolvedDept);
      });
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allDepartments, winningTeams]);

  const filteredTeams = useMemo(() => {
    return winningTeams.filter(t => {
      if (prizeFilter === 'FIRST' && !t.isFirstWinner) return false;
      if (prizeFilter === 'SECOND' && !t.isSecondWinner) return false;
      if (prizeFilter === 'THIRD' && !t.isThirdWinner) return false;

      if (eventFilter !== 'ALL' && t.eventName !== eventFilter) return false;

      if (schoolFilter !== 'ALL') {
        const schoolCategory = t.eventSchool || t.category || t.schoolId;
        if (schoolCategory !== schoolFilter) return false;
      }

      if (departmentFilter !== 'ALL') {
        const hasDept = t.participants.some(p => (p.resolvedDept || '').toUpperCase() === departmentFilter.toUpperCase());
        if (!hasDept) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const teamId = (t.teamId || '').toLowerCase();
        const receipt = (t.receipt || '').toLowerCase();
        const eventName = (t.eventName || '').toLowerCase();
        const school = (t.eventSchool || t.category || '').toLowerCase();

        const matchesTeam = teamId.includes(query) || receipt.includes(query) || eventName.includes(query) || school.includes(query);

        const matchesMember = t.participants.some(p => {
          const name = (p.name || '').toLowerCase();
          const roll = (p.roll || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          const mobile = (p.mobile || '').toLowerCase();
          const college = (p.college || '').toLowerCase();
          const dept = (p.resolvedDept || '').toLowerCase();
          return name.includes(query) || roll.includes(query) || email.includes(query) || mobile.includes(query) || college.includes(query) || dept.includes(query);
        });

        return matchesTeam || matchesMember;
      }

      return true;
    });
  }, [winningTeams, prizeFilter, eventFilter, schoolFilter, departmentFilter, searchQuery]);

  // Statistics
  const firstPrizeTeams = useMemo(() => winningTeams.filter(t => t.isFirstWinner).length, [winningTeams]);
  const secondPrizeTeams = useMemo(() => winningTeams.filter(t => t.isSecondWinner).length, [winningTeams]);
  const thirdPrizeTeams = useMemo(() => winningTeams.filter(t => t.isThirdWinner).length, [winningTeams]);
  const totalWinningParticipants = useMemo(() => {
    return winningTeams.reduce((acc, t) => acc + (t.participants?.length || 0), 0);
  }, [winningTeams]);

  // Export to Excel with xlsx-js-style
  const handleExportExcel = () => {
    if (filteredTeams.length === 0) {
      toast.error('No winning teams data to export.');
      return;
    }

    const headers = [
      'S.No', 'Prize Won', 'Team ID', 'Event Name', 'School Name', 'Event Department(s)',
      'Team Size', 'Participant Name', 'Roll No', 'Gender', 'College', 'Branch',
      'Student Department', 'Year', 'Mobile', 'Email', 'Attended'
    ];

    const colWidths = [
      { wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 22 }, { wch: 30 },
      { wch: 10 }, { wch: 26 }, { wch: 16 }, { wch: 10 }, { wch: 26 }, { wch: 16 },
      { wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 28 }, { wch: 12 }
    ];

    const applySheetStyles = (ws, headerColsCount, headerBgRgb = 'B45309') => {
      ws['!cols'] = colWidths;
      for (let c = 0; c < headerColsCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: headerBgRgb } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          };
        }
      }
    };

    const buildRowsForTeams = (teamsList) => {
      const rows = [];
      let sNo = 1;
      teamsList.forEach(t => {
        const schoolCategory = t.eventSchool || t.category || t.schoolId || '-';
        const relatedEvent = allEvents.find(e => e._id === t.eventId);
        let eventDeptStr = '-';
        if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
          eventDeptStr = relatedEvent.department.map(d => d.name).join(', ');
        }

        if (t.participants && t.participants.length > 0) {
          t.participants.forEach(p => {
            const collegeName = p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '');
            rows.push([
              sNo++,
              t.prizeType,
              t.teamId || t.receipt || '-',
              t.eventName || '-',
              schoolCategory,
              eventDeptStr,
              t.totalMembers,
              p.name || '',
              p.roll || '',
              p.gender || '',
              collegeName,
              p.computedBranch || p.branch || '',
              p.resolvedDept || '',
              p.year || '',
              p.mobile || '',
              p.email || '',
              p.attended ? 'Yes' : 'No'
            ]);
          });
        } else {
          rows.push([
            sNo++,
            t.prizeType,
            t.teamId || t.receipt || '-',
            t.eventName || '-',
            schoolCategory,
            eventDeptStr,
            t.totalMembers,
            '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'
          ]);
        }
      });
      return rows;
    };

    const workbook = XLSX.utils.book_new();

    // 1. Master Sheet: All Winners
    const allRows = [headers, ...buildRowsForTeams(filteredTeams)];
    const allWs = XLSX.utils.aoa_to_sheet(allRows);
    applySheetStyles(allWs, headers.length, 'B45309'); // Rich bronze/gold header
    XLSX.utils.book_append_sheet(workbook, allWs, 'All Winners');

    // 2. 1st Prize Winners Sheet
    const firstTeams = filteredTeams.filter(t => t.isFirstWinner);
    if (firstTeams.length > 0) {
      const firstRows = [headers, ...buildRowsForTeams(firstTeams)];
      const firstWs = XLSX.utils.aoa_to_sheet(firstRows);
      applySheetStyles(firstWs, headers.length, 'CA8A04'); // Gold
      XLSX.utils.book_append_sheet(workbook, firstWs, '1st Prize Winners');
    }

    // 3. 2nd Prize Winners Sheet
    const secondTeams = filteredTeams.filter(t => t.isSecondWinner);
    if (secondTeams.length > 0) {
      const secondRows = [headers, ...buildRowsForTeams(secondTeams)];
      const secondWs = XLSX.utils.aoa_to_sheet(secondRows);
      applySheetStyles(secondWs, headers.length, '475569'); // Silver/Slate
      XLSX.utils.book_append_sheet(workbook, secondWs, '2nd Prize Winners');
    }

    // 4. 3rd Prize Winners Sheet
    const thirdTeams = filteredTeams.filter(t => t.isThirdWinner);
    if (thirdTeams.length > 0) {
      const thirdRows = [headers, ...buildRowsForTeams(thirdTeams)];
      const thirdWs = XLSX.utils.aoa_to_sheet(thirdRows);
      applySheetStyles(thirdWs, headers.length, '92400E'); // Bronze
      XLSX.utils.book_append_sheet(workbook, thirdWs, '3rd Prize Winners');
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `VEDA_Winners_Report_${dateStr}.xlsx`);
    toast.success(`Winners report exported successfully (${filteredTeams.length} teams)`);
  };

  const getPrizeChip = (prizeType) => {
    switch (prizeType) {
      case 'First Prize':
        return (
          <Chip
            icon={<TrophyIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="1st Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
            }}
          />
        );
      case 'Second Prize':
        return (
          <Chip
            icon={<MedalIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="2nd Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(100, 116, 139, 0.35)',
            }}
          />
        );
      case 'Third Prize':
        return (
          <Chip
            icon={<MedalIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label="3rd Prize"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              px: 0.5,
              background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(146, 64, 14, 0.35)',
            }}
          />
        );
      default:
        return <Chip label="Participant" size="small" />;
    }
  };

  const columns = [
    'S.No',
    'Prize',
    'Team ID',
    'Event Name',
    'School Name',
    'Department(s)',
    'Team Members & Details',
    'Attendance',
    'Actions'
  ];

  const handleOpenTeam = (team) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  const handleOpenPass = (participant, team) => {
    setSelectedPassParticipant({
      ...participant,
      eventName: team.eventName,
      teamId: team.teamId,
      receipt: team.receipt,
      eventSchool: team.eventSchool,
      category: team.category,
      eventId: team.eventId
    });
    setPassDialogOpen(true);
  };

  const rows = filteredTeams.map((team, index) => {
    const schoolCategory = team.eventSchool || team.category || team.schoolId || '-';
    const relatedEvent = allEvents.find(e => e._id === team.eventId);
    let departmentNode = '-';
    if (relatedEvent && relatedEvent.department && relatedEvent.department.length > 0) {
      if (relatedEvent.department.length > 1) {
        departmentNode = {
          value: 'All Departments',
          display: (
            <span
              style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => {
                setDepartmentsToView(relatedEvent.department);
                setDepartmentsDialogOpen(true);
              }}
            >
              All Departments
            </span>
          )
        };
      } else {
        departmentNode = relatedEvent.department[0].name;
      }
    }

    const attendancePercentage = team.totalMembers > 0
      ? Math.round((team.attendedCount / team.totalMembers) * 100)
      : 0;

    return [
      index + 1,
      {
        value: team.prizeType,
        display: getPrizeChip(team.prizeType),
      },
      {
        value: team.teamId || team.receipt || '-',
        display: (
          <Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e293b' }}>
              {team.teamId || team.receipt || '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Size: {team.totalMembers} Member{team.totalMembers > 1 ? 's' : ''}
            </Typography>
          </Box>
        )
      },
      team.eventName || '-',
      schoolCategory,
      departmentNode,
      {
        value: team.participants.map(p => p.name).join(', '),
        display: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, maxWidth: 360 }}>
            {team.participants.map((p, pIdx) => (
              <Box
                key={pIdx}
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'action.hover',
                  border: '1px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {p.name || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Roll: <strong>{p.roll || '-'}</strong> | {p.college || '-'}
                  </Typography>
                  {p.resolvedDept && (
                    <Typography variant="caption" color="text.secondary">
                      Dept: {p.resolvedDept} {p.year ? `(${p.year} Yr)` : ''}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Chip
                    label={p.attended ? 'Attended' : 'Absent'}
                    color={p.attended ? 'success' : 'default'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleOpenPass(p, team)}
                    sx={{ p: 0.25, color: '#059669' }}
                    title="View Pass"
                  >
                    <QrCodeIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )
      },
      {
        value: `${team.attendedCount}/${team.totalMembers}`,
        display: (
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label={`${team.attendedCount} / ${team.totalMembers} Attended`}
              color={attendancePercentage === 100 ? 'success' : attendancePercentage > 0 ? 'warning' : 'default'}
              size="small"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
              {attendancePercentage}% Attended
            </Typography>
          </Box>
        )
      },
      {
        value: 'Actions',
        display: (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="View Full Team Details">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => handleOpenTeam(team)}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                  borderColor: '#3b82f6',
                  color: '#2563eb',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.08)' }
                }}
              >
                Team Info
              </Button>
            </Tooltip>
          </Box>
        )
      }
    ];
  });

  return (
    <PageContainer>
      <PageHeader
        title="Winners Report"
        subtitle="Team-wise report of 1st, 2nd, and 3rd prize winners across all events"
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={fetchWinners}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 2.5,
                py: 1,
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' }
              }}
            >
              Refresh
            </Button>
          </Box>
        }
      />

      {/* Top Navigation Tabs Switcher */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          mb: 3,
          p: 0.75,
          bgcolor: 'var(--bg-panel, #ffffff)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
          width: 'fit-content',
        }}
      >
        <Button
          variant="text"
          startIcon={<GroupsIcon />}
          onClick={() => navigate('/Eventveda/participants/all')}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            py: 0.75,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          All Participants
        </Button>
        <Button
          variant="text"
          startIcon={<AssignmentTurnedInIcon />}
          onClick={() => navigate('/Eventveda/participants/attendance-report')}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            py: 0.75,
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover', color: '#16a34a' }
          }}
        >
          Attendance Report
        </Button>
        <Button
          variant="contained"
          startIcon={<TrophyIcon />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.2,
            py: 0.75,
            bgcolor: '#f59e0b',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            '&:hover': { bgcolor: '#d97706' }
          }}
        >
          Winners Report ({winningTeams.length})
        </Button>
      </Box>

      {/* Summary Cards */}
      <StatCardGrid sx={{ mt: 1, mb: 3 }}>
        <StatCard
          title="Total Winning Teams"
          value={winningTeams.length}
          color="#f59e0b"
          icon={<TrophyIcon />}
        />
        <StatCard
          title="1st Prize Teams"
          value={firstPrizeTeams}
          color="#eab308"
          icon={<TrophyIcon />}
        />
        <StatCard
          title="2nd Prize Teams"
          value={secondPrizeTeams}
          color="#64748b"
          icon={<MedalIcon />}
        />
        <StatCard
          title="3rd Prize Teams"
          value={thirdPrizeTeams}
          color="#b45309"
          icon={<MedalIcon />}
        />
        <StatCard
          title="Winning Participants"
          value={totalWinningParticipants}
          color="#0284c7"
          icon={<PeopleIcon />}
        />
      </StatCardGrid>

      {/* Filter Controls Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-panel, #ffffff)',
        }}
      >
        <TextField
          placeholder="Search by team ID, participant, event, college..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 }, flex: { sm: 1 } }}
        />

        <TextField
          select
          label="Filter Prize"
          size="small"
          value={prizeFilter}
          onChange={(e) => setPrizeFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 170 } }}
        >
          <MenuItem value="ALL">All Prizes</MenuItem>
          <MenuItem value="FIRST">🥇 1st Prize</MenuItem>
          <MenuItem value="SECOND">🥈 2nd Prize</MenuItem>
          <MenuItem value="THIRD">🥉 3rd Prize</MenuItem>
        </TextField>

        <TextField
          select
          label="Filter Event"
          size="small"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 200 } }}
        >
          <MenuItem value="ALL">All Events</MenuItem>
          {uniqueEvents.map((evt) => (
            <MenuItem key={evt} value={evt}>
              {evt}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter School"
          size="small"
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 170 } }}
        >
          <MenuItem value="ALL">All Schools</MenuItem>
          {uniqueSchools.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter Dept"
          size="small"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 160 } }}
        >
          <MenuItem value="ALL">All Depts</MenuItem>
          {uniqueDepartments.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            startIcon={<DownloadIcon />}
            disabled={filteredTeams.length === 0}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 2.5,
              py: 0.8,
              fontWeight: 700,
              width: { xs: '100%', sm: 'auto' },
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
              },
              '&.Mui-disabled': {
                background: 'rgba(148, 163, 184, 0.12)',
                color: 'var(--text-secondary, #64748b)',
                opacity: 0.5,
              },
            }}
          >
            Download Excel ({filteredTeams.length})
          </Button>
        </Box>
      </Paper>

      {/* DataTable */}
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
          <CircularProgress size={36} color="warning" />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredTeams.length === 0 ? (
            <EmptyState
              title="No Winning Teams Found"
              description="No teams matching the selected prize or filter criteria were found."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              nonSortableColumns={[0, 6, 8]}
              alignments={['center', 'center', 'left', 'left', 'left', 'left', 'left', 'center', 'center']}
            />
          )}
        </Box>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { borderRadius: '20px', overflow: 'hidden' },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrophyIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Winning Team Details ({selectedTeam.teamId || selectedTeam.receipt})
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDialogOpen(false)}
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3, background: 'var(--bg-panel, #ffffff)' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedTeam.eventName || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  School: <strong>{selectedTeam.eventSchool || selectedTeam.category || '-'}</strong> | Team Size: <strong>{selectedTeam.totalMembers}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {getPrizeChip(selectedTeam.prizeType)}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'var(--text-primary)' }}>
              Team Participants ({selectedTeam.participants.length})
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>College</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch & Dept</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Attended</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Pass</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTeam.participants.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{p.name || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{p.roll || '-'}</TableCell>
                      <TableCell>{p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-')}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {p.computedBranch ? `Branch: ${p.computedBranch}` : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.resolvedDept ? `Dept: ${p.resolvedDept}` : ''} {p.year ? `(${p.year} Yr)` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>{p.mobile || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.email || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={p.attended ? 'Yes' : 'No'}
                          color={p.attended ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton size="small" onClick={() => handleOpenPass(p, selectedTeam)} sx={{ color: '#059669' }}>
                          <QrCodeIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions sx={{ p: 2, px: 3 }}>
            <Button variant="contained" onClick={() => setDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Pass Modal */}
      {selectedPassParticipant && (
        <Dialog
          open={passDialogOpen}
          onClose={() => setPassDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '20px', overflow: 'hidden' },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BadgeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
                Event Pass (Winner Member)
              </Typography>
            </Box>
            <IconButton
              onClick={() => setPassDialogOpen(false)}
              sx={{ color: '#cbd5e1', '&:hover': { color: '#fff' } }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4, background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <EventPassCard participant={selectedPassParticipant} />
          </DialogContent>
        </Dialog>
      )}

      {/* Departments Modal */}
      <Dialog open={departmentsDialogOpen} onClose={() => setDepartmentsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>All Departments</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
            {departmentsToView.map((d, i) => (
              <Chip key={i} label={d?.name || d} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentsDialogOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default WinnersReport;
