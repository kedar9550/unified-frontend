import Loader from "./Loader";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Badge, IconButton, Popover, Box, Typography, List, ListItem, ListItemButton, ListItemText, ListItemAvatar, Avatar, Button, Divider, IconButton as MuiIconButton, MenuItem } from '@mui/material';
import { Notifications, DeleteOutlined, CheckCircle, InfoOutlined, WarningAmber, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = forwardRef((props, ref) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { user, activeRole, switchRole } = useAuth();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/notifications', { skipGlobalLoader: true });
            if (res.data.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_notification', (newNotif) => {
            // Add to top of list
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Optional: show a small toast for real-time alert
            toast.info(`New Notification: ${newNotif.title}`);
        });

        return () => {
            socket.off('new_notification');
        };
    }, [socket]);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    useImperativeHandle(ref, () => ({
        openMobile: (anchor) => setAnchorEl(anchor),
        unreadCount: unreadCount
    }));

    const handleNotificationClick = async (notif) => {
        // Mark as read if unread
        if (!notif.isRead) {
            try {
                await API.put(`/api/notifications/${notif._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark as read:", error);
            }
        }

        // Navigate and Auto-Switch Role
        if (notif.link) {
            let targetRole = notif.metadata?.targetRole;

            // Fallback auto-detection for old notifications or missing metadata
            if (!targetRole && user?.roles) {
                const userRoles = user.roles.map(r => r.role?.toUpperCase()).filter(Boolean);
                let link = notif.link.toLowerCase();
                const title = (notif.title || '').toLowerCase();
                const msg = (notif.message || '').toLowerCase();
                
                // --- Fix old invalid appraisal links ---
                if (link.includes('/uniprime/appraisals/my-appraisals')) {
                    link = '/faculty/appraisal';
                    notif.link = link; // update so navigate uses it
                } else if (link.includes('/uniprime/appraisals/pending')) {
                    if (userRoles.includes('SCHOOL_DEAN') || userRoles.includes('SCHOOL DEAN') || userRoles.includes('VICE CHANCELLOR')) {
                        link = '/appraisal/management-evaluate';
                    } else if (userRoles.includes('HOD') || userRoles.includes('DEPARTMENT_HOD') || userRoles.includes('DEPARTMENT HOD')) {
                        link = '/hod/appraisal-verification';
                    } else {
                        link = '/appraisal/management-evaluate';
                    }
                    notif.link = link; // update so navigate uses it
                } else if (link.includes('/hod/appraisal-verification')) {
                    if (userRoles.includes('SCHOOL_DEAN') || userRoles.includes('SCHOOL DEAN') || userRoles.includes('VICE CHANCELLOR') || userRoles.includes('PROVICE-CHANCELLOR (E & S)') || userRoles.includes('PRO_VICE_CHANCELLOR_E_S') || userRoles.includes('REGISTRAR')) {
                        link = '/appraisal/management-evaluate';
                        notif.link = link;
                    }
                }
                
                // --- Fix misrouted PROCTORING discrepancy links ---
                if (link.includes('/discrepancies') && msg.includes('proctoring')) {
                    link = '/feedback-management/discrepancies';
                    notif.link = link;
                }
                
                // --- Auto role detection ---
                if (link.includes('/service-desk')) {
                    if (link.includes('/admin') || link.includes('/reports')) {
                        if (userRoles.includes('SERVICE_ADMIN')) {
                            targetRole = 'SERVICE_ADMIN';
                        }
                    } else if (link.includes('/assigned-to-me')) {
                        if (userRoles.includes('SERVICE_EMP')) {
                            targetRole = 'SERVICE_EMP';
                        }
                    } else if (link.includes('/ticket/')) {
                        const isForEmp = title.includes('assign') || msg.includes('assigned to you') || msg.includes('by user');
                        if (isForEmp && userRoles.includes('SERVICE_EMP')) {
                            targetRole = 'SERVICE_EMP';
                        } else if (userRoles.includes('SERVICE_ADMIN') && (title.includes('admin') || title.includes('new ticket') || title.includes('escalated'))) {
                            targetRole = 'SERVICE_ADMIN';
                        } else {
                            // Creator roles
                            const clientRoles = ['FACULTY', 'STAFF', 'TECHNICAL STAFF', 'EXAMSECTION', 'HOD', 'STUDENT'];
                            targetRole = clientRoles.find(r => userRoles.includes(r));
                        }
                    }
                } else if (link.includes('/appraisal')) {
                    if (link.includes('/management-evaluate')) {
                        const mgtRoles = ['SCHOOL_DEAN', 'SCHOOL DEAN', 'VICE CHANCELLOR', 'PRO VICE-CHANCELLOR (E & S)', 'PRO_VICE_CHANCELLOR_E_S', 'REGISTRAR', 'DEAN - (IQAC)', 'DEAN - (ADMISSIONS)'];
                        targetRole = mgtRoles.find(r => userRoles.includes(r));
                    } else if (link.includes('/hod/')) {
                        targetRole = ['HOD', 'DEPARTMENT_HOD', 'DEPARTMENT HOD', 'SCHOOL_DEAN', 'SCHOOL DEAN'].find(r => userRoles.includes(r)) || 'HOD';
                    } else if (link.includes('/faculty/')) {
                        targetRole = 'FACULTY';
                    }
                } else if (link.includes('/research') || link.includes('/hod') || link.includes('/research-dean') || link.includes('/research-coordinator')) {
                    if (link.includes('/hod/')) {
                        if (userRoles.includes('HOD')) {
                            targetRole = 'HOD';
                        } else if (userRoles.includes('SCHOOL_DEAN') || userRoles.includes('SCHOOL DEAN')) {
                            const activeRolesList = userRoles.includes('SCHOOL_DEAN') ? 'SCHOOL_DEAN' : 'SCHOOL DEAN';
                            targetRole = activeRolesList;
                        }
                    } else if (link.includes('/research-dean/')) {
                        if (userRoles.includes('RESEARCH_DEAN')) {
                            targetRole = 'RESEARCH_DEAN';
                        }
                    } else if (link.includes('/research-coordinator/')) {
                        if (userRoles.includes('RESEARCH_COORDINATOR')) {
                            targetRole = 'RESEARCH_COORDINATOR';
                        }
                    } else {
                        if (userRoles.includes('FACULTY')) {
                            targetRole = 'FACULTY';
                        } else if (userRoles.includes('STUDENT')) {
                            targetRole = 'STUDENT';
                        }
                    }
                } else if (link.includes('/discrepancies')) {
                    if (link.includes('/exam-result/')) {
                        targetRole = ['EXAMSECTION', 'FACULTY'].find(r => userRoles.includes(r)) || 'FACULTY';
                    } else if (link.includes('/hod/')) {
                        targetRole = ['HOD', 'DEPARTMENT_HOD', 'DEPARTMENT HOD', 'SCHOOL_DEAN', 'SCHOOL DEAN'].find(r => userRoles.includes(r)) || 'HOD';
                    } else if (link.includes('/feedback-management/')) {
                        targetRole = ['FEEDBACK_COORDINATOR', 'FEEDBACK COORDINATOR'].find(r => userRoles.includes(r)) || 'FEEDBACK_COORDINATOR';
                    } else if (link.includes('/uniprime/')) {
                        targetRole = 'UNIPRIME';
                    }
                }
            }

            if (targetRole && targetRole !== activeRole) {
                switchRole(targetRole);
                toast.success(`Role switched to ${targetRole}`);
                handleClose();
                setTimeout(() => {
                    navigate(notif.link);
                }, 150);
            } else {
                handleClose();
                navigate(notif.link);
            }
        }
    };

    const handleDelete = async (e, notifId) => {
        e.stopPropagation(); // prevent clicking the list item
        try {
            await API.delete(`/api/notifications/${notifId}`);
            setNotifications(prev => prev.filter(n => n._id !== notifId));
            // Adjust unread count if it was unread
            const notif = notifications.find(n => n._id === notifId);
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await API.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle color="success" />;
            case 'ACTION_REQUIRED': return <WarningAmber color="warning" />;
            case 'REJECTED': return <WarningAmber color="error" />;
            default: return <InfoOutlined color="info" />;
        }
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <>
            <IconButton onClick={handleOpen} sx={{ color: "#fff", display: { xs: "none", md: "flex" } }}>
                <Badge badgeContent={unreadCount} color="error">
                    <Notifications sx={{ color: 'white !important' }} />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: { sx: { width: 360, maxHeight: 500, mt: 1.5, borderRadius: 2, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)" } }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Notifications</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                                Mark all as read
                            </Button>
                        )}
                        <IconButton size="small" onClick={handleClose} sx={{ display: { xs: 'flex', md: 'none' } }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Loader size={24} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Notifications sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                        <Typography variant="body2">No notifications yet</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notif) => (
                            <React.Fragment key={notif._id}>
                                <ListItemButton 
                                    alignItems="flex-start" 
                                    onClick={() => handleNotificationClick(notif)}
                                    sx={{ 
                                        bgcolor: notif.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'transparent' }}>
                                            {getIcon(notif.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" sx={{ fontWeight: notif.isRead ? 500 : 700, color: 'text.primary' }}>
                                                {notif.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {notif.message}
                                                </Typography>
                                                <Typography component="span" variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled' }}>
                                                    {new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString()}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                    <MuiIconButton size="small" onClick={(e) => handleDelete(e, notif._id)} sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}>
                                        <DeleteOutlined fontSize="small" />
                                    </MuiIconButton>
                                </ListItemButton>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
});

export default NotificationBell;
