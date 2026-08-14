import React, { useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import Barcode from 'react-barcode';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import adityaLogo from '../../assets/Aditya University Gold Logo.png';
import adityaCircleLogo from '../../assets/Circle_Gold.svg';

const EventPassCard = ({ participant, isPdf = false }) => {
  const [imageError, setImageError] = useState(false);

  if (!participant) return null;

  const getCollegeName = (p) => {
    return p.college === 'Other College' && p.otherCollege ? p.otherCollege : (p.college || '-');
  };

  const isFemale = participant.gender?.toLowerCase() === 'female';
  const primaryDark = '#061638';
  const primaryGold = '#c69a37';

  return (
    <Box sx={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      zoom: isPdf ? 1 : { xs: 0.45, sm: 0.7, md: 1 }
    }}>
      <Box
        id="event-pass-card"
        sx={{
          width: isPdf ? '734px' : '750px',
          height: '480px',
          margin: '0 auto',
          marginTop: isPdf ? 0 : '24px',
          marginBottom: isPdf ? 0 : '16px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: isPdf ? 'none' : '0 10px 30px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* --- BACKGROUND ELEMENTS --- */}

        {/* SVG Base L-Shape Background */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg width="100%" height="100%" preserveAspectRatio="none">
            {/* Top right subtle dot pattern in white area */}
            <pattern id="dots" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
              <circle fill="rgba(6, 22, 56, 0.1)" cx="2" cy="2" r="2"></circle>
            </pattern>
            {/* Solid white base to prevent grey transparency in PDF */}
            <rect x="0" y="0" width={isPdf ? 734 : 750} height="480" fill="#ffffff" />
            <rect x="0" y="0" width={isPdf ? 734 : 750} height="480" fill="url(#dots)" />

            {/* Main Dark Blue L-Shape */}
            <path d={`M 0 0 L 250 0 C 180 30, 160 80, 160 160 L 160 380 L ${isPdf ? 734 : 750} 380 L ${isPdf ? 734 : 750} 480 L 0 480 Z`} fill={primaryDark} />

            {/* Thick Gold Accent Curve on the outside */}
            <path d="M 250 0 C 180 30, 160 80, 160 160 L 172 160 C 172 85, 190 35, 262 0 Z" fill={primaryGold} />

            {/* Subtle background waves in the blue area */}
            <path d="M -50 50 Q 50 100, 100 200 T 50 400" stroke="rgba(255,255,255,0.05)" strokeWidth="40" fill="none" />
            <path d="M -20 20 Q 80 70, 130 170 T 80 370" stroke="rgba(255,255,255,0.05)" strokeWidth="30" fill="none" />

            {/* Bottom left sweeping gold line */}
            <path d="M -20 400 Q 80 430, 155 365" stroke={primaryGold} strokeWidth="2.5" fill="none" />
          </svg>
        </Box>

        {/* Center Watermark inside Left Sidebar */}
        <Box component="img" src={adityaCircleLogo} alt="Watermark" sx={{ position: 'absolute', top: 120, left: -20, width: '200px', opacity: 0.15, pointerEvents: 'none', filter: 'grayscale(100%)', zIndex: 1 }} />

        {/* Right Side Watermark */}
        <Box component="img" src={adityaCircleLogo} alt="Watermark Right" sx={{ position: 'absolute', top: 100, right: -40, width: '350px', opacity: 0.05, pointerEvents: 'none', filter: 'grayscale(100%)', zIndex: 1 }} />

        {/* --- FOREGROUND CONTENT --- */}

        {/* Top Right Logo */}
        <Box sx={{ position: 'absolute', top: 30, right: 30, zIndex: 2 }}>
          <Box component="img" src={adityaLogo} alt="Aditya Logo" sx={{ width: '150px' }} />
        </Box>

        {/* Top Left Team ID */}
        <Box sx={{ position: 'absolute', top: 25, left: 30, zIndex: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.2 }}>TEAM ID</Typography>
          <Typography sx={{ color: primaryGold, fontSize: '15px', fontWeight: 700, lineHeight: 1.2, mt: 0.2 }}>{participant.teamId || 'VD26-1785574579911'}</Typography>
        </Box>

        {/* Left Sidebar Bottom Details */}
        <Box sx={{ position: 'absolute', top: 190, left: 15, zIndex: 2, display: 'flex', flexDirection: 'column' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarMonthIcon sx={{ color: '#fff', fontSize: 28, mr: 1 }} />
            <Box>
              <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2 }}>EVENT DATE</Typography>
              <Typography sx={{ color: primaryGold, fontSize: '15px', fontWeight: 800, lineHeight: 1.2, mt: 0.3 }}>SEP 15. 2026</Typography>
            </Box>
          </Box>
        </Box>

        {/* Center Header (VEDA, EVENT PASS, Code Reto) */}
        <Box sx={{ position: 'absolute', top: 20, left: 180, right: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ color: primaryDark, fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>VEDA</Typography>
            <Typography sx={{ color: primaryGold, fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>2K26</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, mb: 1 }}>
            <Box sx={{ width: '40px', height: '1.5px', backgroundColor: '#000' }} />
            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 700, letterSpacing: '4px' }}>EVENT PASS</Typography>
            <Box sx={{ width: '40px', height: '1.5px', backgroundColor: '#000' }} />
          </Box>
          <Box sx={{ backgroundColor: primaryDark, borderRadius: '20px', px: 3, py: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minWidth: '160px', width: 'max-content' }}>
            <Box sx={{ position: 'absolute', left: -5, width: '8px', height: '8px', backgroundColor: primaryGold, transform: 'rotate(45deg)' }} />
            <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap' }}>{participant.eventName || 'Code Reto'}</Typography>
            <Box sx={{ position: 'absolute', right: -5, width: '8px', height: '8px', backgroundColor: primaryGold, transform: 'rotate(45deg)' }} />
          </Box>
        </Box>


        {/* Central Details & Photo area */}
        <Box sx={{ position: 'absolute', top: 140, left: 190, right: 35, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>

          {/* Details List */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.2, pr: 2 }}>
            {[
              { icon: <PersonIcon />, label: 'Name', value: participant.name ? participant.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : participant.name },
              { icon: <BadgeIcon />, label: 'Roll', value: participant.roll },
              { icon: <SchoolIcon />, label: 'College', value: getCollegeName(participant) },
              { icon: <PhoneIcon />, label: 'Phone', value: participant.mobile },
            ].map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', position: 'relative', pb: 0.8 }}>
                <Box sx={{
                  backgroundColor: primaryDark,
                  color: '#fff',
                  borderRadius: '50%',
                  p: 0.6,
                  display: 'flex',
                  mr: 2,
                }}>
                  {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                </Box>
                <Typography sx={{ color: primaryDark, fontWeight: 800, fontSize: '16px', width: '90px', flexShrink: 0 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: primaryDark, fontWeight: 800, fontSize: '16px', mr: 1.5 }}>:</Typography>
                <Typography sx={{
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '16px',
                  flex: 1,
                  lineHeight: 1.2,
                  pt: 0.2,
                  whiteSpace: 'pre-line'
                }}>
                  {item.value || '-'}
                </Typography>
                {/* Divider */}
                {idx < 3 && (
                  <Box sx={{ position: 'absolute', bottom: -4, left: 45, right: 0, borderBottom: '2px dashed #cbd5e1' }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Photo Container */}
          <Box sx={{
            width: 140,
            height: 175,
            borderRadius: '12px',
            border: `2px solid ${primaryDark}`,
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            mt: 0
          }}>
            {!imageError ? (
              <Box
                component="img"
                crossOrigin="anonymous"
                src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:9000"}/api/proxy/student-photo/${participant.roll}`}
                alt={participant.name}
                onError={() => setImageError(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 0,
                  bgcolor: isFemale ? '#fdf2f8' : '#eff6ff',
                  color: isFemale ? '#db2777' : '#2563eb',
                  fontSize: '3rem'
                }}
              >
                <PersonIcon sx={{ fontSize: 70 }} />
              </Avatar>
            )}
          </Box>
        </Box>

        {/* Full Width Barcode Section */}
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#fff',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 -4px 15px rgba(0,0,0,0.1)',
          zIndex: 10,
          borderTop: `2px solid ${primaryDark}`
        }}>
          {participant.barcode ? (
            <>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', '& svg': { width: '100%', height: '60px', display: 'block' } }}>
                <Barcode
                  value={participant.barcode}
                  width={4}
                  height={60}
                  displayValue={false}
                  background="transparent"
                  lineColor="#000"
                  margin={0}
                />
              </Box>
              <Typography sx={{ color: '#000', fontWeight: 800, fontSize: '16px', mt: 0.5, letterSpacing: '8px' }}>
                {participant.barcode}
              </Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 800, mt: 0.8, textAlign: 'center' }}>
                <span style={{ color: '#000' }}>VENUE: </span>
                <span style={{ color: primaryGold }}>{participant.venue ? participant.venue.replace('\n', ' - ') : 'Room No: 021, Bill Gates Bhavan - GROUND FLOOR'}</span>
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">No Barcode</Typography>
          )}
        </Box>

      </Box>
    </Box>
  );
};

export default EventPassCard;
