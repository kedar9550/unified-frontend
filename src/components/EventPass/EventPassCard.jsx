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
          width: '750px',
          height: '480px',
          margin: '0 auto',
          marginTop: '24px',
          marginBottom: '16px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* --- BACKGROUND ELEMENTS --- */}

        {/* Top Left Dots */}
        <Box sx={{
          position: 'absolute', top: 0, right: 0, width: '250px', height: '250px',
          backgroundImage: `radial-gradient(${primaryDark} 2px, transparent 2px)`,
          backgroundSize: '15px 15px',
          maskImage: 'radial-gradient(circle at top right, black, transparent 70%)',
          opacity: 0.6,
          zIndex: 0
        }} />

        {/* Top Left Box Shape */}
        <Box sx={{ position: 'absolute', top: -10, left: -10, width: '260px', height: '140px', backgroundColor: primaryGold, transform: 'skewX(-25deg)', transformOrigin: 'top right', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '240px', height: '125px', backgroundColor: primaryDark, transform: 'skewX(-25deg)', transformOrigin: 'top right', zIndex: 1 }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '10px 10px', opacity: 0.5 }} />
        </Box>

        {/* Middle Left Sidebar */}
        <Box sx={{ position: 'absolute', top: 120, left: -20, width: '230px', height: '230px', backgroundColor: primaryDark, transform: 'skewX(-15deg)', transformOrigin: 'top right', zIndex: 1 }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '10px 10px', opacity: 0.3 }} />
        </Box>

        {/* Bottom Left Shape */}
        <Box sx={{ position: 'absolute', bottom: -40, left: -50, width: '250px', height: '160px', backgroundColor: primaryGold, transform: 'rotate(45deg)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: -60, width: '250px', height: '150px', backgroundColor: primaryDark, transform: 'rotate(45deg)', zIndex: 1 }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '10px 10px', opacity: 0.3 }} />
        </Box>

        {/* Bottom Right Shape */}
        <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: '380px', height: '250px', backgroundColor: primaryGold, transform: 'rotate(-40deg)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: -65, right: -65, width: '380px', height: '250px', backgroundColor: primaryDark, transform: 'rotate(-40deg)', zIndex: 1 }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '10px 10px', opacity: 0.3 }} />
        </Box>

        {/* Center Watermark */}
        <Box component="img" src={adityaCircleLogo} alt="Watermark" sx={{ position: 'absolute', top: '55%', left: '55%', transform: 'translate(-50%, -50%)', width: '350px', opacity: 0.04, pointerEvents: 'none', filter: 'grayscale(100%)', zIndex: 0 }} />


        {/* --- FOREGROUND CONTENT --- */}

        {/* Top Left Logo */}
        <Box sx={{ position: 'absolute', top: 30, left: 20, zIndex: 2 }}>
          <Box component="img" src={adityaLogo} alt="Aditya Logo" sx={{ width: '170px' }} />
        </Box>

        {/* Left Sidebar Details */}
        <Box sx={{ position: 'absolute', top: 140, left: 20, width: '180px', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
          {participant.teamId && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '50%', p: 0.8, mr: 1.5, display: 'flex', border: `2px solid ${primaryDark}` }}>
                <GroupsIcon sx={{ color: primaryDark, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2 }}>TEAM ID</Typography>
                <Typography sx={{ color: primaryGold, fontSize: '13px', fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-all' }}>
                  {participant.teamId}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '50%', p: 0.8, mr: 1.5, display: 'flex', border: `2px solid ${primaryDark}` }}>
              <CalendarMonthIcon sx={{ color: primaryDark, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: 1.2 }}>EVENT DATE</Typography>
              <Typography sx={{ color: primaryGold, fontSize: '13px', fontWeight: 800, lineHeight: 1.2 }}>SEP 15, 2026</Typography>
            </Box>
          </Box>
        </Box>


        {/* Header Section (Top Right - VEDA 2K26 only) */}
        <Box sx={{ position: 'absolute', top: 30, right: 30, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <Typography sx={{ color: primaryDark, fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>VEDA</Typography>
            <Typography sx={{ color: primaryGold, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>2K26</Typography>
          </Box>
        </Box>

        {/* Center Top Details (Event Pass & Badge) */}
        <Box sx={{ position: 'absolute', top: 25, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <Typography sx={{ color: '#000', fontSize: '18px', fontWeight: 700, letterSpacing: '6px', mb: 1.5 }}>EVENT PASS</Typography>
          
          {/* Hexagon Pill Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', width: '220px', height: '32px', justifyContent: 'center' }}>
            <svg viewBox="0 0 220 32" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
              <polygon points="15,0 205,0 220,16 205,32 15,32 0,16" fill={primaryDark} />
              <polygon points="0,16 15,0 15,32" fill={primaryGold} />
              <polygon points="220,16 205,0 205,32" fill={primaryGold} />
            </svg>
            <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 600, lineHeight: 1, zIndex: 1, position: 'relative', mb: 0.5 }}>
              {participant.eventName || 'Code Reto'}
            </Typography>
          </Box>
        </Box>


        {/* Central Details & Photo area */}
        <Box sx={{ position: 'absolute', top: 145, left: 210, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>

          {/* Details List */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.2, pr: 2 }}>
            {[
              { icon: <PersonIcon />, label: 'Name', value: participant.name ? participant.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : participant.name },
              { icon: <BadgeIcon />, label: 'Roll', value: participant.roll },
              { icon: <SchoolIcon />, label: 'College', value: getCollegeName(participant) },
              { icon: <PhoneIcon />, label: 'Phone', value: participant.mobile },
              { icon: <LocationOnIcon />, label: 'Venue', value: participant.venue || 'Room No: 021, Bill Gates Bhavan - GROUND FLOOR', isVenue: true },
            ].map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', position: 'relative', pb: 1 }}>
                <Box sx={{
                  backgroundColor: primaryDark,
                  color: '#fff',
                  borderRadius: '50%',
                  p: 0.5,
                  display: 'flex',
                  mr: 2,
                }}>
                  {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                </Box>
                <Typography sx={{ color: primaryDark, fontWeight: 700, fontSize: '16px', width: '80px', flexShrink: 0 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: primaryDark, fontWeight: 700, fontSize: '16px', mr: 1.5 }}>:</Typography>
                <Typography sx={{
                  color: item.isVenue ? '#8b0000' : '#000',
                  fontWeight: 700,
                  fontSize: '15px',
                  flex: 1,
                  lineHeight: 1.3,
                  pt: 0.3
                }}>
                  {item.value || '-'}
                </Typography>
                {/* Subtle Divider */}
                {idx < 4 && (
                  <Box sx={{ position: 'absolute', bottom: -2, left: 45, right: 0, height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
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
            mb: 2
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
              <Barcode
                value={participant.barcode}
                width={3}
                height={60}
                displayValue={false}
                background="transparent"
                lineColor="#000"
                margin={0}
              />
              <Typography sx={{ color: '#000', fontWeight: 800, fontSize: '16px', mt: 0.5, letterSpacing: '8px' }}>
                {participant.barcode}
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
