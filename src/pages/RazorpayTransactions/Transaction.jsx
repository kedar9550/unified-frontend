import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
    Box, Typography, TextField, Button, Grid, Paper, Chip, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    Dialog, DialogTitle, DialogContent, IconButton, CircularProgress, Alert, Tooltip, Stack,
    InputAdornment
} from '@mui/material';
import {
    Search, Smartphone, CreditCard, Building2, Download, ShieldAlert, ChevronDown,
    Calendar, Mail, Phone, FileText, X, Wallet, CheckCircle2, XCircle, Clock, RotateCcw
} from 'lucide-react';
import DataTable from '../../components/data/DataTable';
import PageContainer from '../../components/common/design-system/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import CountBand from '../../components/common/design-system/CountBand';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReplayIcon from '@mui/icons-material/Replay';

// MUI style classes mapping
const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case 'CAPTURED': case 'SUCCESS': return 'success';
        case 'FAILED': return 'error';
        case 'PENDING': case 'AUTHORIZED': return 'warning';
        case 'REFUNDED': return 'info';
        default: return 'default';
    }
};

const getMethodIcon = (method) => {
    switch (method?.toUpperCase()) {
        case 'UPI': return <Smartphone size={14} />;
        case 'CARD': return <CreditCard size={14} />;
        case 'WALLET': return <Wallet size={14} />;
        case 'NETBANKING': return <Building2 size={14} />;
        default: return <CreditCard size={14} />;
    }
};

export default function Transactions({ initialStatusFilter = 'All', activeTab = 'transactions' }) {
    const { user, token } = useAuth();

    // Default to today (2026-09-28)
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    const [fromDate, setFromDate] = useState(getTodayString());
    const [toDate, setToDate] = useState(getTodayString());
    const [activePreset, setActivePreset] = useState('');

    const [transactionStatusFilter, setTransactionStatusFilter] = useState(initialStatusFilter);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [transactionsList, setTransactionsList] = useState([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        totalAmount: 0,
        totalFee: 0,
        totalTax: 0,
        totalRefunds: 0,
        netAmount: 0
    });
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedJsonModal, setSelectedJsonModal] = useState(null);

    const isSuperAdmin = user?.role === 'superadmin' || user?.email?.toLowerCase() === 'prime@adityauniversity.in';

    // Fetch Razorpay statement for given date range
    const fetchRazorpayStatement = async (start = fromDate, end = toDate) => {
        setLoading(true);
        setErrorMsg(null);
        setHasFetched(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await API.get(`/api/payments/razorpay?fromDate=${start}&toDate=${end}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = res.data;
            if (data.success) {
                setTransactionsList(data.payments || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
            } else {
                setErrorMsg(data.message || 'Failed to fetch Razorpay transactions');
                setTransactionsList([]);
                setSummary({
                    totalTransactions: 0,
                    totalAmount: 0,
                    totalFee: 0,
                    totalTax: 0,
                    totalRefunds: 0,
                    netAmount: 0
                });
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Fetch statement error:', err);
            if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
                setErrorMsg('Request timed out. Please select a shorter date range or retry.');
            } else {
                setErrorMsg(err.response?.data?.message || err.message || 'Network error connecting to backend API');
            }
            setTransactionsList([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial load - disabled default fetch
    useEffect(() => {
        // Fetching is disabled until user explicitly selects a date range
    }, [token]);

    // Quick Date Presets
    const handlePresetChange = (preset) => {
        setActivePreset(preset);
        if (preset === 'custom') return;
        if (preset === '') {
            setFromDate('');
            setToDate('');
            setCurrentPage(1);
            setHasFetched(false);
            setTransactionsList([]); // Clear data locally without hitting the server
            setSummary({
                totalTransactions: 0,
                totalAmount: 0,
                totalFee: 0,
                totalTax: 0,
                totalRefunds: 0,
                netAmount: 0
            });
            return;
        }
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (preset === 'today') {
            // start & end are today
        } else if (preset === 'yesterday') {
            start.setDate(today.getDate() - 1);
            end.setDate(today.getDate() - 1);
        } else if (preset === '7days') {
            start.setDate(today.getDate() - 6);
        } else if (preset === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        const formatD = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const startStr = formatD(start);
        const endStr = formatD(end);

        setFromDate(startStr);
        setToDate(endStr);
        setCurrentPage(1);
        fetchRazorpayStatement(startStr, endStr);
    };

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [transactionStatusFilter, fromDate, toDate, rowsPerPage]);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactionsList.filter((tx) => {
            // Status match
            let matchesStatus = true;
            if (transactionStatusFilter !== 'All') {
                const filterUpper = transactionStatusFilter.toUpperCase();
                const txStatusUpper = (tx.status || '').toUpperCase();
                if (filterUpper === 'SUCCESS' || filterUpper === 'CAPTURED') {
                    matchesStatus = txStatusUpper === 'CAPTURED' || txStatusUpper === 'SUCCESS';
                } else if (filterUpper === 'PENDING') {
                    matchesStatus = txStatusUpper === 'PENDING' || txStatusUpper === 'AUTHORIZED';
                } else if (filterUpper === 'FAILED') {
                    matchesStatus = txStatusUpper === 'FAILED';
                } else if (filterUpper === 'REFUNDED') {
                    matchesStatus = txStatusUpper === 'REFUNDED';
                }
            }

            return matchesStatus;
        });
    }, [transactionsList, transactionStatusFilter]);

    // Recalculate dynamic summary if filtered by search or status
    const displaySummary = useMemo(() => {
        if (transactionStatusFilter === 'All') {
            return summary;
        }
        let totalAmt = 0;
        let totalF = 0;
        let totalT = 0;
        let totalR = 0;
        filteredTransactions.forEach(tx => {
            totalAmt += tx.amount || 0;
            totalF += tx.fee || 0;
            totalT += tx.tax || 0;
            totalR += tx.refundAmount || 0;
        });
        const net = totalAmt - totalF;
        return {
            totalTransactions: filteredTransactions.length,
            totalAmount: Number(totalAmt.toFixed(2)),
            totalFee: Number(totalF.toFixed(2)),
            totalTax: Number(totalT.toFixed(2)),
            totalRefunds: Number(totalR.toFixed(2)),
            netAmount: Number(net.toFixed(2))
        };
    }, [filteredTransactions, summary, transactionStatusFilter]);

    const formattedRows = useMemo(() => {
        return filteredTransactions.map((tx, idx) => [
            { display: <Typography variant="body2" sx={{ color: 'text.secondary' }}>{idx + 1}</Typography>, value: idx + 1 },
            { display: <Box sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{tx.createdAt}</Box>, value: tx.createdAt },
            {
                display: (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }} onClick={() => setSelectedJsonModal(tx)}>
                            {tx.paymentId}
                        </Typography>
                        {tx.orderId !== 'N/A' && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{tx.orderId}</Typography>}
                    </Box>
                ),
                value: `${tx.paymentId || ''} ${tx.orderId !== 'N/A' ? tx.orderId : ''}`
            },
            {
                display: (
                    <Box>
                        {tx.customerEmail !== 'N/A' && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Mail size={12} color="#38bdf8" /><Typography variant="caption">{tx.customerEmail}</Typography></Box>}
                        {tx.customerPhone !== 'N/A' && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}><Phone size={12} color="#34d399" /><Typography variant="caption">{tx.customerPhone}</Typography></Box>}
                        {tx.customerEmail === 'N/A' && tx.customerPhone === 'N/A' && <Typography variant="caption" color="text.secondary">N/A</Typography>}
                    </Box>
                ),
                value: `${tx.customerEmail !== 'N/A' ? tx.customerEmail : ''} ${tx.customerPhone !== 'N/A' ? tx.customerPhone : ''}`
            },
            {
                display: (
                    <Box sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Tooltip title={tx.description}><Typography variant="body2">{tx.description}</Typography></Tooltip>
                    </Box>
                ),
                value: tx.description
            },
            {
                display: <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>,
                value: tx.amount
            },
            {
                display: <Chip size="small" label={tx.status} color={getStatusColor(tx.status)} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />,
                value: tx.status
            },
            {
                display: (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {getMethodIcon(tx.method)}
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{tx.method}</Typography>
                        </Box>
                        {tx.methodDetail && <Typography variant="caption" display="block" color="text.secondary">{tx.methodDetail}</Typography>}
                        {tx.rrn && <Typography variant="caption" display="block" color="text.secondary">RRN: {tx.rrn}</Typography>}
                    </Box>
                ),
                value: `${tx.method || ''} ${tx.methodDetail || ''} ${tx.rrn || ''}`
            },
            {
                display: (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0284c7' }}>₹{tx.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">Fee: ₹{tx.fee.toFixed(2)} | Tax: ₹{tx.tax.toFixed(2)}</Typography>
                    </Box>
                ),
                value: tx.netAmount
            },
            {
                display: (
                    <IconButton size="small" onClick={() => setSelectedJsonModal(tx)} color="primary">
                        <FileText size={18} />
                    </IconButton>
                ),
                value: 'Action'
            }
        ]);
    }, [filteredTransactions]);

    // CSV / Excel Export Handler (exports ALL filtered transactions matching date range)
    const exportData = (format) => {
        if (filteredTransactions.length === 0) return;

        const headers = [
            'S.NO',
            'DATE & TIME',
            'PAYMENT ID',
            'ORDER ID',
            'CUSTOMER EMAIL',
            'CUSTOMER PHONE',
            'DESCRIPTION',
            'AMOUNT (INR)',
            'STATUS',
            'METHOD',
            'METHOD DETAIL',
            'FEE (INR)',
            'TAX (INR)',
            'NET AMOUNT (INR)',
            'RRN'
        ];

        const rows = filteredTransactions.map((tx, idx) => [
            idx + 1,
            `"${tx.createdAt}"`,
            `"${tx.paymentId}"`,
            `"${tx.orderId}"`,
            `"${tx.customerEmail}"`,
            `"${tx.customerPhone}"`,
            `"${tx.description}"`,
            tx.amount.toFixed(2),
            tx.status,
            tx.method,
            `"${tx.methodDetail}"`,
            tx.fee.toFixed(2),
            tx.tax.toFixed(2),
            tx.netAmount.toFixed(2),
            `"${tx.rrn}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = format === 'excel' ? 'xlsx' : 'csv';
        link.setAttribute('download', `Razorpay_Statement_${fromDate}_to_${toDate}.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper functions moved outside component
    return (
        <PageContainer>
            {/* Header Row */}
            <PageHeader
                title="Razorpay Payment Tracking"
                subtitle="Viewing live Razorpay gateway statement and payment transaction records"
                icon={<CreditCard />}
            />

            {/* Summary Stat Cards Band */}
            <Box sx={{ mb: 4, mt: 1, overflowX: 'auto', pb: 1 }}>
                <CountBand
                    items={[
                        {
                            id: 'txns',
                            color: 'slate',
                            icon: <ReceiptLongIcon />,
                            title: 'Transactions',
                            value: displaySummary.totalTransactions
                        },
                        {
                            id: 'total',
                            color: 'primary',
                            icon: <AccountBalanceWalletIcon />,
                            title: 'Total Amount',
                            value: `₹${displaySummary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        },
                        {
                            id: 'fee',
                            color: 'danger',
                            icon: <MoneyOffIcon />,
                            title: 'Razorpay Fee',
                            value: `₹${displaySummary.totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        },
                        {
                            id: 'tax',
                            color: 'warning',
                            icon: <AccountBalanceIcon />,
                            title: 'Tax',
                            value: `₹${displaySummary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        },
                        {
                            id: 'refunds',
                            color: 'slate',
                            icon: <ReplayIcon />,
                            title: 'Refunds',
                            value: `₹${displaySummary.totalRefunds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        }
                    ]}
                    total={{
                        title: 'Net Amount',
                        value: `₹${displaySummary.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    }}
                />
            </Box>

            {/* Select Date Range & Filter Card */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{
                        width: 20,
                        height: 20,
                        background: "var(--gradient-primary)",
                        WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'/%3E%3C/svg%3E")`,
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        WebkitMaskSize: "contain",
                        maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'/%3E%3C/svg%3E")`,
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        maskSize: "contain"
                    }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Filter & Search</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', gap: 2, mb: 1 }}>
                    <TextField
                        select
                        label="Status"
                        size="small"
                        value={transactionStatusFilter}
                        onChange={(e) => setTransactionStatusFilter(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="Captured">Captured</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Failed">Failed</MenuItem>
                        <MenuItem value="Refunded">Refunded</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Select Range"
                        size="small"
                        value={activePreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="yesterday">Yesterday</MenuItem>
                        <MenuItem value="7days">Last 7 Days</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                    </TextField>

                    {activePreset === 'custom' && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                            <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                                <TextField
                                    label="From Date"
                                    type="date"
                                    size="small"
                                    value={fromDate}
                                    onChange={(e) => { setFromDate(e.target.value); setActivePreset('custom'); }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="To Date"
                                    type="date"
                                    size="small"
                                    value={toDate}
                                    onChange={(e) => { setToDate(e.target.value); setActivePreset('custom'); }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                            {(fromDate && toDate) && (
                                <Button
                                    variant="contained"
                                    disabled={loading}
                                    onClick={() => { setCurrentPage(1); fetchRazorpayStatement(fromDate, toDate); }}
                                    startIcon={loading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <FileText size={16} />}
                                    sx={{
                                        height: 40,
                                        borderRadius: '50px',
                                        width: { xs: '100%', sm: 'auto' },
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        px: 3,
                                        background: 'var(--gradient-primary)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        '&:hover': {
                                            background: 'var(--gradient-primary)',
                                            filter: 'brightness(1.1)',
                                        },
                                        '&.Mui-disabled': {
                                            background: '#e2e8f0',
                                            color: '#94a3b8',
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    {loading ? 'Fetching...' : 'Get Statement'}
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Table Section */}
            <Box sx={{ mt: 2 }}>
                {loading ? (
                    <Paper elevation={0} sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider' }}>
                        <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
                        <Typography sx={{ color: 'text.secondary' }}>Fetching live Razorpay transactions...</Typography>
                    </Paper>
                ) : errorMsg ? (
                    <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider' }}>
                        <ShieldAlert size={40} style={{ color: '#ef4444', marginBottom: 16 }} />
                        <Typography color="error" sx={{ mb: 2, fontWeight: 500 }}>{errorMsg}</Typography>
                        <Button variant="outlined" onClick={() => fetchRazorpayStatement(fromDate, toDate)}>Retry</Button>
                    </Paper>
                ) : !hasFetched ? (
                    <Paper elevation={0} sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: { xs: 2, sm: 3 }, border: '1px dashed', borderColor: 'divider', bgcolor: 'var(--surface-50)' }}>
                        <Calendar size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>No Date Range Selected</Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1, maxWidth: 400, textAlign: 'center' }}>Please select a preset date range or a custom date from the filter above to fetch Razorpay transactions.</Typography>
                    </Paper>
                ) : (
                    <DataTable
                        toolbarLeft={
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, width: '100%' }}>
                                <Box sx={{ flex: { xs: '1 1 100%', sm: 1 } }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Transactions & Raw Data</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Includes all fields: Description, Customer Info, RRN & JSON</Typography>
                                </Box>
                                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                    <Button sx={{ flex: 1, borderRadius: '50px', height: 40 }} size="small" variant="outlined" startIcon={<Download size={14} />} onClick={() => exportData('excel')} disabled={filteredTransactions.length === 0}>Excel</Button>
                                    <Button sx={{ flex: 1, borderRadius: '50px', height: 40 }} size="small" variant="outlined" startIcon={<Download size={14} />} onClick={() => exportData('csv')} disabled={filteredTransactions.length === 0}>CSV</Button>
                                </Stack>
                            </Box>
                        }
                        columns={['S.NO', 'DATE & TIME', 'PAYMENT ID', 'CUSTOMER', 'DESCRIPTION', 'AMOUNT', 'STATUS', 'METHOD (RRN)', 'NET (₹)', 'ACTION']}
                        rows={formattedRows}
                        alignments={['center', 'left', 'left', 'left', 'left', 'right', 'center', 'left', 'right', 'center']}
                        nonSortableColumns={[9]}
                        defaultRowsPerPage={10}
                    />
                )}
            </Box>

            {/* JSON Modal */}
            <Dialog open={!!selectedJsonModal} onClose={() => setSelectedJsonModal(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'var(--bg-accent-1, #f8fafc)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={20} color="#0284c7" />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Transaction Raw JSON ({selectedJsonModal?.paymentId})</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedJsonModal(null)}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: '#1e293b', p: 0 }}>
                    <Box component="pre" sx={{ p: 2, m: 0, color: '#e2e8f0', fontSize: '0.85rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                        {selectedJsonModal && JSON.stringify(selectedJsonModal.rawJson || selectedJsonModal, null, 2)}
                    </Box>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
