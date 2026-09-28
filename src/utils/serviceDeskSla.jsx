import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    WarningAmber as WarningIcon
} from '@mui/icons-material';

export const PRIORITY_CONFIG = {
    CRITICAL: {
        label: 'Critical',
        slaHours: 2,
        slaText: '2 Hours',
        color: 'error',
        badgeBg: 'rgba(239, 68, 68, 0.12)',
        badgeColor: '#dc2626',
        badgeBorder: 'rgba(239, 68, 68, 0.3)'
    },
    HIGH: {
        label: 'High',
        slaHours: 4,
        slaText: '4 Hours',
        color: 'warning',
        badgeBg: 'rgba(249, 115, 22, 0.12)',
        badgeColor: '#ea580c',
        badgeBorder: 'rgba(249, 115, 22, 0.3)'
    },
    MEDIUM: {
        label: 'Medium',
        slaHours: 24,
        slaText: '24 Hours',
        color: 'primary',
        badgeBg: 'rgba(59, 130, 246, 0.12)',
        badgeColor: '#2563eb',
        badgeBorder: 'rgba(59, 130, 246, 0.3)'
    },
    LOW: {
        label: 'Low',
        slaHours: 72,
        slaText: '72 Hours',
        color: 'default',
        badgeBg: 'rgba(100, 116, 139, 0.12)',
        badgeColor: '#475569',
        badgeBorder: 'rgba(100, 116, 139, 0.3)'
    }
};

/**
 * Calculates due date based on priority SLA hours.
 */
export const calculateSlaDueDate = (priority, fromDate = new Date()) => {
    const config = PRIORITY_CONFIG[priority?.toUpperCase()] || PRIORITY_CONFIG.MEDIUM;
    const date = new Date(fromDate);
    date.setHours(date.getHours() + config.slaHours);
    return date;
};

/**
 * Formats a Date object to "YYYY-MM-DDTHH:mm" suitable for datetime-local inputs.
 */
export const formatForDateTimeInput = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    
    // Convert to local ISO format: YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats full readable date with time (e.g., "28 Sep 2026, 04:30 PM").
 */
export const formatExactDateTime = (dateInput) => {
    if (!dateInput) return '--';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Evaluates ticket overdue status and human readable duration strings.
 */
export const getTicketOverdueStatus = (dueDate, ticketStatus) => {
    if (!dueDate) {
        return { isOverdue: false, text: 'No Due Date', urgency: 'none', exact: '--' };
    }

    const isTerminal = ['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticketStatus);
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const exactFormatted = formatExactDateTime(dueDate);

    if (isTerminal) {
        return {
            isOverdue: false,
            isTerminal: true,
            text: `Due: ${exactFormatted}`,
            shortText: exactFormatted,
            urgency: 'completed',
            exact: exactFormatted
        };
    }

    const isOverdue = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const minutes = Math.floor((absDiffMs / (1000 * 60)) % 60);
    const hours = Math.floor((absDiffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    let durationStr = '';
    if (days > 0) {
        durationStr = `${days}d ${hours}h`;
    } else if (hours > 0) {
        durationStr = `${hours}h ${minutes}m`;
    } else {
        durationStr = `${minutes}m`;
    }

    if (isOverdue) {
        return {
            isOverdue: true,
            text: `Overdue by ${durationStr}`,
            shortText: `-${durationStr}`,
            urgency: 'overdue',
            exact: exactFormatted
        };
    }

    // Not overdue yet
    let urgency = 'normal';
    if (diffMs <= 2 * 60 * 60 * 1000) { // < 2 hours
        urgency = 'critical';
    } else if (diffMs <= 6 * 60 * 60 * 1000) { // < 6 hours
        urgency = 'warning';
    }

    return {
        isOverdue: false,
        text: `Due in ${durationStr}`,
        shortText: durationStr,
        urgency,
        exact: exactFormatted
    };
};

/**
 * Reusable Priority Badge Component
 */
export const PriorityBadge = ({ priority, size = 'small' }) => {
    const p = priority?.toUpperCase() || 'MEDIUM';
    const config = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.MEDIUM;

    return (
        <Tooltip title={`Priority: ${config.label} (${config.slaText} SLA)`} arrow>
            <Chip
                label={config.label}
                size={size}
                sx={{
                    fontWeight: 700,
                    fontSize: size === 'small' ? '0.75rem' : '0.825rem',
                    borderRadius: '6px',
                    backgroundColor: config.badgeBg,
                    color: config.badgeColor,
                    border: `1px solid ${config.badgeBorder}`
                }}
            />
        </Tooltip>
    );
};

/**
 * Reusable Due / Overdue Countdown Badge Component
 */
export const DueCountdownBadge = ({ dueDate, status, size = 'small' }) => {
    const info = getTicketOverdueStatus(dueDate, status);

    if (!dueDate) {
        return <Typography variant="caption" sx={{ color: 'text.secondary' }}>--</Typography>;
    }

    if (info.isTerminal) {
        return (
            <Tooltip title={`Due Date: ${info.exact}`} arrow>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: '0.9rem', opacity: 0.7 }} />
                    {info.exact}
                </Typography>
            </Tooltip>
        );
    }

    if (info.isOverdue) {
        return (
            <Tooltip title={`Target was: ${info.exact} (Overdue)`} arrow>
                <Chip
                    icon={<WarningIcon sx={{ fontSize: '1rem !important', color: '#dc2626 !important' }} />}
                    label={info.text}
                    size={size}
                    sx={{
                        fontWeight: 700,
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#dc2626',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '6px',
                        animation: 'pulse 2s infinite'
                    }}
                />
            </Tooltip>
        );
    }

    // Active, not overdue
    const colorMap = {
        critical: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.25)', icon: <WarningIcon sx={{ fontSize: '0.9rem !important' }} /> },
        warning: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', icon: <AccessTimeIcon sx={{ fontSize: '0.9rem !important' }} /> },
        normal: { bg: 'rgba(59, 130, 246, 0.08)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.2)', icon: <AccessTimeIcon sx={{ fontSize: '0.9rem !important' }} /> }
    };

    const style = colorMap[info.urgency] || colorMap.normal;

    return (
        <Tooltip title={`Target Due Date: ${info.exact}`} arrow>
            <Chip
                icon={React.cloneElement(style.icon, { sx: { color: `${style.color} !important`, fontSize: '0.9rem !important' } })}
                label={info.text}
                size={size}
                sx={{
                    fontWeight: 600,
                    backgroundColor: style.bg,
                    color: style.color,
                    border: `1px solid ${style.border}`,
                    borderRadius: '6px'
                }}
            />
        </Tooltip>
    );
};
